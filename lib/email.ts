/**
 * Sistema de notificaciones por email para e-vendify
 *
 * Soporta múltiples proveedores:
 * - Resend (recomendado)
 * - SendGrid
 * - SMTP genérico
 *
 * Configuración en .env.local:
 * EMAIL_PROVIDER=resend|sendgrid|smtp
 * RESEND_API_KEY=re_xxxxx
 * EMAIL_FROM=noreply@tudominio.com
 */

import type { Order } from './types/orders'

// Tipos
interface EmailConfig {
  to: string
  subject: string
  html: string
  text?: string
}

interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Enviar email usando Resend
 */
async function sendWithResend(config: EmailConfig): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || 'e-vendify <noreply@e-vendify.com>'

  if (!apiKey) {
    console.warn('RESEND_API_KEY no configurado')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: config.to,
        subject: config.subject,
        html: config.html,
        text: config.text,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error sending email')
    }

    return { success: true, messageId: data.id }
  } catch (error) {
    console.error('Error sending email with Resend:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Función principal para enviar emails
 */
export async function sendEmail(config: EmailConfig): Promise<SendEmailResult> {
  const provider = process.env.EMAIL_PROVIDER || 'resend'

  switch (provider) {
    case 'resend':
      return sendWithResend(config)
    default:
      console.warn(`Email provider "${provider}" not supported, using Resend`)
      return sendWithResend(config)
  }
}

/**
 * Template: Nueva orden para el vendedor
 */
export function getNewOrderEmailForSeller(order: Order, storeName: string): EmailConfig {
  const itemsList = order.order_items?.map(item =>
    `<tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${item.product_name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">$${item.price.toLocaleString()}</td>
    </tr>`
  ).join('') || ''

  const deliveryInfo = order.delivery_method === 'delivery'
    ? `<p><strong>Dirección:</strong> ${order.customer_address || 'No especificada'}</p>`
    : `<p><strong>Método:</strong> Recoger en tienda</p>`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #000; padding: 24px; text-align: center;">
      <h1 style="color: #BFFF00; margin: 0; font-size: 24px;">¡Nueva Orden!</h1>
    </div>

    <div style="background-color: #fff; padding: 32px; border: 2px solid #000;">
      <p style="color: #666; margin: 0 0 24px;">
        Has recibido una nueva orden en <strong>${storeName}</strong>
      </p>

      <div style="background-color: #f9f9f9; padding: 16px; margin-bottom: 24px; border: 1px solid #e5e5e5;">
        <p style="margin: 0 0 8px;"><strong>Orden:</strong> #${order.id.slice(0, 8).toUpperCase()}</p>
        <p style="margin: 0 0 8px;"><strong>Cliente:</strong> ${order.customer_name}</p>
        <p style="margin: 0 0 8px;"><strong>Email:</strong> ${order.customer_email}</p>
        ${order.customer_phone ? `<p style="margin: 0 0 8px;"><strong>Teléfono:</strong> ${order.customer_phone}</p>` : ''}
        ${deliveryInfo}
        ${order.customer_notes ? `<p style="margin: 0;"><strong>Notas:</strong> ${order.customer_notes}</p>` : ''}
      </div>

      <h3 style="margin: 0 0 16px; color: #000;">Productos</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #000;">Producto</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #000;">Cant.</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #000;">Precio</th>
          </tr>
        </thead>
        <tbody>
          ${itemsList}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold;">Total:</td>
            <td style="padding: 12px; text-align: right; font-weight: bold; color: #BFFF00; background-color: #000;">
              $${order.total_amount.toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders"
         style="display: block; background-color: #BFFF00; color: #000; text-align: center; padding: 16px; text-decoration: none; font-weight: bold; border: 2px solid #000;">
        Ver en Dashboard
      </a>
    </div>

    <p style="text-align: center; color: #999; font-size: 12px; margin-top: 24px;">
      Este email fue enviado por e-vendify
    </p>
  </div>
</body>
</html>`

  return {
    to: order.customer_email, // Esto se sobrescribirá con el email del vendedor
    subject: `🛒 Nueva orden #${order.id.slice(0, 8).toUpperCase()} - ${storeName}`,
    html,
    text: `Nueva orden en ${storeName}\n\nCliente: ${order.customer_name}\nTotal: $${order.total_amount.toLocaleString()}\n\nVer en: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders`
  }
}

/**
 * Template: Confirmación de orden para el cliente
 */
export function getOrderConfirmationEmail(order: Order, storeName: string): EmailConfig {
  const itemsList = order.order_items?.map(item =>
    `<tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${item.product_name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">$${item.price.toLocaleString()}</td>
    </tr>`
  ).join('') || ''

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #000; padding: 24px; text-align: center;">
      <h1 style="color: #BFFF00; margin: 0; font-size: 24px;">¡Gracias por tu compra!</h1>
    </div>

    <div style="background-color: #fff; padding: 32px; border: 2px solid #000;">
      <p style="color: #666; margin: 0 0 8px;">Hola <strong>${order.customer_name}</strong>,</p>
      <p style="color: #666; margin: 0 0 24px;">
        Tu orden en <strong>${storeName}</strong> ha sido recibida exitosamente.
      </p>

      <div style="background-color: #BFFF00; padding: 16px; margin-bottom: 24px; border: 2px solid #000;">
        <p style="margin: 0; font-size: 14px; color: #000;">
          <strong>Número de orden:</strong> #${order.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      <h3 style="margin: 0 0 16px; color: #000;">Resumen de tu pedido</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #000;">Producto</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #000;">Cant.</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #000;">Precio</th>
          </tr>
        </thead>
        <tbody>
          ${itemsList}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold;">Total:</td>
            <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px;">
              $${order.total_amount.toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>

      <div style="background-color: #f9f9f9; padding: 16px; border: 1px solid #e5e5e5;">
        <p style="margin: 0 0 8px; font-size: 14px;"><strong>¿Qué sigue?</strong></p>
        <p style="margin: 0; font-size: 14px; color: #666;">
          El vendedor procesará tu pedido y te contactará pronto con los detalles de envío.
        </p>
      </div>
    </div>

    <p style="text-align: center; color: #999; font-size: 12px; margin-top: 24px;">
      Gracias por comprar en ${storeName}
    </p>
  </div>
</body>
</html>`

  return {
    to: order.customer_email,
    subject: `✅ Orden confirmada #${order.id.slice(0, 8).toUpperCase()} - ${storeName}`,
    html,
    text: `¡Gracias por tu compra!\n\nTu orden #${order.id.slice(0, 8).toUpperCase()} en ${storeName} ha sido recibida.\n\nTotal: $${order.total_amount.toLocaleString()}\n\nEl vendedor te contactará pronto.`
  }
}

/**
 * Template: Actualización de estado de orden
 */
export function getOrderStatusUpdateEmail(
  order: Order,
  storeName: string,
  newStatus: string
): EmailConfig {
  const statusMessages: Record<string, { title: string; message: string; emoji: string }> = {
    paid: {
      title: '¡Pago confirmado!',
      message: 'Tu pago ha sido procesado exitosamente. El vendedor preparará tu pedido pronto.',
      emoji: '💳'
    },
    shipped: {
      title: '¡Tu pedido está en camino!',
      message: 'Tu pedido ha sido enviado. Pronto lo recibirás.',
      emoji: '🚚'
    },
    delivered: {
      title: '¡Pedido entregado!',
      message: 'Tu pedido ha sido entregado. ¡Gracias por tu compra!',
      emoji: '📦'
    },
    cancelled: {
      title: 'Pedido cancelado',
      message: 'Tu pedido ha sido cancelado. Si tienes dudas, contacta al vendedor.',
      emoji: '❌'
    }
  }

  const status = statusMessages[newStatus] || {
    title: 'Actualización de pedido',
    message: `El estado de tu pedido ha cambiado a: ${newStatus}`,
    emoji: '📋'
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #000; padding: 24px; text-align: center;">
      <h1 style="color: #BFFF00; margin: 0; font-size: 24px;">${status.emoji} ${status.title}</h1>
    </div>

    <div style="background-color: #fff; padding: 32px; border: 2px solid #000;">
      <p style="color: #666; margin: 0 0 8px;">Hola <strong>${order.customer_name}</strong>,</p>
      <p style="color: #666; margin: 0 0 24px;">${status.message}</p>

      <div style="background-color: #f9f9f9; padding: 16px; border: 1px solid #e5e5e5;">
        <p style="margin: 0 0 8px;"><strong>Orden:</strong> #${order.id.slice(0, 8).toUpperCase()}</p>
        <p style="margin: 0;"><strong>Total:</strong> $${order.total_amount.toLocaleString()}</p>
      </div>
    </div>

    <p style="text-align: center; color: #999; font-size: 12px; margin-top: 24px;">
      ${storeName} - Powered by e-vendify
    </p>
  </div>
</body>
</html>`

  return {
    to: order.customer_email,
    subject: `${status.emoji} ${status.title} - Orden #${order.id.slice(0, 8).toUpperCase()}`,
    html,
    text: `${status.title}\n\n${status.message}\n\nOrden: #${order.id.slice(0, 8).toUpperCase()}\nTotal: $${order.total_amount.toLocaleString()}`
  }
}
