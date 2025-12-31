// Tipos para el sistema de órdenes de e-vendify

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'

export interface Order {
  id: string
  store_id: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  customer_address: string | null
  customer_notes: string | null
  delivery_method: 'delivery' | 'pickup' | null
  delivery_location: { lat: number; lng: number } | null
  total_amount: number
  discount_amount: number
  coupon_id: string | null
  status: OrderStatus
  payment_id: string | null
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  quantity: number
  price: number
  created_at: string
}

export interface CreateOrderInput {
  store_id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  customer_address?: string
  customer_notes?: string
  delivery_method?: 'delivery' | 'pickup'
  delivery_location?: { lat: number; lng: number }
  total_amount: number
  discount_amount?: number
  coupon_id?: string
  items: CreateOrderItemInput[]
}

export interface CreateOrderItemInput {
  product_id: string
  product_name: string
  quantity: number
  price: number
}

export interface CheckoutResponse {
  success: boolean
  order_id?: string
  payment_url?: string
  sandbox_url?: string
  error?: string
}

export interface MercadoPagoWebhookPayload {
  id: number
  live_mode: boolean
  type: string
  date_created: string
  user_id: number
  api_version: string
  action: string
  data: {
    id: string
  }
}
