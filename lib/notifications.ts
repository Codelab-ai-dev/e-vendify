/**
 * Sistema de notificaciones para e-vendify
 * Maneja el envío de emails y otras notificaciones
 */

import { supabaseAdmin } from './supabase-server'
import {
  sendEmail,
  getNewOrderEmailForSeller,
  getOrderConfirmationEmail,
  getOrderStatusUpdateEmail
} from './email'
import type { Order } from './types/orders'

/**
 * Notificar nueva orden al vendedor y cliente
 */
export async function notifyNewOrder(order: Order): Promise<void> {
  try {
    // 1. Obtener información de la tienda y vendedor
    const { data: store, error } = await supabaseAdmin
      .from('stores')
      .select('name, business_name, email, user_id')
      .eq('id', order.store_id)
      .single()

    if (error || !store) {
      console.error('Error fetching store for notification:', error)
      return
    }

    const storeName = store.business_name || store.name

    // 2. Enviar email al vendedor
    if (store.email) {
      const sellerEmail = getNewOrderEmailForSeller(order, storeName)
      sellerEmail.to = store.email

      const sellerResult = await sendEmail(sellerEmail)
      if (!sellerResult.success) {
        console.error('Error sending seller notification:', sellerResult.error)
      } else {
        console.log('Seller notification sent:', sellerResult.messageId)
      }
    }

    // 3. Enviar confirmación al cliente
    const customerEmail = getOrderConfirmationEmail(order, storeName)
    const customerResult = await sendEmail(customerEmail)

    if (!customerResult.success) {
      console.error('Error sending customer confirmation:', customerResult.error)
    } else {
      console.log('Customer confirmation sent:', customerResult.messageId)
    }

  } catch (error) {
    console.error('Error in notifyNewOrder:', error)
  }
}

/**
 * Notificar cambio de estado de orden al cliente
 */
export async function notifyOrderStatusChange(
  order: Order,
  newStatus: string
): Promise<void> {
  try {
    // Solo notificar cambios significativos
    const notifiableStatuses = ['paid', 'shipped', 'delivered', 'cancelled']
    if (!notifiableStatuses.includes(newStatus)) {
      return
    }

    // Obtener información de la tienda
    const { data: store, error } = await supabaseAdmin
      .from('stores')
      .select('name, business_name')
      .eq('id', order.store_id)
      .single()

    if (error || !store) {
      console.error('Error fetching store for status notification:', error)
      return
    }

    const storeName = store.business_name || store.name

    // Enviar email al cliente
    const email = getOrderStatusUpdateEmail(order, storeName, newStatus)
    const result = await sendEmail(email)

    if (!result.success) {
      console.error('Error sending status update email:', result.error)
    } else {
      console.log('Status update email sent:', result.messageId)
    }

  } catch (error) {
    console.error('Error in notifyOrderStatusChange:', error)
  }
}

/**
 * Generar mensaje de WhatsApp para el cliente
 */
export function generateWhatsAppMessage(order: Order, storeName: string): string {
  const items = order.order_items?.map(item =>
    `• ${item.quantity}x ${item.product_name} - $${item.price.toLocaleString()}`
  ).join('\n') || ''

  return `¡Hola! Soy de *${storeName}*

Tu pedido #${order.id.slice(0, 8).toUpperCase()} ha sido recibido:

${items}

*Total: $${order.total_amount.toLocaleString()}*

Te contactaremos pronto con los detalles de envío. ¡Gracias por tu compra! 🛒`
}

/**
 * Generar URL de WhatsApp
 */
export function getWhatsAppUrl(phone: string, message: string): string {
  // Limpiar número de teléfono (solo dígitos)
  const cleanPhone = phone.replace(/\D/g, '')

  // Agregar código de país si no lo tiene (México por defecto)
  const fullPhone = cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone

  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`
}

// ============================================================================
// Notificaciones WhatsApp via Twilio
// ============================================================================

/**
 * Enviar mensaje de WhatsApp via Twilio
 */
export async function sendWhatsAppNotification(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const twilio = await import('twilio')
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
      console.warn('[WhatsApp] Twilio credentials not configured')
      return { success: false, error: 'Twilio not configured' }
    }

    const client = twilio.default(accountSid, authToken)

    // Formatear números
    const toFormatted = phoneNumber.startsWith('+')
      ? `whatsapp:${phoneNumber}`
      : `whatsapp:+${phoneNumber}`
    const fromFormatted = fromNumber.startsWith('whatsapp:')
      ? fromNumber
      : `whatsapp:${fromNumber}`

    const result = await client.messages.create({
      body: message,
      from: fromFormatted,
      to: toFormatted,
    })

    console.log(`[WhatsApp] Notification sent: ${result.sid}`)
    return { success: true }

  } catch (error) {
    console.error('[WhatsApp] Error sending notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Notificar pago OXXO confirmado via WhatsApp
 */
export async function notifyOxxoPaymentConfirmed(order: Order): Promise<void> {
  if (!order.customer_phone) {
    console.log('[OXXO] No phone number for WhatsApp notification')
    return
  }

  try {
    // Obtener nombre de la tienda
    const { data: store } = await supabaseAdmin
      .from('stores')
      .select('name, business_name')
      .eq('id', order.store_id)
      .single()

    const storeName = store?.business_name || store?.name || 'la tienda'

    const message = `✅ *¡Pago recibido!*

Hola ${order.customer_name?.split(' ')[0] || 'Cliente'},

Recibimos tu pago en OXXO para el pedido de *${storeName}*.

📦 *Pedido:* #${order.id.slice(0, 8).toUpperCase()}
💰 *Total:* $${order.total_amount.toLocaleString('es-MX')} MXN

Tu pedido está siendo preparado. Te avisaremos cuando sea enviado.

¡Gracias por tu compra! 🙏`

    await sendWhatsAppNotification(order.customer_phone, message)

  } catch (error) {
    console.error('[OXXO] Error sending WhatsApp notification:', error)
  }
}
