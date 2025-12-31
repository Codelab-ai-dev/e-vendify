// Tipos para el sistema de cupones de e-vendify

export type DiscountType = 'percentage' | 'fixed'

export interface Coupon {
  id: string
  store_id: string
  code: string
  description: string | null
  discount_type: DiscountType
  discount_value: number
  min_purchase_amount: number | null
  max_discount_amount: number | null
  max_uses: number | null
  max_uses_per_customer: number
  current_uses: number
  starts_at: string
  expires_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CouponUse {
  id: string
  coupon_id: string
  order_id: string
  customer_email: string
  discount_applied: number
  created_at: string
}

export interface CreateCouponInput {
  store_id: string
  code: string
  description?: string
  discount_type: DiscountType
  discount_value: number
  min_purchase_amount?: number
  max_discount_amount?: number
  max_uses?: number
  max_uses_per_customer?: number
  starts_at?: string
  expires_at?: string
}

export interface ValidateCouponResult {
  valid: boolean
  coupon?: Coupon
  error?: string
  discount_amount?: number
}

export interface ApplyCouponInput {
  coupon_id: string
  order_id: string
  customer_email: string
  discount_applied: number
}
