import { supabaseAdmin } from './supabase-server'
import type {
  Coupon,
  CreateCouponInput,
  ValidateCouponResult,
  ApplyCouponInput
} from './types/coupons'

/**
 * Crear un nuevo cupón
 */
export async function createCoupon(input: CreateCouponInput): Promise<{
  coupon: Coupon | null
  error: Error | null
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('coupons')
      .insert({
        store_id: input.store_id,
        code: input.code.toUpperCase().trim(),
        description: input.description || null,
        discount_type: input.discount_type,
        discount_value: input.discount_value,
        min_purchase_amount: input.min_purchase_amount || null,
        max_discount_amount: input.max_discount_amount || null,
        max_uses: input.max_uses || null,
        max_uses_per_customer: input.max_uses_per_customer || 1,
        starts_at: input.starts_at || new Date().toISOString(),
        expires_at: input.expires_at || null,
      })
      .select()
      .single()

    if (error) throw error

    return { coupon: data as Coupon, error: null }
  } catch (error) {
    console.error('Error creating coupon:', error)
    return { coupon: null, error: error as Error }
  }
}

/**
 * Validar un cupón para una compra
 */
export async function validateCoupon(
  storeId: string,
  code: string,
  customerEmail: string,
  purchaseAmount: number
): Promise<ValidateCouponResult> {
  try {
    // 1. Buscar el cupón
    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('store_id', storeId)
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single()

    if (error || !coupon) {
      return { valid: false, error: 'Cupón no encontrado o inactivo' }
    }

    // 2. Verificar vigencia
    const now = new Date()
    const startsAt = new Date(coupon.starts_at)
    const expiresAt = coupon.expires_at ? new Date(coupon.expires_at) : null

    if (now < startsAt) {
      return { valid: false, error: 'Este cupón aún no está activo' }
    }

    if (expiresAt && now > expiresAt) {
      return { valid: false, error: 'Este cupón ha expirado' }
    }

    // 3. Verificar usos totales
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return { valid: false, error: 'Este cupón ha alcanzado su límite de usos' }
    }

    // 4. Verificar usos por cliente
    if (coupon.max_uses_per_customer) {
      const { count } = await supabaseAdmin
        .from('coupon_uses')
        .select('*', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id)
        .eq('customer_email', customerEmail.toLowerCase())

      if (count && count >= coupon.max_uses_per_customer) {
        return { valid: false, error: 'Ya has usado este cupón el máximo de veces permitidas' }
      }
    }

    // 5. Verificar monto mínimo de compra
    if (coupon.min_purchase_amount && purchaseAmount < coupon.min_purchase_amount) {
      return {
        valid: false,
        error: `El monto mínimo de compra es $${coupon.min_purchase_amount.toLocaleString()}`
      }
    }

    // 6. Calcular descuento
    let discountAmount: number

    if (coupon.discount_type === 'percentage') {
      discountAmount = (purchaseAmount * coupon.discount_value) / 100

      // Aplicar límite máximo si existe
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount
      }
    } else {
      // Descuento fijo
      discountAmount = Math.min(coupon.discount_value, purchaseAmount)
    }

    return {
      valid: true,
      coupon: coupon as Coupon,
      discount_amount: Math.round(discountAmount * 100) / 100
    }
  } catch (error) {
    console.error('Error validating coupon:', error)
    return { valid: false, error: 'Error al validar el cupón' }
  }
}

/**
 * Registrar uso de un cupón
 */
export async function applyCoupon(input: ApplyCouponInput): Promise<{
  success: boolean
  error: Error | null
}> {
  try {
    const { error } = await supabaseAdmin
      .from('coupon_uses')
      .insert({
        coupon_id: input.coupon_id,
        order_id: input.order_id,
        customer_email: input.customer_email.toLowerCase(),
        discount_applied: input.discount_applied,
      })

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Error applying coupon:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Obtener cupones de una tienda
 */
export async function getCouponsByStore(storeId: string): Promise<{
  coupons: Coupon[]
  error: Error | null
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { coupons: (data as Coupon[]) || [], error: null }
  } catch (error) {
    console.error('Error fetching coupons:', error)
    return { coupons: [], error: error as Error }
  }
}

/**
 * Actualizar un cupón
 */
export async function updateCoupon(
  couponId: string,
  updates: Partial<CreateCouponInput & { is_active: boolean }>
): Promise<{
  coupon: Coupon | null
  error: Error | null
}> {
  try {
    const updateData: Record<string, unknown> = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    if (updates.code) {
      updateData.code = updates.code.toUpperCase().trim()
    }

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .update(updateData)
      .eq('id', couponId)
      .select()
      .single()

    if (error) throw error

    return { coupon: data as Coupon, error: null }
  } catch (error) {
    console.error('Error updating coupon:', error)
    return { coupon: null, error: error as Error }
  }
}

/**
 * Eliminar un cupón
 */
export async function deleteCoupon(couponId: string): Promise<{
  success: boolean
  error: Error | null
}> {
  try {
    const { error } = await supabaseAdmin
      .from('coupons')
      .delete()
      .eq('id', couponId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting coupon:', error)
    return { success: false, error: error as Error }
  }
}
