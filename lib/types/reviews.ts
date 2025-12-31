// Tipos para el sistema de reviews de e-vendify

export interface Review {
  id: string
  product_id: string
  order_id: string | null
  customer_name: string
  customer_email: string
  rating: number  // 1-5
  title: string | null
  comment: string | null
  is_approved: boolean
  is_visible: boolean
  seller_response: string | null
  seller_response_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateReviewInput {
  product_id: string
  order_id?: string
  customer_name: string
  customer_email: string
  rating: number  // 1-5
  title?: string
  comment?: string
}

export interface UpdateReviewInput {
  is_approved?: boolean
  is_visible?: boolean
  seller_response?: string
}

export interface ProductReviewStats {
  average_rating: number
  reviews_count: number
}

export interface ReviewWithProduct extends Review {
  product?: {
    id: string
    name: string
    image_url: string | null
  }
}
