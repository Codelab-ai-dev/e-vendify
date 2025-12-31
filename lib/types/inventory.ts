// Tipos para el sistema de inventario de e-vendify

export interface ProductInventory {
  id: string
  name: string
  sku: string | null
  image_url: string | null
  stock_quantity: number
  low_stock_threshold: number
  track_inventory: boolean
  is_available: boolean
  category: string | null
  price: number
}

export type MovementType =
  | 'manual_adjustment'
  | 'order'
  | 'order_cancelled'
  | 'restock'
  | 'return'
  | 'damage'
  | 'other'

export interface InventoryMovement {
  id: string
  product_id: string
  store_id: string
  quantity_change: number
  previous_quantity: number
  new_quantity: number
  movement_type: MovementType
  reference_id: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  product?: {
    name: string
    sku: string | null
    image_url: string | null
  }
}

export interface InventoryStats {
  total_products: number
  tracked_products: number
  low_stock_count: number
  out_of_stock_count: number
  total_stock_value: number
}

export interface UpdateInventoryInput {
  product_id: string
  stock_quantity?: number
  low_stock_threshold?: number
  track_inventory?: boolean
  sku?: string
}

export interface AdjustStockInput {
  product_id: string
  quantity_change: number
  movement_type: MovementType
  notes?: string
}

export interface LowStockProduct {
  id: string
  store_id: string
  name: string
  sku: string | null
  stock_quantity: number
  low_stock_threshold: number
  image_url: string | null
  store_name: string
  store_email: string
}

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  manual_adjustment: 'Ajuste manual',
  order: 'Venta',
  order_cancelled: 'Orden cancelada',
  restock: 'Reabastecimiento',
  return: 'Devolución',
  damage: 'Daño/Pérdida',
  other: 'Otro'
}
