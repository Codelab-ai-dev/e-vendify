import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
  getStoreInventory,
  getInventoryStats,
  updateProductInventory,
  adjustStock,
  getInventoryMovements,
  getLowStockProducts,
  checkStockAvailability
} from '@/lib/inventory'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// GET: Obtener inventario, estadísticas o movimientos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const type = searchParams.get('type') || 'inventory' // inventory, stats, movements, low_stock
    const productId = searchParams.get('productId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId es requerido' },
        { status: 400 }
      )
    }

    let data

    switch (type) {
      case 'stats':
        data = await getInventoryStats(storeId)
        break

      case 'movements':
        data = await getInventoryMovements(storeId, {
          productId: productId || undefined,
          limit
        })
        break

      case 'low_stock':
        data = await getLowStockProducts(storeId)
        break

      case 'inventory':
      default:
        data = await getStoreInventory(storeId)
        break
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error en GET /api/inventory:', error)
    return NextResponse.json(
      { error: 'Error al obtener inventario' },
      { status: 500 }
    )
  }
}

// Esquema para actualizar inventario
const updateInventorySchema = z.object({
  product_id: z.string().uuid(),
  stock_quantity: z.number().int().min(0).optional(),
  low_stock_threshold: z.number().int().min(0).optional(),
  track_inventory: z.boolean().optional(),
  sku: z.string().max(50).optional().nullable()
})

// Esquema para ajustar stock
const adjustStockSchema = z.object({
  product_id: z.string().uuid(),
  quantity_change: z.number().int(),
  movement_type: z.enum(['manual_adjustment', 'restock', 'return', 'damage', 'other']),
  notes: z.string().max(500).optional()
})

// Esquema para verificar disponibilidad
const checkAvailabilitySchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().positive()
  }))
})

// PATCH: Actualizar configuración de inventario o ajustar stock
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action || 'update' // update, adjust

    if (action === 'adjust') {
      // Ajustar stock
      const validation = adjustStockSchema.safeParse(body)

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: validation.error.flatten() },
          { status: 400 }
        )
      }

      await adjustStock({
        product_id: validation.data.product_id,
        quantity_change: validation.data.quantity_change,
        movement_type: validation.data.movement_type,
        notes: validation.data.notes
      })

      return NextResponse.json({ success: true, message: 'Stock ajustado correctamente' })
    } else {
      // Actualizar configuración
      const validation = updateInventorySchema.safeParse(body)

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: validation.error.flatten() },
          { status: 400 }
        )
      }

      await updateProductInventory({
        product_id: validation.data.product_id,
        stock_quantity: validation.data.stock_quantity,
        low_stock_threshold: validation.data.low_stock_threshold,
        track_inventory: validation.data.track_inventory,
        sku: validation.data.sku ?? undefined
      })

      return NextResponse.json({ success: true, message: 'Inventario actualizado' })
    }
  } catch (error) {
    console.error('Error en PATCH /api/inventory:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar inventario' },
      { status: 500 }
    )
  }
}

// POST: Verificar disponibilidad de stock
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action

    if (action === 'check_availability') {
      const validation = checkAvailabilitySchema.safeParse(body)

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: validation.error.flatten() },
          { status: 400 }
        )
      }

      const result = await checkStockAvailability(validation.data.items)
      return NextResponse.json(result)
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error en POST /api/inventory:', error)
    return NextResponse.json(
      { error: 'Error al procesar solicitud' },
      { status: 500 }
    )
  }
}
