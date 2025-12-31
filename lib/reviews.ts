import { supabaseAdmin } from './supabase-server'
import type {
  Review,
  CreateReviewInput,
  UpdateReviewInput,
  ReviewWithProduct
} from './types/reviews'

/**
 * Crear una nueva review
 */
export async function createReview(input: CreateReviewInput): Promise<{
  review: Review | null
  error: Error | null
}> {
  try {
    // Validar rating
    if (input.rating < 1 || input.rating > 5) {
      throw new Error('La calificación debe ser entre 1 y 5')
    }

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        product_id: input.product_id,
        order_id: input.order_id || null,
        customer_name: input.customer_name.trim(),
        customer_email: input.customer_email.toLowerCase().trim(),
        rating: input.rating,
        title: input.title?.trim() || null,
        comment: input.comment?.trim() || null,
        is_approved: false,  // Requiere aprobación
        is_visible: true,
      })
      .select()
      .single()

    if (error) throw error

    return { review: data as Review, error: null }
  } catch (error) {
    console.error('Error creating review:', error)
    return { review: null, error: error as Error }
  }
}

/**
 * Obtener reviews de un producto (solo aprobadas y visibles)
 */
export async function getProductReviews(productId: string): Promise<{
  reviews: Review[]
  error: Error | null
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('is_approved', true)
      .eq('is_visible', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { reviews: (data as Review[]) || [], error: null }
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return { reviews: [], error: error as Error }
  }
}

/**
 * Obtener todas las reviews de una tienda (para el dashboard)
 */
export async function getStoreReviews(storeId: string): Promise<{
  reviews: ReviewWithProduct[]
  error: Error | null
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select(`
        *,
        product:products!inner (
          id,
          name,
          image_url,
          store_id
        )
      `)
      .eq('products.store_id', storeId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { reviews: (data as ReviewWithProduct[]) || [], error: null }
  } catch (error) {
    console.error('Error fetching store reviews:', error)
    return { reviews: [], error: error as Error }
  }
}

/**
 * Obtener reviews pendientes de aprobación
 */
export async function getPendingReviews(storeId: string): Promise<{
  reviews: ReviewWithProduct[]
  error: Error | null
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select(`
        *,
        product:products!inner (
          id,
          name,
          image_url,
          store_id
        )
      `)
      .eq('products.store_id', storeId)
      .eq('is_approved', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { reviews: (data as ReviewWithProduct[]) || [], error: null }
  } catch (error) {
    console.error('Error fetching pending reviews:', error)
    return { reviews: [], error: error as Error }
  }
}

/**
 * Aprobar una review
 */
export async function approveReview(reviewId: string): Promise<{
  success: boolean
  error: Error | null
}> {
  try {
    const { error } = await supabaseAdmin
      .from('reviews')
      .update({
        is_approved: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Error approving review:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Actualizar una review (aprobar, ocultar, responder)
 */
export async function updateReview(
  reviewId: string,
  updates: UpdateReviewInput
): Promise<{
  review: Review | null
  error: Error | null
}> {
  try {
    const updateData: Record<string, unknown> = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    // Si se agrega respuesta del vendedor, registrar la fecha
    if (updates.seller_response !== undefined) {
      updateData.seller_response_at = updates.seller_response
        ? new Date().toISOString()
        : null
    }

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select()
      .single()

    if (error) throw error

    return { review: data as Review, error: null }
  } catch (error) {
    console.error('Error updating review:', error)
    return { review: null, error: error as Error }
  }
}

/**
 * Eliminar una review
 */
export async function deleteReview(reviewId: string): Promise<{
  success: boolean
  error: Error | null
}> {
  try {
    const { error } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting review:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Verificar si un cliente puede dejar review (compró el producto)
 */
export async function canCustomerReview(
  productId: string,
  customerEmail: string
): Promise<boolean> {
  try {
    // Buscar si hay una orden pagada con este producto
    const { data, error } = await supabaseAdmin
      .from('order_items')
      .select(`
        id,
        order:orders!inner (
          id,
          customer_email,
          status
        )
      `)
      .eq('product_id', productId)
      .eq('orders.customer_email', customerEmail.toLowerCase())
      .eq('orders.status', 'paid')
      .limit(1)

    if (error) {
      console.error('Error checking customer review eligibility:', error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.error('Error checking customer review eligibility:', error)
    return false
  }
}

/**
 * Obtener estadísticas de reviews de un producto
 */
export async function getProductReviewStats(productId: string): Promise<{
  average_rating: number
  reviews_count: number
  rating_distribution: Record<number, number>
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('is_approved', true)

    if (error) throw error

    const reviews = data || []
    const count = reviews.length

    if (count === 0) {
      return {
        average_rating: 0,
        reviews_count: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

    reviews.forEach(r => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1
    })

    return {
      average_rating: Math.round((sum / count) * 10) / 10,
      reviews_count: count,
      rating_distribution: distribution
    }
  } catch (error) {
    console.error('Error fetching review stats:', error)
    return {
      average_rating: 0,
      reviews_count: 0,
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    }
  }
}
