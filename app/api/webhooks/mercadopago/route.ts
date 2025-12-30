import { NextRequest, NextResponse } from 'next/server'
import { getPaymentDetails, mapPaymentStatusToOrderStatus } from '@/lib/mercadopago'
import { updateOrderStatus, getOrderById } from '@/lib/orders'
import crypto from 'crypto'

/**
 * Verificar firma del webhook de MercadoPago
 */
function verifyWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET

  // Si no hay secret configurado, permitir en desarrollo
  if (!secret) {
    console.warn('MERCADOPAGO_WEBHOOK_SECRET no configurado')
    return process.env.NODE_ENV === 'development'
  }

  if (!xSignature || !xRequestId) {
    return false
  }

  // Parsear x-signature header
  const parts = xSignature.split(',')
  let ts = ''
  let v1 = ''

  for (const part of parts) {
    const [key, value] = part.split('=')
    if (key === 'ts') ts = value
    if (key === 'v1') v1 = value
  }

  // Construir el manifest
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

  // Calcular HMAC
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex')

  return hmac === v1
}

export async function POST(request: NextRequest) {
  try {
    // 1. Obtener headers de verificación
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')

    // 2. Parsear body
    const body = await request.json()

    console.log('MercadoPago webhook recibido:', {
      type: body.type,
      action: body.action,
      dataId: body.data?.id,
    })

    // Solo procesar notificaciones de pago
    if (body.type !== 'payment') {
      return NextResponse.json({ received: true })
    }

    const paymentId = body.data?.id

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Missing payment ID' },
        { status: 400 }
      )
    }

    // 3. Verificar firma
    const isValid = verifyWebhookSignature(xSignature, xRequestId, paymentId)

    if (!isValid) {
      console.warn('Firma de webhook inválida')
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    // 4. Obtener detalles del pago desde MercadoPago
    const paymentDetails = await getPaymentDetails(paymentId)

    if (!paymentDetails.success || !paymentDetails.payment) {
      console.error('No se pudo obtener detalles del pago')
      return NextResponse.json(
        { error: 'Could not fetch payment' },
        { status: 500 }
      )
    }

    const { payment } = paymentDetails
    const orderId = payment.externalReference

    if (!orderId) {
      console.error('El pago no tiene external_reference (order_id)')
      return NextResponse.json({ received: true })
    }

    // 5. Verificar que la orden existe
    const { order, error: orderError } = await getOrderById(orderId)

    if (orderError || !order) {
      console.error('Orden no encontrada:', orderId)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // 6. Mapear estado de MP a estado de orden
    const newStatus = mapPaymentStatusToOrderStatus(payment.status || '')

    // 7. Actualizar orden solo si el estado cambió
    if (order.status !== newStatus) {
      const { success, error } = await updateOrderStatus(
        orderId,
        newStatus,
        paymentId
      )

      if (!success) {
        console.error('Error al actualizar orden:', error)
        return NextResponse.json(
          { error: 'Failed to update order' },
          { status: 500 }
        )
      }

      console.log(`Orden ${orderId} actualizada a ${newStatus}`)
    }

    // 8. Responder éxito
    return NextResponse.json({
      received: true,
      order_id: orderId,
      new_status: newStatus,
    })

  } catch (error) {
    console.error('Error procesando webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET para verificación de URL
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'MercadoPago webhook endpoint',
  })
}
