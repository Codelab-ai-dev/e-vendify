import { supabaseAdmin } from './supabase-server'
import type { Order, CreateOrderInput, OrderStatus } from './types/orders'

/**
 * Crear una nueva orden con sus items
 */
export async function createOrder(input: CreateOrderInput): Promise<{
  order: Order | null
  error: Error | null
}> {
  try {
    // 1. Crear la orden
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        store_id: input.store_id,
        customer_name: input.customer_name,
        customer_email: input.customer_email,
        customer_phone: input.customer_phone || null,
        customer_address: input.customer_address || null,
        customer_notes: input.customer_notes || null,
        delivery_method: input.delivery_method || null,
        delivery_location: input.delivery_location || null,
        total_amount: input.total_amount,
        discount_amount: input.discount_amount || 0,
        coupon_id: input.coupon_id || null,
        status: 'pending' as OrderStatus,
      })
      .select()
      .single()

    if (orderError) throw orderError
    if (!order) throw new Error('No se pudo crear la orden')

    // 2. Crear los items de la orden
    const orderItems = input.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      price: item.price,
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      // Rollback: eliminar la orden si falla la inserción de items
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      throw itemsError
    }

    return { order: order as Order, error: null }
  } catch (error) {
    console.error('Error creating order:', error)
    return { order: null, error: error as Error }
  }
}

/**
 * Actualizar estado de una orden
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  paymentId?: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    }

    if (paymentId) {
      updateData.payment_id = paymentId
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Error updating order status:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Obtener orden por ID
 */
export async function getOrderById(orderId: string): Promise<{
  order: Order | null
  error: Error | null
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .single()

    if (error) throw error

    return { order: data as Order, error: null }
  } catch (error) {
    console.error('Error fetching order:', error)
    return { order: null, error: error as Error }
  }
}

/**
 * Obtener orden por payment_id de MercadoPago
 */
export async function getOrderByPaymentId(paymentId: string): Promise<{
  order: Order | null
  error: Error | null
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('payment_id', paymentId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return { order: data as Order | null, error: null }
  } catch (error) {
    console.error('Error fetching order by payment_id:', error)
    return { order: null, error: error as Error }
  }
}

/**
 * Obtener órdenes por tienda
 */
export async function getOrdersByStore(storeId: string): Promise<{
  orders: Order[]
  error: Error | null
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { orders: (data as Order[]) || [], error: null }
  } catch (error) {
    console.error('Error fetching orders:', error)
    return { orders: [], error: error as Error }
  }
}

/**
 * Cancelar una orden
 */
export async function cancelOrder(orderId: string): Promise<{
  success: boolean
  error: Error | null
}> {
  return updateOrderStatus(orderId, 'cancelled')
}
