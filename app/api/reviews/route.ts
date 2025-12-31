import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  createReview,
  getProductReviews,
  getStoreReviews,
  getPendingReviews,
  updateReview,
  deleteReview,
  approveReview
} from '@/lib/reviews'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Schema de validación para crear review
const createReviewSchema = z.object({
  product_id: z.string().uuid(),
  order_id: z.string().uuid().optional(),
  customer_name: z.string().min(2, 'Nombre requerido'),
  customer_email: z.string().email('Email inválido'),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
})

// GET - Obtener reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const storeId = searchParams.get('storeId')
    const pending = searchParams.get('pending') === 'true'

    // Reviews públicas de un producto
    if (productId) {
      const { reviews, error } = await getProductReviews(productId)
      if (error) {
        return NextResponse.json({ error: 'Error fetching reviews' }, { status: 500 })
      }
      return NextResponse.json(reviews)
    }

    // Reviews de una tienda (requiere autenticación)
    if (storeId) {
      const cookieStore = await cookies()
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { cookie: cookieStore.toString() } } }
      )

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Verificar que es dueño de la tienda
      const { data: store } = await supabase
        .from('stores')
        .select('user_id')
        .eq('id', storeId)
        .single()

      if (!store || store.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      if (pending) {
        const { reviews, error } = await getPendingReviews(storeId)
        if (error) {
          return NextResponse.json({ error: 'Error fetching reviews' }, { status: 500 })
        }
        return NextResponse.json(reviews)
      }

      const { reviews, error } = await getStoreReviews(storeId)
      if (error) {
        return NextResponse.json({ error: 'Error fetching reviews' }, { status: 500 })
      }
      return NextResponse.json(reviews)
    }

    return NextResponse.json({ error: 'productId or storeId required' }, { status: 400 })
  } catch (error) {
    console.error('Reviews GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Crear review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = createReviewSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { review, error } = await createReview(validation.data)

    if (error) {
      return NextResponse.json(
        { error: 'Error creating review', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Reviews POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Actualizar review (aprobar, responder, ocultar)
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { cookie: cookieStore.toString() } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reviewId, action, ...updates } = body

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId required' }, { status: 400 })
    }

    // Acción rápida: aprobar
    if (action === 'approve') {
      const { success, error } = await approveReview(reviewId)
      if (error) {
        return NextResponse.json({ error: 'Error approving review' }, { status: 500 })
      }
      return NextResponse.json({ success })
    }

    // Actualización general
    const { review, error } = await updateReview(reviewId, updates)
    if (error) {
      return NextResponse.json({ error: 'Error updating review' }, { status: 500 })
    }

    return NextResponse.json(review)
  } catch (error) {
    console.error('Reviews PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Eliminar review
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { cookie: cookieStore.toString() } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get('id')

    if (!reviewId) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const { success, error } = await deleteReview(reviewId)
    if (error) {
      return NextResponse.json({ error: 'Error deleting review' }, { status: 500 })
    }

    return NextResponse.json({ success })
  } catch (error) {
    console.error('Reviews DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
