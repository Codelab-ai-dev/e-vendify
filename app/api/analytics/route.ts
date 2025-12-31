import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStoreAnalytics, getQuickStats } from '@/lib/analytics'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const period = (searchParams.get('period') || 'month') as 'week' | 'month' | 'year'
    const type = searchParams.get('type') || 'full'

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      )
    }

    // Verificar autenticación
    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          cookie: cookieStore.toString(),
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verificar que el usuario es dueño de la tienda
    const { data: store } = await supabase
      .from('stores')
      .select('user_id')
      .eq('id', storeId)
      .single()

    if (!store || store.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Obtener analytics según el tipo solicitado
    if (type === 'quick') {
      const stats = await getQuickStats(storeId)
      return NextResponse.json(stats)
    }

    const { analytics, error } = await getStoreAnalytics(storeId, period)

    if (error) {
      return NextResponse.json(
        { error: 'Error fetching analytics' },
        { status: 500 }
      )
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
