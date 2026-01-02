// ============================================================================
// E-VENDIFY: Twilio WhatsApp Webhook
// POST /api/agent/twilio
// Recibe mensajes de WhatsApp via Twilio y responde usando el agente RAG
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { AgentService } from '../core/agent.service';
import { IdentityService } from '../core/identity.service';
import { TwilioWebhookPayload, AgentRequest } from '@/lib/types/agent.types';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER!;
// URL del webhook configurada en Twilio (para validación de firma)
const TWILIO_WEBHOOK_URL = process.env.TWILIO_WEBHOOK_URL || 'https://e-vendify.com/api/agent/twilio';

// Cliente Twilio
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Cache para deduplicación (evitar procesar mensajes duplicados)
const processedMessages = new Map<string, number>();
const DEDUP_WINDOW_MS = 60000; // 60 segundos

// ============================================================================
// WEBHOOK POST - Recibir mensajes
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Parsear body como form-urlencoded (formato Twilio)
    const formData = await request.formData();
    const payload = Object.fromEntries(formData) as unknown as TwilioWebhookPayload;

    console.log(`[Twilio] Incoming message from ${payload.From}`);

    // 2. Validar firma de Twilio (seguridad) - solo en producción
    const signature = request.headers.get('x-twilio-signature');
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction && signature && TWILIO_AUTH_TOKEN) {
      // Usar URL fija para validación (la URL configurada en Twilio)
      const isValid = twilio.validateRequest(
        TWILIO_AUTH_TOKEN,
        signature,
        TWILIO_WEBHOOK_URL,
        Object.fromEntries(formData) as Record<string, string>
      );

      if (!isValid) {
        console.warn('[Twilio] Invalid signature. Expected URL:', TWILIO_WEBHOOK_URL);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    }

    // 3. Deduplicación
    if (payload.MessageSid) {
      const existing = processedMessages.get(payload.MessageSid);
      if (existing && Date.now() - existing < DEDUP_WINDOW_MS) {
        console.log(`[Twilio] Duplicate message ignored: ${payload.MessageSid}`);
        return NextResponse.json({ status: 'duplicate' });
      }
      processedMessages.set(payload.MessageSid, Date.now());

      // Limpiar cache viejo
      for (const [id, time] of processedMessages) {
        if (Date.now() - time > DEDUP_WINDOW_MS) {
          processedMessages.delete(id);
        }
      }
    }

    // 4. Extraer mensaje
    const messageText = extractMessageText(payload);
    if (!messageText) {
      console.log('[Twilio] Empty message, ignoring');
      return NextResponse.json({ status: 'empty' });
    }

    // 5. Extraer número de teléfono (formato: whatsapp:+5215512345678)
    const phoneNumber = payload.From.replace('whatsapp:', '').replace(/\s/g, '').trim();

    console.log(`[Twilio] Incoming message from ${phoneNumber}: "${messageText}"`);

    // 6. NUEVO: Verificar si el mensaje es un código de tienda
    if (IdentityService.isStoreCode(messageText)) {
      const store = await IdentityService.getStoreByCode(messageText);

      if (store) {
        // Vincular cliente a la tienda
        const { isNew } = await IdentityService.linkCustomerToStore(phoneNumber, store.id);

        console.log(`[Twilio] Customer linked to store: ${store.name} (${isNew ? 'new' : 'existing'})`);

        // Enviar mensaje de bienvenida
        const welcomeMessage = isNew
          ? `¡Hola! 👋 Bienvenido a *${store.name}*\n\nSoy tu asistente virtual. ¿En qué puedo ayudarte?\n\nPuedes preguntarme sobre:\n• Productos disponibles\n• Precios y promociones\n• Estado de tu pedido`
          : `¡Hola de nuevo! 👋 Estás conectado con *${store.name}*\n\n¿En qué puedo ayudarte hoy?`;

        await sendWhatsAppMessage(phoneNumber, welcomeMessage);

        return new NextResponse(
          '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
          { status: 200, headers: { 'Content-Type': 'text/xml' } }
        );
      } else {
        // Código inválido
        await sendWhatsAppMessage(
          phoneNumber,
          'El código ingresado no es válido. Por favor verifica e intenta de nuevo, o escanea el código QR de la tienda.'
        );
        return new NextResponse(
          '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
          { status: 200, headers: { 'Content-Type': 'text/xml' } }
        );
      }
    }

    // 7. Buscar tienda vinculada al cliente
    let storeId: string;
    const linkedStore = await IdentityService.getLinkedStore(phoneNumber);

    if (linkedStore) {
      storeId = linkedStore.storeId;
      console.log(`[Twilio] Using linked store: ${linkedStore.storeName}`);
    } else {
      // Cliente no tiene tienda vinculada - pedir código
      console.log('[Twilio] No linked store, asking for code');

      await sendWhatsAppMessage(
        phoneNumber,
        '¡Hola! 👋 Para comenzar, necesito saber con qué tienda deseas comunicarte.\n\n' +
        'Por favor:\n' +
        '1. Escanea el código QR de la tienda, o\n' +
        '2. Escribe el código de la tienda (ej: ABC123)\n\n' +
        'Puedes encontrar el código en la página web o redes sociales de la tienda.'
      );

      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { status: 200, headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // 8. Construir request del agente
    const agentRequest: AgentRequest = {
      channel: 'whatsapp',
      phoneNumber,
      storeId,
      message: messageText,
      messageId: payload.MessageSid,
      timestamp: new Date().toISOString(),
      metadata: {
        twilioAccountSid: payload.AccountSid,
        mediaUrl: payload.MediaUrl0,
        mediaType: payload.MediaContentType0,
      },
    };

    // 9. Procesar con el agente
    const response = await AgentService.processRequest(agentRequest);

    // 9. Enviar respuesta via Twilio
    await sendWhatsAppMessage(phoneNumber, response.text);

    console.log(
      `[Twilio] Response sent in ${Date.now() - startTime}ms, LLM cost: $${response.metadata.llmCostUsd.toFixed(6)}`
    );

    // 10. Responder a Twilio (TwiML vacío - ya enviamos via API)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      }
    );
  } catch (error) {
    console.error('[Twilio] Webhook error:', error);

    // Intentar enviar mensaje de error al usuario
    try {
      const formData = await request.clone().formData();
      const from = formData.get('From') as string;
      if (from) {
        const phoneNumber = from.replace('whatsapp:', '');
        await sendWhatsAppMessage(
          phoneNumber,
          'Lo siento, tuve un problema procesando tu mensaje. Por favor intenta de nuevo en unos momentos.'
        );
      }
    } catch {
      // Ignorar errores al enviar mensaje de error
    }

    return NextResponse.json(
      { error: 'Internal error', message: String(error) },
      { status: 500 }
    );
  }
}

