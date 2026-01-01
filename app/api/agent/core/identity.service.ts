// ============================================================================
// E-VENDIFY: Identity Service
// Resuelve la identidad del cliente basado en número de teléfono y tienda
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import {
  CustomerIdentity,
  AgentError,
  SessionState,
} from '@/lib/types/agent.types';

// Cliente Supabase con service role para bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class IdentityService {
  /**
   * Normaliza un número de teléfono al formato E.164
   * Default: México (+52)
   */
  static normalizePhoneNumber(phone: string): string {
    // Remover todo excepto dígitos y +
    let clean = phone.replace(/[^0-9+]/g, '');

    // Remover prefijo whatsapp: si existe
    if (clean.startsWith('whatsapp:')) {
      clean = clean.replace('whatsapp:', '');
    }

    // Si no empieza con +, procesar
    if (!clean.startsWith('+')) {
      // Si empieza con 52 y tiene 12+ dígitos
      if (clean.startsWith('52') && clean.length >= 12) {
        clean = '+' + clean;
      }
      // Si es número de 10 dígitos (México sin código)
      else if (clean.length === 10) {
        clean = '+52' + clean;
      }
      // Si tiene 11 y empieza con 1 (formato viejo México)
      else if (clean.length === 11 && clean.startsWith('1')) {
        clean = '+52' + clean.substring(1);
      }
      // Default: agregar +
      else {
        clean = '+' + clean;
      }
    }

    return clean;
  }

  /**
   * Resuelve la identidad completa del cliente
   * Crea cliente y sesión si no existen
   */
  static async resolveIdentity(
    phoneNumber: string,
    storeId: string
  ): Promise<CustomerIdentity> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    // 1. Verificar que la tienda existe y está activa
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name, slug, is_active')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      throw new AgentError('Tienda no encontrada', 'STORE_NOT_FOUND', {
        storeId,
      });
    }

    if (!store.is_active) {
      throw new AgentError('Tienda inactiva', 'STORE_INACTIVE', { storeId });
    }

    // 2. Obtener o crear cliente y sesión usando la función RPC
    const { data: sessionId, error: sessionError } = await supabase.rpc(
      'get_or_create_whatsapp_session',
      {
        p_phone_number: normalizedPhone,
        p_store_id: storeId,
      }
    );

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      throw new AgentError(
        'Error al crear sesión',
        'INTERNAL_ERROR',
        { error: sessionError.message }
      );
    }

    // 3. Obtener datos completos del cliente y sesión
    const { data: sessionData, error: fetchError } = await supabase
      .from('whatsapp_sessions')
      .select(`
        id,
        session_state,
        cart_items,
        cart_total,
        applied_coupon_id,
        applied_coupon_code,
        discount_amount,
        context,
        window_opened_at,
        window_closes_at,
        customer:whatsapp_customers!customer_id (
          id,
          phone_number,
          customer_name,
          customer_email,
          total_orders,
          total_spent,
          last_order_at,
          is_blocked,
          blocked_reason,
          first_contact_at
        )
      `)
      .eq('id', sessionId)
      .single();

    if (fetchError || !sessionData) {
      console.error('Error fetching session:', fetchError);
      throw new AgentError(
        'Error al obtener sesión',
        'INTERNAL_ERROR',
        { error: fetchError?.message }
      );
    }

    const customer = sessionData.customer as {
      id: string;
      phone_number: string;
      customer_name: string | null;
      customer_email: string | null;
      total_orders: number;
      total_spent: number;
      last_order_at: string | null;
      is_blocked: boolean;
      blocked_reason: string | null;
      first_contact_at: string;
    };

    // 4. Verificar si el cliente está bloqueado
    if (customer.is_blocked) {
      throw new AgentError(
        'Cliente bloqueado',
        'CUSTOMER_BLOCKED',
        { reason: customer.blocked_reason }
      );
    }

    // 5. Calcular si está dentro de ventana 24h
    const withinWindow24h = sessionData.window_closes_at
      ? new Date(sessionData.window_closes_at) > new Date()
      : false;

    // 6. Determinar si es cliente nuevo (menos de 1 orden)
    const isNewCustomer = customer.total_orders === 0;

    // 7. Calcular items en carrito
    const cartItems = (sessionData.cart_items as unknown[]) || [];
    const cartItemsCount = cartItems.reduce(
      (acc: number, item: { quantity?: number }) => acc + (item.quantity || 0),
      0
    );

    // 8. Construir identidad
    const identity: CustomerIdentity = {
      customerId: customer.id,
      phoneNumber: customer.phone_number,
      storeId: store.id,
      storeName: store.name,
      storeSlug: store.slug,

      customerName: customer.customer_name,
      customerEmail: customer.customer_email,

      totalOrders: customer.total_orders,
      totalSpent: Number(customer.total_spent),
      lastOrderAt: customer.last_order_at,

      sessionId: sessionData.id,
      sessionState: sessionData.session_state as SessionState,
      cartItemsCount,
      cartTotal: Number(sessionData.cart_total) || 0,

      isNewCustomer,
      isBlocked: false,

      withinWindow24h,
      windowClosesAt: sessionData.window_closes_at,
    };

    return identity;
  }

  /**
   * Actualiza el nombre del cliente (extraído de conversación)
   */
  static async updateCustomerName(
    customerId: string,
    name: string
  ): Promise<void> {
    await supabase
      .from('whatsapp_customers')
      .update({
        customer_name: name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId);
  }

  /**
   * Actualiza el email del cliente
   */
  static async updateCustomerEmail(
    customerId: string,
    email: string
  ): Promise<void> {
    await supabase
      .from('whatsapp_customers')
      .update({
        customer_email: email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId);
  }

  /**
   * Abre la ventana de 24 horas para el cliente
   */
  static async openWindow24h(sessionId: string): Promise<void> {
    await supabase.rpc('open_24h_window', {
      p_session_id: sessionId,
    });
  }

  /**
   * Verifica rate limit del cliente
   */
  static async checkRateLimit(
    phoneNumber: string,
    storeId: string,
    windowMinutes: number = 10,
    maxMessages: number = 20
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_phone_number: this.normalizePhoneNumber(phoneNumber),
      p_store_id: storeId,
      p_window_minutes: windowMinutes,
      p_max_messages: maxMessages,
    });

    if (error) {
      console.error('Rate limit check error:', error);
      return true; // En caso de error, permitir
    }

    return data as boolean;
  }

  /**
   * Incrementa el contador de rate limit
   */
  static async incrementRateLimit(
    phoneNumber: string,
    storeId: string,
    windowMinutes: number = 10
  ): Promise<void> {
    await supabase.rpc('increment_rate_limit', {
      p_phone_number: this.normalizePhoneNumber(phoneNumber),
      p_store_id: storeId,
      p_window_minutes: windowMinutes,
    });
  }

  /**
   * Bloquea un cliente por abuso
   */
  static async blockCustomer(
    customerId: string,
    reason: string
  ): Promise<void> {
    await supabase
      .from('whatsapp_customers')
      .update({
        is_blocked: true,
        blocked_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId);
  }

  /**
   * Obtiene el ID de tienda por slug o número de Twilio
   */
  static async getStoreIdByTwilioNumber(
    twilioNumber: string
  ): Promise<string | null> {
    // Por ahora, asumimos una tienda por número de Twilio
    // En el futuro, esto puede ser una tabla de mapeo
    const { data, error } = await supabase
      .from('stores')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data.id;
  }

  // ===========================================================================
  // FUNCIONES PARA CÓDIGO DE TIENDA (WhatsApp Multi-tenant)
  // ===========================================================================

  /**
   * Verifica si un mensaje es un código de tienda
   * Formato: 3 letras + 3 números (ej: ABC123, TEC001)
   */
  static isStoreCode(message: string): boolean {
    const cleanMessage = message.trim().toUpperCase();
    return /^[A-Z]{3}[0-9]{3}$/.test(cleanMessage);
  }

  /**
   * Busca una tienda por su código de WhatsApp
   */
  static async getStoreByCode(code: string): Promise<{
    id: string;
    name: string;
    slug: string;
  } | null> {
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, slug')
      .eq('whatsapp_code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  /**
   * Vincula un cliente (teléfono) a una tienda
   */
  static async linkCustomerToStore(
    phoneNumber: string,
    storeId: string
  ): Promise<{ customerId: string; isNew: boolean }> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    // Verificar si ya existe el cliente para esta tienda
    const { data: existing } = await supabase
      .from('whatsapp_customers')
      .select('id')
      .eq('phone_number', normalizedPhone)
      .eq('store_id', storeId)
      .single();

    if (existing) {
      // Actualizar última interacción
      await supabase
        .from('whatsapp_customers')
        .update({ last_interaction_at: new Date().toISOString() })
        .eq('id', existing.id);

      return { customerId: existing.id, isNew: false };
    }

    // Crear nuevo cliente
    const { data: newCustomer, error } = await supabase
      .from('whatsapp_customers')
      .insert({
        phone_number: normalizedPhone,
        store_id: storeId,
        first_contact_at: new Date().toISOString(),
        last_interaction_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !newCustomer) {
      throw new Error(`Error creando cliente: ${error?.message}`);
    }

    return { customerId: newCustomer.id, isNew: true };
  }

  /**
   * Obtiene la tienda vinculada a un cliente por su teléfono
   */
  static async getLinkedStore(phoneNumber: string): Promise<{
    storeId: string;
    storeName: string;
    customerId: string;
  } | null> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    // Buscar el cliente más reciente (por si tiene varias tiendas)
    const { data, error } = await supabase
      .from('whatsapp_customers')
      .select(`
        id,
        store_id,
        stores:store_id (name)
      `)
      .eq('phone_number', normalizedPhone)
      .order('last_interaction_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      storeId: data.store_id,
      storeName: (data.stores as { name: string })?.name || 'Tienda',
      customerId: data.id,
    };
  }

  /**
   * Obtiene todas las tiendas vinculadas a un teléfono
   */
  static async getAllLinkedStores(phoneNumber: string): Promise<Array<{
    storeId: string;
    storeName: string;
    storeCode: string;
  }>> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    const { data, error } = await supabase
      .from('whatsapp_customers')
      .select(`
        store_id,
        stores:store_id (name, whatsapp_code)
      `)
      .eq('phone_number', normalizedPhone);

    if (error || !data) {
      return [];
    }

    return data.map((d) => ({
      storeId: d.store_id,
      storeName: (d.stores as { name: string; whatsapp_code: string })?.name || 'Tienda',
      storeCode: (d.stores as { name: string; whatsapp_code: string })?.whatsapp_code || '',
    }));
  }

  /**
   * Normaliza número de teléfono
   */
  private static normalizePhoneNumber(phone: string): string {
    // Remover espacios y caracteres no numéricos excepto +
    let clean = phone.replace(/[^\d+]/g, '');

    // Asegurar que empiece con +
    if (!clean.startsWith('+')) {
      // Asumir México si no tiene código de país
      if (clean.length === 10) {
        clean = '+52' + clean;
      } else if (clean.startsWith('52')) {
        clean = '+' + clean;
      } else {
        clean = '+' + clean;
      }
    }

    return clean;
  }
}
