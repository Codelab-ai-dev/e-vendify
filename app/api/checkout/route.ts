import { NextRequest, NextResponse } from 'next/server'
import { createOrder, getOrderById } from '@/lib/orders'
import { createPaymentPreference } from '@/lib/mercadopago'
import { supabaseAdmin } from '@/lib/supabase-server'
import { notifyNewOrder } from '@/lib/notifications'
import { checkStockAvailability } from '@/lib/inventory'
import { z } from 'zod'

// Schema de validación
const checkoutSchema = z.object({
  store_id: z.string().uuid('ID de tienda inválido'),
  customer: z.object({
    name: z.string().min(2, 'Nombre requerido'),
    email: z.string().email('Email inválido'),
    phone: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
    delivery_location: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number().positive('Precio debe ser positivo'),
    quantity: z.number().int().positive('Cantidad debe ser positiva'),
  })).min(1, 'El carrito está vacío'),
  delivery_method: z.enum(['delivery', 'pickup']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Parsear y validar el body
    const body = await request.json()
    console.log('Checkout request body:', JSON.stringify(body, null, 2))

    const validation = checkoutSchema.safeParse(body)

    if (!validation.success) {
      console.log('Validation error:', validation.error.flatten())
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { store_id, customer, items, delivery_method } = validation.data

    // 2. Verificar que la tienda existe
    console.log('Looking for store:', store_id)
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('id, name, business_name')
      .eq('id', store_id)
      .single()

    if (storeError) {
      console.log('Store lookup error:', storeError)
    }

    if (storeError || !store) {
      return NextResponse.json(
        { error: 'Tienda no encontrada' },
        { status: 404 }
      )
    }
    console.log('Store found:', store.name)

    // 3. Verificar disponibilidad de stock
    try {
      const stockCheck = await checkStockAvailability(
        items.map(item => ({ product_id: item.id, quantity: item.quantity }))
      )

      if (!stockCheck.available) {
        const unavailableNames = stockCheck.unavailableItems
          .map(item => `${item.product_name} (disponible: ${item.available}, solicitado: ${item.requested})`)
          .join(', ')

        return NextResponse.json(
          {
            error: 'Stock insuficiente',
            details: `Los siguientes productos no tienen suficiente stock: ${unavailableNames}`,
            unavailable_items: stockCheck.unavailableItems
          },
          { status: 400 }
        )
      }
    } catch (stockError) {
      console.error('Error checking stock:', stockError)
      // No bloquear si falla la verificación, solo loggear
    }

    // 4. Calcular total
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // 5. Crear orden en BD
    const { order, error: orderError } = await createOrder({
      store_id,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      customer_address: customer.address,
      customer_notes: customer.notes,
      delivery_method: delivery_method,
      delivery_location: customer.delivery_location,
      total_amount: total,
      items: items.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    })

    if (orderError || !order) {
      console.error('Error creating order:', orderError)
      return NextResponse.json(
        { error: 'Error al crear la orden', details: orderError?.message },
        { status: 500 }
      )
    }
    console.log('Order created:', order.id)

    // 6. Crear preferencia en MercadoPago
    console.log('Creating MercadoPago preference...')
    const preference = await createPaymentPreference({
      orderId: order.id,
      storeId: store_id,
      storeName: store.business_name || store.name,
      items: items.map(item => ({
        id: item.id,
        title: item.name,
        quantity: item.quantity,
        unit_price: item.price,
      })),
      payer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    })

    if (!preference.success) {
      console.error('MercadoPago error:', preference.error)
      // Si falla MP, actualizar orden a cancelled
      await supabaseAdmin
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id)

      return NextResponse.json(
        { error: 'Error al procesar el pago', details: preference.error },
        { status: 500 }
      )
    }
    console.log('MercadoPago preference created:', preference.preferenceId)

    // 7. Enviar notificaciones (async, no bloquea la respuesta)
    getOrderById(order.id).then(({ order: fullOrder }) => {
      if (fullOrder) {
        notifyNewOrder(fullOrder).catch(err => {
          console.error('Error sending order notification:', err)
        })
      }
    })

    // 8. Retornar URL de pago
    return NextResponse.json({
      success: true,
      order_id: order.id,
      payment_url: preference.initPoint,
      sandbox_url: preference.sandboxInitPoint,
    })

  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
