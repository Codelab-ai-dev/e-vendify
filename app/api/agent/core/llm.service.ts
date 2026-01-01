// ============================================================================
// E-VENDIFY: LLM Service
// Generación de respuestas naturales usando OpenAI/Groq
// ============================================================================

import {
  LLMRequest,
  LLMResponse,
  Intent,
  CustomerIdentity,
  RAGChunk,
  ActionResult,
  ConversationMessage,
  AgentError,
  DEFAULT_AGENT_CONFIG,
} from '@/lib/types/agent.types';
import { RAGService } from './rag.service';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai'; // 'openai' | 'groq'
const LLM_MODEL = process.env.LLM_MODEL || DEFAULT_AGENT_CONFIG.llmModel;
const LLM_TEMPERATURE = parseFloat(
  process.env.LLM_TEMPERATURE || String(DEFAULT_AGENT_CONFIG.llmTemperature)
);
const LLM_MAX_TOKENS = parseInt(
  process.env.LLM_MAX_TOKENS || String(DEFAULT_AGENT_CONFIG.llmMaxTokens)
);

// API Keys
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// URLs
const OPENAI_BASE_URL = 'https://api.openai.com/v1';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

// Pricing por 1M tokens (USD)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
  'mixtral-8x7b-32768': { input: 0.24, output: 0.24 },
};

export class LLMService {
  /**
   * Genera respuesta del agente usando LLM
   */
  static async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      // 1. Construir mensajes para el LLM
      const messages = this.buildMessages(request);

