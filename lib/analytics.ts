import { supabaseAdmin } from './supabase-server'

export interface StoreAnalytics {
  // Resumen general
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  averageOrderValue: number

  // Cambios vs período anterior
  revenueChange: number
  ordersChange: number

  // Por período
  revenueByDay: Array<{ date: string; revenue: number; orders: number }>
  revenueByMonth: Array<{ month: string; revenue: number; orders: number }>

  // Top productos
  topProducts: Array<{
    id: string
    name: string
    totalSold: number
    revenue: number
  }>

  // Estados de órdenes
  ordersByStatus: Record<string, number>

  // Métodos de entrega
  deliveryMethods: Record<string, number>
}

/**
 * Obtener analytics de una tienda
 */
export async function getStoreAnalytics(
  storeId: string,
  period: 'week' | 'month' | 'year' = 'month'
): Promise<{ analytics: StoreAnalytics | null; error: Error | null }> {
  try {
    // Calcular fechas según el período
    const now = new Date()
    let startDate: Date
    let previousStartDate: Date

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1)
        break
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    }

    // 1. Obtener órdenes del período actual
    const { data: currentOrders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, total_amount, status, delivery_method, created_at')
      .eq('store_id', storeId)
      .gte('created_at', startDate.toISOString())
      .in('status', ['paid', 'shipped', 'delivered'])

    if (ordersError) throw ordersError

    // 2. Obtener órdenes del período anterior (para comparación)
    const { data: previousOrders, error: prevError } = await supabaseAdmin
      .from('orders')
      .select('id, total_amount')
      .eq('store_id', storeId)
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString())
      .in('status', ['paid', 'shipped', 'delivered'])

    if (prevError) throw prevError

    // 3. Obtener productos
    const { count: productsCount } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)

    // 4. Obtener top productos vendidos
    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select(`
        product_id,
        product_name,
        quantity,
        price,
        order:orders!inner(store_id, status, created_at)
      `)
      .eq('orders.store_id', storeId)
      .gte('orders.created_at', startDate.toISOString())
      .in('orders.status', ['paid', 'shipped', 'delivered'])

    if (itemsError) throw itemsError

    // 5. Obtener todas las órdenes para estadísticas de estado
    const { data: allOrders, error: allOrdersError } = await supabaseAdmin
      .from('orders')
      .select('status, delivery_method')
      .eq('store_id', storeId)

    if (allOrdersError) throw allOrdersError

    // Calcular métricas
    const orders = currentOrders || []
    const prevOrdersData = previousOrders || []
    const items = orderItems || []
    const allOrdersData = allOrders || []

    // Revenue actual y anterior
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
    const previousRevenue = prevOrdersData.reduce((sum, o) => sum + (o.total_amount || 0), 0)

    // Cambio porcentual
    const revenueChange = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : totalRevenue > 0 ? 100 : 0

    const ordersChange = prevOrdersData.length > 0
      ? ((orders.length - prevOrdersData.length) / prevOrdersData.length) * 100
      : orders.length > 0 ? 100 : 0

    // Revenue por día
    const revenueByDayMap = new Map<string, { revenue: number; orders: number }>()
    orders.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0]
      const existing = revenueByDayMap.get(date) || { revenue: 0, orders: 0 }
      revenueByDayMap.set(date, {
        revenue: existing.revenue + (order.total_amount || 0),
        orders: existing.orders + 1
      })
    })

    // Llenar días faltantes
    const revenueByDay: Array<{ date: string; revenue: number; orders: number }> = []
    const dayMs = 24 * 60 * 60 * 1000
    for (let d = new Date(startDate); d <= now; d = new Date(d.getTime() + dayMs)) {
      const dateStr = d.toISOString().split('T')[0]
      const data = revenueByDayMap.get(dateStr) || { revenue: 0, orders: 0 }
      revenueByDay.push({ date: dateStr, ...data })
    }

    // Top productos
    const productStats = new Map<string, { name: string; totalSold: number; revenue: number }>()
    items.forEach(item => {
      const id = item.product_id || item.product_name
      const existing = productStats.get(id) || { name: item.product_name, totalSold: 0, revenue: 0 }
      productStats.set(id, {
        name: item.product_name,
        totalSold: existing.totalSold + item.quantity,
        revenue: existing.revenue + (item.price * item.quantity)
      })
    })

    const topProducts = Array.from(productStats.entries())
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Estados de órdenes
    const ordersByStatus: Record<string, number> = {}
    allOrdersData.forEach(o => {
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1
    })

    // Métodos de entrega
    const deliveryMethods: Record<string, number> = {}
    allOrdersData.forEach(o => {
      const method = o.delivery_method || 'no_especificado'
      deliveryMethods[method] = (deliveryMethods[method] || 0) + 1
    })

    return {
      analytics: {
        totalRevenue,
        totalOrders: orders.length,
        totalProducts: productsCount || 0,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        revenueChange,
        ordersChange,
        revenueByDay,
        revenueByMonth: [], // Se puede implementar después
        topProducts,
        ordersByStatus,
        deliveryMethods,
      },
      error: null
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return { analytics: null, error: error as Error }
  }
}

/**
 * Obtener resumen rápido (para widgets del dashboard)
 */
export async function getQuickStats(storeId: string): Promise<{
  todayRevenue: number
  todayOrders: number
  pendingOrders: number
  lowStockProducts: number
}> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Órdenes de hoy
    const { data: todayOrders } = await supabaseAdmin
      .from('orders')
      .select('total_amount')
      .eq('store_id', storeId)
      .gte('created_at', today.toISOString())
      .in('status', ['paid', 'shipped', 'delivered'])

    // Órdenes pendientes
    const { count: pendingCount } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('status', 'pending')

    const orders = todayOrders || []

    return {
      todayRevenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
      todayOrders: orders.length,
      pendingOrders: pendingCount || 0,
      lowStockProducts: 0 // Implementar cuando haya sistema de inventario
    }
  } catch (error) {
    console.error('Error fetching quick stats:', error)
    return {
      todayRevenue: 0,
      todayOrders: 0,
      pendingOrders: 0,
      lowStockProducts: 0
    }
  }
}
