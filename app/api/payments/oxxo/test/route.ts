// ============================================================================
// E-VENDIFY: OXXO Test Endpoint
// GET /api/payments/oxxo/test
// Prueba directa de la integración OXXO con MercadoPago
// ============================================================================

import { NextResponse } from 'next/server'

export async function GET() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://e-vendify.com'

  if (!accessToken) {
    return NextResponse.json({
      success: false,
      error: 'MERCADOPAGO_ACCESS_TOKEN not configured',
      step: 'config_check',
    }, { status: 500 })
  }

  // 1. Verificar métodos de pago disponibles
  console.log('[OXXO-TEST] Checking available payment methods...')

  try {
    const methodsResponse = await fetch('https://api.mercadopago.com/v1/payment_methods', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    const methods = await methodsResponse.json()

    // Buscar OXXO en los métodos
    const oxxoMethod = methods.find?.((m: { id: string }) => m.id === 'oxxo')
    const cashMethods = methods.filter?.((m: { payment_type_id: string }) =>
      m.payment_type_id === 'ticket' || m.payment_type_id === 'atm'
    )

    console.log('[OXXO-TEST] OXXO method:', oxxoMethod ? 'AVAILABLE' : 'NOT FOUND')
    console.log('[OXXO-TEST] Cash methods available:', cashMethods?.map((m: { id: string }) => m.id))

    // 2. Intentar crear un pago de prueba
    const testPaymentData = {
      transaction_amount: 100, // $100 MXN de prueba
      description: 'Test OXXO Payment',
      payment_method_id: 'oxxo',
      payer: {
        email: 'test@e-vendify.com', // Dominio real requerido por MercadoPago
        first_name: 'Test',
        last_name: 'User',
        identification: {
          type: 'CURP',
          number: 'XEXX010101HNEXXXA4',
        },
      },
      external_reference: `test-${Date.now()}`,
      metadata: {
        test: true,
      },
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
    }

    console.log('[OXXO-TEST] Creating test payment:', JSON.stringify(testPaymentData, null, 2))

    const paymentResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `test-oxxo-${Date.now()}`,
      },
      body: JSON.stringify(testPaymentData),
    })

    const paymentResult = await paymentResponse.json()

    console.log('[OXXO-TEST] Payment response status:', paymentResponse.status)
    console.log('[OXXO-TEST] Payment response:', JSON.stringify(paymentResult, null, 2))

    if (!paymentResponse.ok) {
      return NextResponse.json({
        success: false,
        step: 'payment_creation',
        httpStatus: paymentResponse.status,
        error: paymentResult.message || paymentResult.error || 'Unknown error',
        errorDetails: paymentResult,
        oxxoMethodAvailable: !!oxxoMethod,
        availableCashMethods: cashMethods?.map((m: { id: string; name: string }) => ({
          id: m.id,
          name: m.name,
        })),
      }, { status: paymentResponse.status })
    }

    // Éxito
    return NextResponse.json({
      success: true,
      message: 'OXXO payment created successfully!',
      paymentId: paymentResult.id,
      status: paymentResult.status,
      reference: paymentResult.transaction_details?.payment_method_reference_id ||
                 paymentResult.transaction_details?.verification_code,
      expirationDate: paymentResult.date_of_expiration,
      ticketUrl: paymentResult.transaction_details?.external_resource_url,
      oxxoMethodAvailable: !!oxxoMethod,
    })

  } catch (error) {
    console.error('[OXXO-TEST] Error:', error)

    return NextResponse.json({
      success: false,
      step: 'api_call',
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: String(error),
    }, { status: 500 })
  }
}
