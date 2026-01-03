import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

// Verificar que el token existe
if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  console.warn('MERCADOPAGO_ACCESS_TOKEN no está configurado')
}

// Configuración del cliente MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
  }
})

// Instancias de APIs
export const preferenceApi = new Preference(client)
export const paymentApi = new Payment(client)

// Tipos
export interface PreferenceItem {
  id: string
  title: string
  quantity: number
  unit_price: number
}

export interface CreatePreferenceInput {
  orderId: string
  storeId: string
  storeName: string
  items: PreferenceItem[]
  payer: {
    name: string
    email: string
    phone?: string
  }
}

/**
 * Crear preferencia de pago en MercadoPago
 */
export async function createPaymentPreference(input: CreatePreferenceInput) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')

  // MercadoPago no acepta localhost para back_urls
  // En desarrollo, usamos URLs de produccion o deshabilitamos auto_return
  const backUrls = isLocalhost ? undefined : {
    success: `${baseUrl}/store/${input.storeId}/checkout/success?order_id=${input.orderId}`,
    failure: `${baseUrl}/store/${input.storeId}/checkout/failure?order_id=${input.orderId}`,
    pending: `${baseUrl}/store/${input.storeId}/checkout/pending?order_id=${input.orderId}`,
  }

  const preferenceData: Record<string, unknown> = {
    items: input.items.map(item => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency_id: 'MXN' as const,
    })),
    payer: {
      name: input.payer.name,
      email: input.payer.email,
      phone: input.payer.phone ? {
        area_code: '',
        number: input.payer.phone,
      } : undefined,
    },
    external_reference: input.orderId,
    statement_descriptor: input.storeName.slice(0, 22),
    metadata: {
      order_id: input.orderId,
      store_id: input.storeId,
    },
  }

  // Solo agregar back_urls y auto_return si no es localhost
  if (backUrls) {
    preferenceData.back_urls = backUrls
    preferenceData.auto_return = 'approved'
    preferenceData.notification_url = `${baseUrl}/api/webhooks/mercadopago`
  }

  try {
    const preference = await preferenceApi.create({ body: preferenceData })

    return {
      success: true,
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
    }
  } catch (error: any) {
    console.error('Error creating MercadoPago preference:', error)
    // MercadoPago SDK devuelve errores con estructura especial
    const errorMessage = error?.message || error?.cause?.[0]?.description || 'Error desconocido'
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Obtener detalles de un pago
 */
export async function getPaymentDetails(paymentId: string) {
  try {
    const payment = await paymentApi.get({ id: paymentId })

    return {
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail,
        externalReference: payment.external_reference,
        transactionAmount: payment.transaction_amount,
        dateApproved: payment.date_approved,
      }
    }
  } catch (error) {
    console.error('Error fetching payment details:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

// ============================================================================
// OXXO PAY - Pagos en efectivo
// ============================================================================

export interface OxxoTicketInput {
  orderId: string
  storeId: string
  amount: number
  description: string
  payer: {
    email: string
    firstName: string
    lastName: string
  }
}

export interface OxxoTicketResult {
  success: boolean
  ticketId?: string
  reference?: string
  expirationDate?: string
  amount?: number
  ticketUrl?: string
  error?: string
}

/**
 * Crear ticket de pago OXXO
 * Genera una referencia de pago para que el cliente pague en OXXO
 */
export async function createOxxoTicket(input: OxxoTicketInput): Promise<OxxoTicketResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://e-vendify.com'
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

  if (!accessToken) {
    console.error('[OXXO] No MERCADOPAGO_ACCESS_TOKEN configured')
    return {
      success: false,
      error: 'MercadoPago no está configurado',
    }
  }

  try {
    // MercadoPago requiere estos campos para pagos OXXO en México
    const paymentData = {
      transaction_amount: input.amount,
      description: input.description,
      payment_method_id: 'oxxo',
      payer: {
        email: input.payer.email,
        first_name: input.payer.firstName,
        last_name: input.payer.lastName,
        // Identification es requerido para OXXO en México
        identification: {
          type: 'CURP',
          number: 'XEXX010101HNEXXXA4', // CURP genérico para extranjeros/no especificado
        },
      },
      external_reference: input.orderId,
      metadata: {
        order_id: input.orderId,
        store_id: input.storeId,
      },
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
    }

    console.log('[OXXO] Creating payment with:', JSON.stringify(paymentData, null, 2))

    // Intentar primero con llamada directa a la API para mejor debugging
    const directResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `oxxo-${input.orderId}-${Date.now()}`,
      },
      body: JSON.stringify(paymentData),
    })

    const responseData = await directResponse.json()
    console.log('[OXXO] API Response status:', directResponse.status)
    console.log('[OXXO] API Response:', JSON.stringify(responseData, null, 2))

    if (!directResponse.ok) {
      // Extraer error de la respuesta
      const errorMsg = responseData.message ||
                       responseData.error ||
                       responseData.cause?.[0]?.description ||
                       `Error HTTP ${directResponse.status}`
      console.error('[OXXO] API Error:', errorMsg)
      return {
        success: false,
        error: errorMsg,
      }
    }

    const payment = responseData

    // Extraer información del ticket
    const transactionDetails = payment.transaction_details as {
      verification_code?: string
      payment_method_reference_id?: string
      external_resource_url?: string
    } | undefined

    // Fecha de expiración (OXXO da ~3 días)
    const expirationDate = payment.date_of_expiration
      ? new Date(payment.date_of_expiration).toLocaleDateString('es-MX', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'En 3 días'

    return {
      success: true,
      ticketId: String(payment.id),
      reference: transactionDetails?.payment_method_reference_id ||
                 transactionDetails?.verification_code ||
                 String(payment.id),
      expirationDate,
      amount: payment.transaction_amount,
      ticketUrl: transactionDetails?.external_resource_url,
    }
  } catch (error: unknown) {
    // Log completo del error para debugging
    console.error('[OXXO] Full error object:', JSON.stringify(error, null, 2))
    console.error('[OXXO] Error type:', typeof error)
    console.error('[OXXO] Error constructor:', error?.constructor?.name)

    // Extraer mensaje de error de MercadoPago
    let errorMessage = 'Error desconocido'

    if (error instanceof Error) {
      errorMessage = error.message
      console.error('[OXXO] Error.message:', error.message)
      console.error('[OXXO] Error.stack:', error.stack)
    }

    // MercadoPago SDK puede devolver errores con estructura especial
    if (typeof error === 'object' && error !== null) {
      const mpError = error as {
        cause?: Array<{ code?: string; description?: string }>
        message?: string
        status?: number
        error?: string
        apiResponse?: { status?: number; content?: unknown }
      }

      // Intentar extraer de diferentes estructuras
      if (mpError.cause && mpError.cause[0]) {
        const cause = mpError.cause[0]
        errorMessage = cause.description || cause.code || errorMessage
        console.error('[OXXO] Error cause:', JSON.stringify(mpError.cause))
      }

      if (mpError.apiResponse) {
        console.error('[OXXO] API Response:', JSON.stringify(mpError.apiResponse))
      }

      if (mpError.status) {
        console.error('[OXXO] Status code:', mpError.status)
      }

      // Log todas las propiedades del error
      console.error('[OXXO] Error keys:', Object.keys(error))
    }

    console.error('[OXXO] Final error message:', errorMessage)

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Formatear referencia OXXO para mostrar (grupos de 4 dígitos)
 */
export function formatOxxoReference(reference: string): string {
  const clean = reference.replace(/\s/g, '')
  return clean.match(/.{1,4}/g)?.join(' ') || reference
}

/**
 * Mapear estado de MercadoPago a estado de orden
 */
export function mapPaymentStatusToOrderStatus(mpStatus: string): 'pending' | 'paid' | 'cancelled' {
  switch (mpStatus) {
    case 'approved':
      return 'paid'
    case 'rejected':
    case 'cancelled':
    case 'refunded':
    case 'charged_back':
      return 'cancelled'
    case 'pending':
    case 'in_process':
    case 'in_mediation':
    default:
      return 'pending'
  }
}
