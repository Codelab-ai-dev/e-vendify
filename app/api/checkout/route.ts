import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@/lib/orders'
import { createPaymentPreference } from '@/lib/mercadopago'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

// Schema de validación
const checkoutSchema = z.object({
  store_id: z.string().uuid('ID de tienda inválido'),
  customer: z.object({
    name: z.string().min(2, 'Nombre requerido'),
    email: z.string().email('Email inválido'),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number().positive('Precio debe ser positivo'),
    quantity: z.number().int().positive('Cantidad debe ser positiva'),
  })).min(1, 'El carrito está vacío'),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Parsear y validar el body
    const body = await request.json()
    const validation = checkoutSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { store_id, customer, items } = validation.data

    // 2. Verificar que la tienda existe
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name, business_name')
      .eq('id', store_id)
      .single()

    if (storeError || !store) {
      return NextResponse.json(
        { error: 'Tienda no encontrada' },
        { status: 404 }
      )
    }

    // 3. Calcular total
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // 4. Crear orden en BD
    const { order, error: orderError } = await createOrder({
      store_id,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      customer_address: customer.address,
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
        { error: 'Error al crear la orden' },
        { status: 500 }
      )
    }

    // 5. Crear preferencia en MercadoPago
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
      // Si falla MP, actualizar orden a cancelled
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id)

      return NextResponse.json(
        { error: 'Error al procesar el pago', details: preference.error },
        { status: 500 }
      )
    }

    // 6. Retornar URL de pago
    return NextResponse.json({
      success: true,
      order_id: order.id,
      payment_url: preference.initPoint,
      sandbox_url: preference.sandboxInitPoint,
    })

  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