// ============================================================================
// WEBHOOK GET - Verificación de Twilio
// ============================================================================

export async function GET() {
  // Health check del agente
  const health = await AgentService.healthCheck();

  return NextResponse.json({
    status: health.healthy ? 'ok' : 'unhealthy',
    adapter: 'twilio',
    version: '1.0.0',
    services: health.services,
    errors: health.errors,
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Extrae el texto del mensaje de diferentes tipos de respuesta
 */
function extractMessageText(payload: TwilioWebhookPayload): string {
  // Respuesta de botón
  if (payload.ButtonText) {
    return payload.ButtonText;
  }

  // Respuesta de lista
  if (payload.ListTitle) {
    return payload.ListTitle;
  }

  // Mensaje de texto normal
  return payload.Body?.trim() || '';
}

/**
 * Obtiene el ID de tienda asociado al número de Twilio
 * Por ahora usa un mapeo simple, pero podría ser una tabla en BD
 */
async function getStoreIdForTwilioNumber(
  twilioNumber: string
): Promise<string | null> {
  // Limpiar formato
  const cleanNumber = twilioNumber.replace('whatsapp:', '');

  // Por ahora, usar lookup en la tabla stores o config
  // En producción: tabla twilio_numbers -> store_id
  const storeId = await IdentityService.getStoreIdByTwilioNumber(cleanNumber);

  return storeId;
}

/**
 * Envía un mensaje de WhatsApp via Twilio
 */
async function sendWhatsAppMessage(
  to: string,
  body: string
): Promise<string | null> {
  try {
    // Limpiar y formatear números
    const toFormatted = to.startsWith('+') ? `whatsapp:${to}` : `whatsapp:+${to}`;
    const fromFormatted = TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:')
      ? TWILIO_WHATSAPP_NUMBER
      : `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;

    // Truncar mensaje si es muy largo (límite WhatsApp: 4096 chars)
    const maxLength = 4000;
    let messageBody = body;
    if (body.length > maxLength) {
      messageBody = body.substring(0, maxLength - 20) + '\n\n...mensaje truncado';
    }

    const message = await twilioClient.messages.create({
      body: messageBody,
      from: fromFormatted,
      to: toFormatted,
    });

    console.log(`[Twilio] Message sent: ${message.sid}`);
    return message.sid;
  } catch (error) {
    console.error('[Twilio] Send message error:', error);
    return null;
  }
}

/**
 * Envía mensaje con botones interactivos (requiere template aprobado)
 */
async function sendWhatsAppButtonMessage(
  to: string,
  contentSid: string,
  variables: Record<string, string>
): Promise<string | null> {
  try {
    const toFormatted = to.startsWith('+') ? `whatsapp:${to}` : `whatsapp:+${to}`;
    const fromFormatted = TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:')
      ? TWILIO_WHATSAPP_NUMBER
      : `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;

    const message = await twilioClient.messages.create({
      contentSid,
      contentVariables: JSON.stringify(variables),
      from: fromFormatted,
      to: toFormatted,
    });

    return message.sid;
  } catch (error) {
    console.error('[Twilio] Send button message error:', error);
    return null;
  }
}

/**
 * Envía imagen de producto
 */
async function sendWhatsAppMedia(
  to: string,
  mediaUrl: string,
  caption?: string
): Promise<string | null> {
  try {
    const toFormatted = to.startsWith('+') ? `whatsapp:${to}` : `whatsapp:+${to}`;
    const fromFormatted = TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:')
      ? TWILIO_WHATSAPP_NUMBER
      : `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;

    const message = await twilioClient.messages.create({
      body: caption || '',
      mediaUrl: [mediaUrl],
      from: fromFormatted,
      to: toFormatted,
    });

    return message.sid;
  } catch (error) {
    console.error('[Twilio] Send media error:', error);
    return null;
  }
}
