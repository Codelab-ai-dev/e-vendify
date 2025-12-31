// Gestión de sesiones de conversación WhatsApp
import { supabaseAdmin } from '../supabase-server'
import type { WhatsAppSession, CartItem, ConversationState, WhatsAppConfig } from './types'

const SESSION_TIMEOUT_HOURS = 24

/**
 * Obtener o crear sesión de WhatsApp
 */
export async function getOrCreateSession(
  storeId: string,
  phoneNumber: string,
  customerName?: string
): Promise<WhatsAppSession | null> {
  try {
    // Buscar sesión existente
    const { data: existingSession, error: fetchError } = await supabaseAdmin
      .from('whatsapp_sessions')
      .select('*')
      .eq('store_id', storeId)
      .eq('phone_number', phoneNumber)
      .single()

    if (existingSession && !fetchError) {
      // Verificar si la sesión no ha expirado
      const lastInteraction = new Date(existingSession.last_interaction)
      const now = new Date()
      const hoursDiff = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60)

      if (hoursDiff < SESSION_TIMEOUT_HOURS) {
        // Actualizar última interacción
        await supabaseAdmin
          .from('whatsapp_sessions')
          .update({
            last_interaction: now.toISOString(),
            customer_name: customerName || existingSession.customer_name
          })
          .eq('id', existingSession.id)

        return existingSession as WhatsAppSession
      }

      // Sesión expirada, resetear
      const { data: resetSession, error: resetError } = await supabaseAdmin
        .from('whatsapp_sessions')
        .update({
          state: 'idle',
          cart: [],
          delivery_method: null,
          delivery_address: null,
          current_category: null,
          last_interaction: now.toISOString(),
          customer_name: customerName || existingSession.customer_name
        })
        .eq('id', existingSession.id)
        .select()
        .single()

      if (resetError) throw resetError
      return resetSession as WhatsAppSession
    }

    // Crear nueva sesión
    const { data: newSession, error: createError } = await supabaseAdmin
      .from('whatsapp_sessions')
      .insert({
        store_id: storeId,
        phone_number: phoneNumber,
        customer_name: customerName || null,
        state: 'idle',
        cart: [],
        delivery_method: null,
        delivery_address: null,
        current_category: null,
        last_interaction: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) throw createError
    return newSession as WhatsAppSession

  } catch (error) {
    console.error('Error managing WhatsApp session:', error)
    return null
  }
}

/**
 * Actualizar estado de la sesión
 */
export async function updateSessionState(
  sessionId: string,
  state: ConversationState,
  additionalData?: Partial<WhatsAppSession>
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('whatsapp_sessions')
      .update({
        state,
        last_interaction: new Date().toISOString(),
        ...additionalData
      })
      .eq('id', sessionId)

    return !error
  } catch (error) {
    console.error('Error updating session state:', error)
    return false
  }
}

/**
 * Agregar producto al carrito
 */
export async function addToCart(
  sessionId: string,
  item: CartItem
): Promise<CartItem[]> {
  try {
    // Obtener carrito actual
    const { data: session, error: fetchError } = await supabaseAdmin
      .from('whatsapp_sessions')
      .select('cart')
      .eq('id', sessionId)
      .single()

    if (fetchError) throw fetchError

    const currentCart: CartItem[] = session?.cart || []

    // Verificar si el producto ya está en el carrito
    const existingIndex = currentCart.findIndex(
      i => i.product_id === item.product_id
    )

    if (existingIndex >= 0) {
      // Actualizar cantidad
      currentCart[existingIndex].quantity += item.quantity
    } else {
      // Agregar nuevo item
      currentCart.push(item)
    }

    // Guardar carrito actualizado
    const { error: updateError } = await supabaseAdmin
      .from('whatsapp_sessions')
      .update({
        cart: currentCart,
        last_interaction: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (updateError) throw updateError
    return currentCart

  } catch (error) {
    console.error('Error adding to cart:', error)
    return []
  }
}

/**
 * Limpiar carrito
 */
export async function clearCart(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('whatsapp_sessions')
      .update({
        cart: [],
        last_interaction: new Date().toISOString()
      })
      .eq('id', sessionId)

    return !error
  } catch (error) {
    console.error('Error clearing cart:', error)
    return false
  }
}

/**
 * Obtener configuración de WhatsApp de una tienda
 */
export async function getWhatsAppConfig(storeId: string): Promise<WhatsAppConfig | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('whatsapp_config')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .single()

    if (error) return null
    return data as WhatsAppConfig
  } catch (error) {
    console.error('Error fetching WhatsApp config:', error)
    return null
  }
}

/**
 * Obtener tienda por phone_number_id de WhatsApp
 */
export async function getStoreByPhoneNumberId(phoneNumberId: string): Promise<{
  storeId: string
  config: WhatsAppConfig
} | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('whatsapp_config')
      .select('*, stores(id, name, business_name)')
      .eq('phone_number_id', phoneNumberId)
      .eq('is_active', true)
      .single()

    if (error || !data) return null

    return {
      storeId: data.store_id,
      config: data as WhatsAppConfig
    }
  } catch (error) {
    console.error('Error fetching store by phone number ID:', error)
    return null
  }
}

/**
 * Calcular total del carrito
 */
export function calculateCartTotal(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
}

/**
 * Formatear carrito para mensaje
 */
export function formatCartMessage(cart: CartItem[]): string {
  if (cart.length === 0) return 'Tu carrito está vacío'

  const items = cart.map(item =>
    `• ${item.quantity}x ${item.product_name} - $${(item.price * item.quantity).toLocaleString()}`
  ).join('\n')

  const total = calculateCartTotal(cart)

  return `🛒 *Tu carrito:*\n\n${items}\n\n*Total: $${total.toLocaleString()}*`
}
