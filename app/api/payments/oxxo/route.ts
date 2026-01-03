// ============================================================================
// E-VENDIFY: OXXO Pay Endpoint
// POST /api/payments/oxxo
// Genera un ticket de pago OXXO para una orden
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createOxxoTicket, formatOxxoReference } from '@/lib/mercadopago'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================================
// POST - Crear ticket OXXO
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, storeId, phoneNumber } = body

    // Validar inputs
    if (!orderId) {
      return NextResponse.json(
        { error: 'Se requiere orderId' },
        { status: 400 }
      )
    }

    // Obtener la orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        customer_name,
        customer_email,
        customer_phone,
        status,
        payment_method,
        oxxo_reference,
        store_id,
        stores (
          id,
          name,
          business_name
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('[OXXO] Order not found:', orderError)
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    // Si ya tiene referencia OXXO, devolverla
    if (order.oxxo_reference) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        reference: formatOxxoReference(order.oxxo_reference),
        amount: order.total_amount,
        message: 'Ya tienes un ticket de pago activo'
      })
    }

    // Verificar que la orden esté pendiente
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: `La orden ya tiene estado: ${order.status}` },
        { status: 400 }
      )
    }

    // Extraer nombre y apellido
    const nameParts = (order.customer_name || 'Cliente').split(' ')
    const firstName = nameParts[0] || 'Cliente'
    const lastName = nameParts.slice(1).join(' ') || 'E-Vendify'

    // Crear ticket OXXO
    const storeData = order.stores as { id: string; name: string; business_name: string } | null
    const storeName = storeData?.business_name || storeData?.name || 'E-Vendify'

    const result = await createOxxoTicket({
      orderId: order.id,
      storeId: order.store_id,
      amount: order.total_amount,
      description: `Pedido ${storeName}`,
      payer: {
        email: order.customer_email || 'cliente@e-vendify.com',
        firstName,
        lastName,
      }
    })

    if (!result.success) {
      console.error('[OXXO] Error creating ticket:', result.error)
      return NextResponse.json(
        { error: result.error || 'Error al generar ticket OXXO' },
        { status: 500 }
      )
    }

    // Guardar referencia en la orden
    await supabase
      .from('orders')
      .update({
        payment_method: 'oxxo',
        oxxo_reference: result.reference,
        oxxo_ticket_id: result.ticketId,
        oxxo_expiration: result.expirationDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    console.log(`[OXXO] Ticket created for order ${orderId}: ${result.reference}`)

    return NextResponse.json({
      success: true,
      reference: formatOxxoReference(result.reference!),
      referenceRaw: result.reference,
      amount: result.amount,
      expirationDate: result.expirationDate,
      ticketUrl: result.ticketUrl,
      ticketId: result.ticketId,
      message: `Paga $${result.amount?.toLocaleString('es-MX')} MXN en cualquier OXXO`
    })

  } catch (error) {
    console.error('[OXXO] Endpoint error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET - Consultar estado de ticket OXXO
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('orderId')
  const reference = searchParams.get('reference')

  if (!orderId && !reference) {
    return NextResponse.json(
      { error: 'Se requiere orderId o reference' },
      { status: 400 }
    )
  }

  try {
    let query = supabase
      .from('orders')
      .select('id, status, total_amount, oxxo_reference, oxxo_expiration, payment_method')

    if (orderId) {
      query = query.eq('id', orderId)
    } else if (reference) {
      query = query.eq('oxxo_reference', reference)
    }

    const { data: order, error } = await query.single()

    if (error || !order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: order.status,
      isPaid: order.status === 'paid',
      amount: order.total_amount,
      reference: order.oxxo_reference ? formatOxxoReference(order.oxxo_reference) : null,
      expiration: order.oxxo_expiration,
      paymentMethod: order.payment_method,
    })

  } catch (error) {
    console.error('[OXXO] Error checking status:', error)
    return NextResponse.json(
      { error: 'Error al consultar estado' },
      { status: 500 }
    )
  }
}