      // 2. Llamar al LLM
      const { baseUrl, apiKey } = this.getProviderConfig();

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages,
          temperature: LLM_TEMPERATURE,
          max_tokens: LLM_MAX_TOKENS,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'LLM API error');
      }

      const data = await response.json();
      const choice = data.choices[0];

      // 3. Calcular métricas
      const tokensInput = data.usage?.prompt_tokens || 0;
      const tokensOutput = data.usage?.completion_tokens || 0;
      const costUsd = this.calculateCost(LLM_MODEL, tokensInput, tokensOutput);

      const latencyMs = Date.now() - startTime;

      console.log(
        `[LLM] Response generated: ${tokensInput}+${tokensOutput} tokens, $${costUsd.toFixed(6)}, ${latencyMs}ms`
      );

      return {
        text: choice.message.content || '',
        model: LLM_MODEL,
        tokensInput,
        tokensOutput,
        costUsd,
        finishReason: choice.finish_reason,
        latencyMs,
      };
    } catch (error) {
      console.error('[LLM] Generation failed:', error);
      throw new AgentError('Error al generar respuesta', 'LLM_FAILED', {
        error: String(error),
      });
    }
  }

  /**
   * Construye los mensajes para el LLM
   */
  private static buildMessages(
    request: LLMRequest
  ): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    // 1. System prompt
    const systemPrompt = this.buildSystemPrompt(request.identity, request.intent);
    messages.push({ role: 'system', content: systemPrompt });

    // 2. Contexto RAG (si hay)
    if (request.ragContext.length > 0) {
      const ragText = RAGService.formatChunksForLLM(request.ragContext);
      messages.push({
        role: 'system',
        content: `INFORMACIÓN RELEVANTE DE LA TIENDA:\n\n${ragText}`,
      });
    }

    // 3. Contexto SQL (si hay)
    if (request.sqlContext) {
      messages.push({
        role: 'system',
        content: `DATOS DEL SISTEMA:\n\n${request.sqlContext}`,
      });
    }

    // 4. Resultados de acciones (si hay)
    if (request.actionResults && request.actionResults.length > 0) {
      const actionsText = this.formatActionResults(request.actionResults);
      messages.push({
        role: 'system',
        content: `ACCIONES EJECUTADAS:\n\n${actionsText}`,
      });
    }

    // 5. Historial de conversación (últimos N mensajes)
    for (const msg of request.conversationHistory.slice(-6)) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // 6. Mensaje actual del usuario
    messages.push({ role: 'user', content: request.userMessage });

    return messages;
  }

  /**
   * Construye el system prompt dinámico
   */
  private static buildSystemPrompt(
    identity: CustomerIdentity,
    intent: Intent
  ): string {
    const { storeName, customerName, isNewCustomer, cartItemsCount } = identity;

    let prompt = `Eres el asistente de ventas virtual de "${storeName}". Tu objetivo es ayudar a los clientes a:
1. Encontrar productos que necesitan
2. Resolver dudas sobre productos, precios y disponibilidad
3. Gestionar su carrito de compras
4. Completar sus compras de forma fácil

REGLAS IMPORTANTES:
- Responde SIEMPRE en español
- Sé amable, profesional y conciso
- SOLO menciona productos que aparezcan en "INFORMACIÓN RELEVANTE DE LA TIENDA"
- NUNCA inventes productos, precios o información que no esté en los datos proporcionados
- Si no hay productos en los datos, di honestamente "No encontré productos que coincidan con tu búsqueda" y ofrece ayuda alternativa
- Las respuestas deben ser cortas (máximo 3-4 párrafos)
- Formato para WhatsApp: usa *negritas* para énfasis, evita markdown complejo
- Incluye precios en formato: $X,XXX MXN

CONTEXTO DEL CLIENTE:
- Nombre: ${customerName || 'Cliente'}
- Es cliente nuevo: ${isNewCustomer ? 'Sí' : 'No'}
- Productos en carrito: ${cartItemsCount}
`;

    // Instrucciones específicas por intent
    prompt += this.getIntentInstructions(intent);

    // Personalización según estado
    if (isNewCustomer) {
      prompt += `\n\nEs la primera vez de este cliente. Dale una breve bienvenida y ofrece ayuda.`;
    }

    if (cartItemsCount > 0) {
      prompt += `\n\nEl cliente tiene ${cartItemsCount} productos en su carrito. Puedes mencionarlo si es relevante.`;
    }

    return prompt;
  }

  /**
   * Instrucciones específicas por tipo de intent
   */
  private static getIntentInstructions(intent: Intent): string {
    const instructions: Record<Intent, string> = {
      greeting: `
INTENT: Saludo
- Da una bienvenida cálida y breve
- Pregunta en qué puedes ayudar
- Menciona que pueden buscar productos, ver ofertas, etc.`,

      search_product: `
INTENT: Búsqueda de productos
- Presenta los productos encontrados de forma atractiva
- Incluye nombre, precio y una breve descripción
- Si hay varios, destaca 2-3 mejores opciones
- Ofrece agregar al carrito si el cliente está interesado`,

      price_inquiry: `
INTENT: Consulta de precio
- Proporciona el precio exacto del producto
- Menciona si hay descuentos o promociones
- Compara con otras opciones si es relevante`,

      stock_check: `
INTENT: Verificar disponibilidad
- Confirma si el producto está disponible
- Indica cantidad en stock si es baja
- Sugiere alternativas si está agotado`,

      add_to_cart: `
INTENT: Agregar al carrito
- Confirma que el producto se agregó
- Muestra el nuevo total del carrito
- Pregunta si desea algo más o proceder al pago`,

      view_cart: `
INTENT: Ver carrito
- Lista los productos con cantidades y precios
- Muestra subtotal y total
- Ofrece opciones: seguir comprando, modificar, o pagar`,

      remove_from_cart: `
INTENT: Quitar del carrito
- Confirma qué producto se eliminó
- Muestra el carrito actualizado
- Pregunta si desea algo más`,

      update_cart: `
INTENT: Actualizar carrito
- Confirma el cambio realizado
- Muestra el nuevo total
- Ofrece continuar o finalizar`,

      checkout: `
INTENT: Checkout/Pagar
- Muestra resumen del pedido
- Proporciona el link de pago
- Explica los siguientes pasos
- Ofrece ayuda si tienen dudas`,

      apply_coupon: `
INTENT: Aplicar cupón
- Confirma si el cupón es válido
- Muestra el descuento aplicado
- Actualiza el total del carrito`,

      order_tracking: `
INTENT: Rastreo de pedido
- Proporciona el estado actual del pedido
- Incluye fecha estimada si es posible
- Ofrece más detalles si los solicitan`,

      order_history: `
INTENT: Historial de pedidos
- Lista los pedidos recientes
- Incluye estado y total de cada uno
- Ofrece ver detalles de alguno específico`,

      faq: `
INTENT: Pregunta frecuente
- Responde la pregunta de forma clara y directa
- Usa la información de la tienda proporcionada
- Ofrece ayuda adicional si es necesario`,

      store_info: `
INTENT: Información de la tienda
- Proporciona los datos solicitados
- Incluye horarios, ubicación, contacto según aplique`,

      support: `
INTENT: Soporte/Ayuda
- Muestra empatía si hay un problema
- Ofrece soluciones o escalación
- Proporciona opciones de contacto humano`,

      farewell: `
INTENT: Despedida
- Despídete amablemente
- Agradece su visita
- Invita a regresar pronto`,

      unknown: `
INTENT: No identificado
- Intenta entender qué necesita el cliente
- Ofrece opciones de ayuda
- Sugiere buscar productos o ver el catálogo`,
    };

    return instructions[intent] || instructions.unknown;
  }

  /**
   * Formatea los resultados de acciones ejecutadas
   */
  private static formatActionResults(results: ActionResult[]): string {
    return results
      .map((r) => {
        const status = r.success ? '✓' : '✗';
        const error = r.error ? ` (Error: ${r.error})` : '';
        return `${status} ${r.type}${error}`;
      })
      .join('\n');
  }

  /**
   * Obtiene configuración del proveedor de LLM
   */
  private static getProviderConfig(): { baseUrl: string; apiKey: string } {
    if (LLM_PROVIDER === 'groq' && GROQ_API_KEY) {
      return { baseUrl: GROQ_BASE_URL, apiKey: GROQ_API_KEY };
    }
    return { baseUrl: OPENAI_BASE_URL, apiKey: OPENAI_API_KEY };
  }

  /**
   * Calcula el costo en USD de una llamada
   */
  private static calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const pricing = MODEL_PRICING[model] || { input: 0.5, output: 1.5 };
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    return inputCost + outputCost;
  }

  /**
   * Genera respuesta de fallback cuando el LLM falla
   */
  static getFallbackResponse(intent: Intent): string {
    const fallbacks: Partial<Record<Intent, string>> = {
      greeting:
        '¡Hola! Bienvenido a nuestra tienda. ¿En qué puedo ayudarte hoy?',
      search_product:
        'Estoy buscando productos para ti. ¿Podrías darme más detalles de lo que necesitas?',
      checkout:
        'Para proceder con tu compra, por favor revisa tu carrito y confirma los productos.',
      support:
        'Entiendo que necesitas ayuda. Por favor describe tu problema y haré lo posible por asistirte.',
      unknown:
        '¿En qué puedo ayudarte? Puedo buscar productos, revisar tu carrito o resolver dudas.',
    };

    return (
      fallbacks[intent] ||
      'Disculpa, tuve un problema procesando tu mensaje. ¿Podrías intentar de nuevo?'
    );
  }

  /**
   * Verifica la salud del servicio LLM
   */
  static async healthCheck(): Promise<{
    healthy: boolean;
    provider: string;
    model: string;
    error?: string;
  }> {
    try {
      const { baseUrl, apiKey } = this.getProviderConfig();

      const response = await fetch(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      return {
        healthy: response.ok,
        provider: LLM_PROVIDER,
        model: LLM_MODEL,
      };
    } catch (error) {
      return {
        healthy: false,
        provider: LLM_PROVIDER,
        model: LLM_MODEL,
        error: String(error),
      };
    }
  }
}
