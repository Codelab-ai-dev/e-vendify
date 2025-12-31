import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoiceDocument, InvoiceData } from '@/lib/invoice-template'
import { supabaseAdmin } from '@/lib/supabase-server'
import React from 'react'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID es requerido' },
        { status: 400 }
      )
    }

    // Obtener la orden con sus items
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Error fetching order:', orderError)
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    // Obtener información de la tienda
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('*')
      .eq('id', order.store_id)
      .single()

    if (storeError || !store) {
      console.error('Error fetching store:', storeError)
      return NextResponse.json(
        { error: 'Tienda no encontrada' },
        { status: 404 }
      )
    }

    // Preparar datos para la factura
    const invoiceData: InvoiceData = {
      invoiceNumber: order.id.substring(0, 8).toUpperCase(),
      orderDate: order.created_at,
      paymentDate: order.status !== 'pending' && order.status !== 'cancelled' ? order.updated_at : undefined,
      status: order.status,
      store: {
        name: store.business_name || store.name,
        email: store.email,
        phone: store.phone,
        address: store.address ? `${store.address}${store.city ? `, ${store.city}` : ''}` : undefined,
      },
      customer: {
        name: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
        address: order.customer_address,
      },
      items: (order.order_items || []).map((item: any) => ({
        name: item.product_name,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: order.total_amount + (order.discount_amount || 0),
      discount: order.discount_amount || 0,
      total: order.total_amount,
    }

    // Generar el PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoiceDocument, { data: invoiceData })
    )

    // Nombre del archivo
    const fileName = `factura-${invoiceData.invoiceNumber}.pdf`

    // Retornar el PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json(
      { error: 'Error al generar la factura', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// También soportar preview inline
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const body = await request.json()
    const inline = body.inline === true

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID es requerido' },
        { status: 400 }
      )
    }

    // Obtener la orden con sus items
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    // Obtener información de la tienda
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('*')
      .eq('id', order.store_id)
      .single()

    if (storeError || !store) {
      return NextResponse.json(
        { error: 'Tienda no encontrada' },
        { status: 404 }
      )
    }

    // Preparar datos para la factura
    const invoiceData: InvoiceData = {
      invoiceNumber: order.id.substring(0, 8).toUpperCase(),
      orderDate: order.created_at,
      paymentDate: order.status !== 'pending' && order.status !== 'cancelled' ? order.updated_at : undefined,
      status: order.status,
      store: {
        name: store.business_name || store.name,
        email: store.email,
        phone: store.phone,
        address: store.address ? `${store.address}${store.city ? `, ${store.city}` : ''}` : undefined,
      },
      customer: {
        name: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
        address: order.customer_address,
      },
      items: (order.order_items || []).map((item: any) => ({
        name: item.product_name,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: order.total_amount + (order.discount_amount || 0),
      discount: order.discount_amount || 0,
      total: order.total_amount,
    }

    // Generar el PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoiceDocument, { data: invoiceData })
    )

    const fileName = `factura-${invoiceData.invoiceNumber}.pdf`

    // Retornar como inline o attachment
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${fileName}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json(
      { error: 'Error al generar la factura' },
      { status: 500 }
    )
  }
}
