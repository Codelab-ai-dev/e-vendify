// Cliente para WhatsApp Cloud API
import type { OutgoingMessage, ButtonMessage, ListMessage, TextMessage } from './types'

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0'

interface SendMessageParams {
  phoneNumberId: string
  accessToken: string
  to: string
  message: OutgoingMessage
}

interface SendMessageResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Enviar mensaje por WhatsApp
 */
export async function sendWhatsAppMessage({
  phoneNumberId,
  accessToken,
  to,
  message
}: SendMessageParams): Promise<SendMessageResult> {
  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          ...message
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('WhatsApp API error:', data)
      return {
        success: false,
        error: data.error?.message || 'Error al enviar mensaje'
      }
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Enviar mensaje de texto simple
 */
export function createTextMessage(text: string): TextMessage {
  return {
    type: 'text',
    text: { body: text }
  }
}

/**
 * Crear mensaje con botones (máximo 3 botones)
 */
export function createButtonMessage(
  body: string,
  buttons: Array<{ id: string; title: string }>,
  header?: string,
  footer?: string
): ButtonMessage {
  const message: ButtonMessage = {
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body },
      action: {
        buttons: buttons.slice(0, 3).map(btn => ({
          type: 'reply',
          reply: {
            id: btn.id,
            title: btn.title.slice(0, 20) // Max 20 chars
          }
        }))
      }
    }
  }

  if (header) {
    message.interactive.header = { type: 'text', text: header }
  }

  if (footer) {
    message.interactive.footer = { text: footer }
  }

  return message
}

/**
 * Crear mensaje con lista (para mostrar productos/categorías)
 */
export function createListMessage(
  body: string,
  buttonText: string,
  sections: Array<{
    title: string
    items: Array<{ id: string; title: string; description?: string }>
  }>,
  header?: string,
  footer?: string
): ListMessage {
  const message: ListMessage = {
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: body },
      action: {
        button: buttonText.slice(0, 20),
        sections: sections.map(section => ({
          title: section.title,
          rows: section.items.map(item => ({
            id: item.id,
            title: item.title.slice(0, 24),
            description: item.description?.slice(0, 72)
          }))
        }))
      }
    }
  }

  if (header) {
    message.interactive.header = { type: 'text', text: header }
  }

  if (footer) {
    message.interactive.footer = { text: footer }
  }

  return message
}

/**
 * Marcar mensaje como leído
 */
export async function markMessageAsRead(
  phoneNumberId: string,
  accessToken: string,
  messageId: string
): Promise<void> {
  try {
    await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      }),
    })
  } catch (error) {
    console.error('Error marking message as read:', error)
  }
}

/**
 * Enviar ubicación
 */
export async function sendLocationRequest(
  phoneNumberId: string,
  accessToken: string,
  to: string
): Promise<SendMessageResult> {
  return sendWhatsAppMessage({
    phoneNumberId,
    accessToken,
    to,
    message: createTextMessage('📍 Por favor, envíame tu ubicación usando el botón de adjuntar > Ubicación')
  })
}
