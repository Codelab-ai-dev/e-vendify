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

  const preferenceData = {
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
    back_urls: {
      success: `${baseUrl}/store/${input.storeId}/checkout/success?order_id=${input.orderId}`,
      failure: `${baseUrl}/store/${input.storeId}/checkout/failure?order_id=${input.orderId}`,
      pending: `${baseUrl}/store/${input.storeId}/checkout/pending?order_id=${input.orderId}`,
    },
    auto_return: 'approved' as const,
    external_reference: input.orderId,
    statement_descriptor: input.storeName.slice(0, 22),
    notification_url: `${baseUrl}/api/webhooks/mercadopago`,
    metadata: {
      order_id: input.orderId,
      store_id: input.storeId,
    },
  }

  try {
    const preference = await preferenceApi.create({ body: preferenceData })

    return {
      success: true,
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
    }
  } catch (error) {
    console.error('Error creating MercadoPago preference:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
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
