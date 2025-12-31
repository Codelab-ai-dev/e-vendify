import { supabase } from './supabase'
import type {
  ProductInventory,
  InventoryMovement,
  InventoryStats,
  UpdateInventoryInput,
  AdjustStockInput,
  LowStockProduct
} from './types/inventory'

/**
 * Obtener productos con información de inventario para una tienda
 */
export async function getStoreInventory(storeId: string): Promise<ProductInventory[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku, image_url, stock_quantity, low_stock_threshold, track_inventory, is_available, category, price')
    .eq('store_id', storeId)
    .order('name')

  if (error) {
    console.error('Error fetching inventory:', error)
    throw error
  }

  return data || []
}

/**
 * Obtener estadísticas de inventario para una tienda
 */
export async function getInventoryStats(storeId: string): Promise<InventoryStats> {
  const { data: products, error } = await supabase
    .from('products')
    .select('stock_quantity, low_stock_threshold, track_inventory, price')
    .eq('store_id', storeId)

  if (error) {
    console.error('Error fetching inventory stats:', error)
    throw error
  }

  const trackedProducts = products?.filter(p => p.track_inventory) || []

  return {
    total_products: products?.length || 0,
    tracked_products: trackedProducts.length,
    low_stock_count: trackedProducts.filter(p =>
      p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold
    ).length,
    out_of_stock_count: trackedProducts.filter(p => p.stock_quantity <= 0).length,
    total_stock_value: trackedProducts.reduce((sum, p) =>
      sum + (p.stock_quantity * p.price), 0
    )
  }
}

/**
 * Actualizar configuración de inventario de un producto
 */
export async function updateProductInventory(input: UpdateInventoryInput): Promise<void> {
  const updateData: Record<string, unknown> = {}

  if (input.stock_quantity !== undefined) updateData.stock_quantity = input.stock_quantity
  if (input.low_stock_threshold !== undefined) updateData.low_stock_threshold = input.low_stock_threshold
  if (input.track_inventory !== undefined) updateData.track_inventory = input.track_inventory
  if (input.sku !== undefined) updateData.sku = input.sku || null

  const { error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', input.product_id)

  if (error) {
    console.error('Error updating inventory:', error)
    throw error
  }
}

/**
 * Ajustar stock de un producto (agregar o restar)
 */
export async function adjustStock(input: AdjustStockInput): Promise<void> {
  // Obtener stock actual
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('stock_quantity, store_id, track_inventory')
    .eq('id', input.product_id)
    .single()

  if (fetchError || !product) {
    throw new Error('Producto no encontrado')
  }

  const newQuantity = product.stock_quantity + input.quantity_change

  if (newQuantity < 0) {
    throw new Error('El stock no puede ser negativo')
  }

  // Actualizar stock
  const { error: updateError } = await supabase
    .from('products')
    .update({ stock_quantity: newQuantity })
    .eq('id', input.product_id)

  if (updateError) {
    throw updateError
  }

  // Registrar movimiento si el producto rastrea inventario
  if (product.track_inventory) {
    const { error: movementError } = await supabase
      .from('inventory_movements')
      .insert({
        product_id: input.product_id,
        store_id: product.store_id,
        quantity_change: input.quantity_change,
        previous_quantity: product.stock_quantity,
        new_quantity: newQuantity,
        movement_type: input.movement_type,
        notes: input.notes || null
      })

    if (movementError) {
      console.error('Error logging movement:', movementError)
      // No lanzar error, el stock ya se actualizó
    }
  }
}

/**
 * Obtener historial de movimientos de inventario
 */
export async function getInventoryMovements(
  storeId: string,
  options?: {
    productId?: string
    limit?: number
    offset?: number
  }
): Promise<InventoryMovement[]> {
  let query = supabase
    .from('inventory_movements')
    .select(`
      *,
      product:products(name, sku, image_url)
    `)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (options?.productId) {
    query = query.eq('product_id', options.productId)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching movements:', error)
    throw error
  }

  return data || []
}

/**
 * Obtener productos con stock bajo
 */
export async function getLowStockProducts(storeId: string): Promise<LowStockProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      store_id,
      name,
      sku,
      stock_quantity,
      low_stock_threshold,
      image_url
    `)
    .eq('store_id', storeId)
    .eq('track_inventory', true)
    .gt('stock_quantity', 0)
    .lte('stock_quantity', supabase.rpc ? 'low_stock_threshold' : 5) // Fallback

  if (error) {
    // Fallback: filtrar en cliente
    const { data: allProducts, error: allError } = await supabase
      .from('products')
      .select('id, store_id, name, sku, stock_quantity, low_stock_threshold, image_url')
      .eq('store_id', storeId)
      .eq('track_inventory', true)

    if (allError) {
      console.error('Error fetching low stock products:', allError)
      throw allError
    }

    return (allProducts || [])
      .filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold)
      .map(p => ({
        ...p,
        store_name: '',
        store_email: ''
      })) as LowStockProduct[]
  }

  return (data || []).map(p => ({
    ...p,
    store_name: '',
    store_email: ''
  })) as LowStockProduct[]
}

/**
 * Obtener productos sin stock
 */
export async function getOutOfStockProducts(storeId: string): Promise<ProductInventory[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku, image_url, stock_quantity, low_stock_threshold, track_inventory, is_available, category, price')
    .eq('store_id', storeId)
    .eq('track_inventory', true)
    .lte('stock_quantity', 0)
    .order('name')

  if (error) {
    console.error('Error fetching out of stock products:', error)
    throw error
  }

  return data || []
}

/**
 * Verificar disponibilidad de stock para una lista de productos
 */
export async function checkStockAvailability(
  items: Array<{ product_id: string; quantity: number }>
): Promise<{
  available: boolean
  unavailableItems: Array<{ product_id: string; product_name: string; requested: number; available: number }>
}> {
  const productIds = items.map(i => i.product_id)

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, stock_quantity, track_inventory')
    .in('id', productIds)

  if (error) {
    console.error('Error checking stock:', error)
    throw error
  }

  const unavailableItems: Array<{
    product_id: string
    product_name: string
    requested: number
    available: number
  }> = []

  for (const item of items) {
    const product = products?.find(p => p.id === item.product_id)

    if (!product) continue

    // Solo verificar si el producto rastrea inventario
    if (product.track_inventory && product.stock_quantity < item.quantity) {
      unavailableItems.push({
        product_id: product.id,
        product_name: product.name,
        requested: item.quantity,
        available: product.stock_quantity
      })
    }
  }

  return {
    available: unavailableItems.length === 0,
    unavailableItems
  }
}

/**
 * Habilitar/deshabilitar seguimiento de inventario masivo
 */
export async function bulkUpdateTrackInventory(
  storeId: string,
  productIds: string[],
  trackInventory: boolean
): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ track_inventory: trackInventory })
    .eq('store_id', storeId)
    .in('id', productIds)

  if (error) {
    console.error('Error bulk updating inventory:', error)
    throw error
  }
}
