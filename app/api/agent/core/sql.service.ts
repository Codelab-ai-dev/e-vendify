// ============================================================================
// E-VENDIFY: SQL Service
// Queries directas a la base de datos para datos estructurados
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import {
  CustomerIdentity,
  Intent,
  ExtractedEntities,
  SQLContext,
  Cart,
  CartItem,
} from '@/lib/types/agent.types';

// Cliente Supabase con service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class SQLService {
  /**
   * Ejecuta queries SQL según el intent detectado
   */
  static async executeSQLForIntent(
    intent: Intent,
    entities: ExtractedEntities,
    identity: CustomerIdentity
  ): Promise<SQLContext | null> {
    switch (intent) {
      case 'view_cart':
        return this.getCartContext(identity);

      case 'order_tracking':
        return this.getOrderTrackingContext(identity, entities.orderId);

      case 'order_history':
        return this.getOrderHistoryContext(identity);

      case 'stock_check':
        if (entities.productId) {
          return this.getProductStockContext(entities.productId);
        }
        return null;

      case 'apply_coupon':
        if (entities.couponCode) {
          return this.getCouponContext(identity.storeId, entities.couponCode);
        }
        return null;

      default:
        return null;
    }
  }

  /**
   * Obtiene el carrito actual del cliente
   */
  static async getCart(sessionId: string): Promise<Cart> {
    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .select(`
        cart_items,
        cart_total,
        discount_amount,
        applied_coupon_id,
        applied_coupon_code,
        coupon:coupons(
          id,
          code,
          discount_type,
          discount_value
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return {
        items: [],
        subtotal: 0,
        discountAmount: 0,
        total: 0,
        appliedCoupon: null,
        itemCount: 0,
      };
    }

    const items = (data.cart_items as CartItem[]) || [];
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountAmount = Number(data.discount_amount) || 0;

    const couponData = data.coupon as {
      id: string;
      code: string;
      discount_type: 'percentage' | 'fixed';
      discount_value: number;
    } | null;

    return {
      items,
      subtotal,
      discountAmount,
      total: subtotal - discountAmount,
      appliedCoupon: couponData
        ? {
            id: couponData.id,
            code: couponData.code,
            discountType: couponData.discount_type,
            discountValue: couponData.discount_value,
            discountApplied: discountAmount,
          }
        : null,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  /**
   * Contexto del carrito para el LLM
   */
  static async getCartContext(identity: CustomerIdentity): Promise<SQLContext> {
    const cart = await this.getCart(identity.sessionId);

    if (cart.items.length === 0) {
      return {
        type: 'cart',
        data: cart,
        formattedText: 'El carrito está vacío. No hay productos agregados.',
      };
    }

    let text = 'CARRITO ACTUAL:\n\n';

    for (const item of cart.items) {
      text += `• ${item.name}\n`;
      text += `  Cantidad: ${item.quantity}\n`;
      text += `  Precio unitario: $${item.price.toLocaleString()} MXN\n`;
      text += `  Subtotal: $${(item.price * item.quantity).toLocaleString()} MXN\n\n`;
    }

    text += `---\n`;
    text += `Subtotal: $${cart.subtotal.toLocaleString()} MXN\n`;

    if (cart.appliedCoupon) {
      text += `Cupón (${cart.appliedCoupon.code}): -$${cart.discountAmount.toLocaleString()} MXN\n`;
    }

    text += `TOTAL: $${cart.total.toLocaleString()} MXN\n`;
    text += `\nTotal de productos: ${cart.itemCount}`;

    return {
      type: 'cart',
      data: cart,
      formattedText: text,
    };
  }

  /**
   * Contexto de tracking de orden
   */
  static async getOrderTrackingContext(
    identity: CustomerIdentity,
    orderId?: string
  ): Promise<SQLContext> {
    let query = supabase
      .from('orders')
      .select(`
        id,
        status,
        total_amount,
        created_at,
        updated_at,
        customer_name,
        delivery_method,
        order_items (
          product_name,
          quantity,
          price
        )
      `)
      .eq('store_id', identity.storeId);

    // Si hay orderId específico, buscar por él
    if (orderId) {
      query = query.eq('id', orderId);
    } else if (identity.customerEmail) {
      // Buscar órdenes por email del cliente
      query = query
        .eq('customer_email', identity.customerEmail)
        .order('created_at', { ascending: false })
        .limit(1);
    } else {
      return {
        type: 'order',
        data: null,
        formattedText:
          'No pude encontrar tu pedido. ¿Podrías proporcionarme tu número de orden o el email con el que compraste?',
      };
    }

    const { data: orders, error } = await query;

    if (error || !orders || orders.length === 0) {
      return {
        type: 'order',
        data: null,
        formattedText:
          'No encontré pedidos con esa información. Verifica el número de orden o el email.',
      };
    }

    const order = orders[0];
    const statusText = this.getOrderStatusText(order.status);

    let text = `ESTADO DE TU PEDIDO:\n\n`;
    text += `Orden: #${order.id.substring(0, 8)}\n`;
    text += `Estado: ${statusText}\n`;
    text += `Fecha: ${new Date(order.created_at).toLocaleDateString('es-MX')}\n`;
    text += `Método de entrega: ${order.delivery_method === 'delivery' ? 'Envío a domicilio' : 'Recoger en tienda'}\n`;
    text += `Total: $${Number(order.total_amount).toLocaleString()} MXN\n\n`;

    text += `Productos:\n`;
    for (const item of order.order_items || []) {
      text += `• ${item.product_name} x${item.quantity}\n`;
    }

    return {
      type: 'order',
      data: order,
      formattedText: text,
    };
  }

  /**
   * Historial de órdenes del cliente
   */
  static async getOrderHistoryContext(
    identity: CustomerIdentity
  ): Promise<SQLContext> {
    if (!identity.customerEmail) {
      return {
        type: 'orders_history',
        data: [],
        formattedText:
          'Para ver tu historial de pedidos, necesito tu email. ¿Podrías proporcionármelo?',
      };
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total_amount,
        created_at
      `)
      .eq('store_id', identity.storeId)
      .eq('customer_email', identity.customerEmail)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !orders || orders.length === 0) {
      return {
        type: 'orders_history',
        data: [],
        formattedText: 'No encontré pedidos anteriores con ese email.',
      };
    }

    let text = `TUS ÚLTIMOS PEDIDOS:\n\n`;

    for (const order of orders) {
      text += `• Orden #${order.id.substring(0, 8)}\n`;
      text += `  Estado: ${this.getOrderStatusText(order.status)}\n`;
      text += `  Fecha: ${new Date(order.created_at).toLocaleDateString('es-MX')}\n`;
      text += `  Total: $${Number(order.total_amount).toLocaleString()} MXN\n\n`;
    }

    return {
      type: 'orders_history',
      data: orders,
      formattedText: text,
    };
  }

  /**
   * Stock de un producto específico
   */
  static async getProductStockContext(productId: string): Promise<SQLContext> {
    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, stock_quantity, is_available, price')
      .eq('id', productId)
      .single();

    if (error || !product) {
      return {
        type: 'product_stock',
        data: null,
        formattedText: 'No encontré ese producto.',
      };
    }

    let availability: string;
    if (!product.is_available) {
      availability = 'No disponible temporalmente';
    } else if (product.stock_quantity === 0) {
      availability = 'Agotado';
    } else if (product.stock_quantity < 5) {
      availability = `¡Solo quedan ${product.stock_quantity} unidades!`;
    } else {
      availability = `Disponible (${product.stock_quantity} en stock)`;
    }

    return {
      type: 'product_stock',
      data: product,
      formattedText: `${product.name}: ${availability}\nPrecio: $${Number(product.price).toLocaleString()} MXN`,
    };
  }

  /**
   * Valida y obtiene información de un cupón
   */
  static async getCouponContext(
    storeId: string,
    couponCode: string
  ): Promise<SQLContext> {
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('store_id', storeId)
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !coupon) {
      return {
        type: 'coupon',
        data: null,
        formattedText: `El cupón "${couponCode}" no es válido o ha expirado.`,
      };
    }

    // Verificar vigencia
    const now = new Date();
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return {
        type: 'coupon',
        data: coupon,
        formattedText: `El cupón "${couponCode}" aún no está activo.`,
      };
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return {
        type: 'coupon',
        data: coupon,
        formattedText: `El cupón "${couponCode}" ya expiró.`,
      };
    }

    // Verificar usos
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return {
        type: 'coupon',
        data: coupon,
        formattedText: `El cupón "${couponCode}" ya alcanzó su límite de usos.`,
      };
    }

    // Cupón válido
    const discountText =
      coupon.discount_type === 'percentage'
        ? `${coupon.discount_value}% de descuento`
        : `$${coupon.discount_value} MXN de descuento`;

    let text = `Cupón válido: ${couponCode}\n`;
    text += `Descuento: ${discountText}\n`;

    if (coupon.min_purchase_amount) {
      text += `Compra mínima: $${coupon.min_purchase_amount} MXN\n`;
    }

    if (coupon.max_discount_amount && coupon.discount_type === 'percentage') {
      text += `Descuento máximo: $${coupon.max_discount_amount} MXN`;
    }

    return {
      type: 'coupon',
      data: { ...coupon, isValid: true },
      formattedText: text,
    };
  }

  /**
   * Obtiene producto por ID
   */
  static async getProductById(productId: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Verifica stock disponible
   */
  static async checkStock(
    productId: string,
    requestedQuantity: number
  ): Promise<{ available: boolean; currentStock: number }> {
    const { data, error } = await supabase
      .from('products')
      .select('stock_quantity, is_available')
      .eq('id', productId)
      .single();

    if (error || !data) {
      return { available: false, currentStock: 0 };
    }

    return {
      available:
        data.is_available && (data.stock_quantity ?? 0) >= requestedQuantity,
      currentStock: data.stock_quantity ?? 0,
    };
  }

  /**
   * Texto legible del estado de orden
   */
  private static getOrderStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      pending: '⏳ Pendiente de pago',
      paid: '✅ Pagado - Preparando',
      shipped: '🚚 En camino',
      delivered: '📦 Entregado',
      cancelled: '❌ Cancelado',
    };

    return statusMap[status] || status;
  }

  /**
   * Obtiene información de la tienda
   */
  static async getStoreInfo(storeId: string) {
    const { data, error } = await supabase
      .from('stores')
      .select(`
        name,
        description,
        address,
        city,
        phone,
        email,
        website
      `)
      .eq('id', storeId)
      .single();

    if (error) return null;
    return data;
  }
}
