// ============================================================================
// E-VENDIFY: Actions Service
// Ejecuta acciones transaccionales (carrito, checkout, cupones)
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import {
  CustomerIdentity,
  Intent,
  ExtractedEntities,
  ActionType,
  ActionResult,
  CartItem,
  Cart,
  RAGChunk,
  AgentError,
} from '@/lib/types/agent.types';
import { SQLService } from './sql.service';
import { createOxxoTicket, formatOxxoReference } from '@/lib/mercadopago';

// Cliente Supabase con service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// URL base de la aplicación
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://e-vendify.com';

export class ActionsService {
  /**
   * Ejecuta acciones según el intent
   */
  static async executeActionsForIntent(
    intent: Intent,
    entities: ExtractedEntities,
    identity: CustomerIdentity,
    ragChunks: RAGChunk[]
  ): Promise<ActionResult[]> {
    const results: ActionResult[] = [];

    switch (intent) {
      case 'add_to_cart':
        results.push(await this.addToCart(identity, entities, ragChunks));
        break;

      case 'remove_from_cart':
        results.push(await this.removeFromCart(identity, entities));
        break;

      case 'update_cart':
        results.push(await this.updateCartQuantity(identity, entities));
        break;

      case 'apply_coupon':
        if (entities.couponCode) {
          results.push(await this.applyCoupon(identity, entities.couponCode));
        }
        break;

      case 'checkout':
        results.push(await this.createCheckoutLink(identity));
        break;

      case 'oxxo_checkout':
        results.push(await this.createOxxoCheckout(identity));
        break;

      case 'support':
        results.push(this.escalateToHuman(identity));
        break;
    }

    return results;
  }

  /**
   * Agrega producto al carrito
   */
  static async addToCart(
    identity: CustomerIdentity,
    entities: ExtractedEntities,
    ragChunks: RAGChunk[]
  ): Promise<ActionResult> {
    try {
      // Determinar qué producto agregar
      let productId = entities.productId;
      let quantity = entities.quantity || 1;

      // Si no hay productId pero hay chunks de productos, usar el primero
      if (!productId && ragChunks.length > 0) {
        const productChunk = ragChunks.find((c) => c.contentType === 'product');
        if (productChunk) {
          productId = productChunk.referenceId || undefined;
        }
      }

      if (!productId) {
        return {
          type: 'add_to_cart',
          success: false,
          payload: {},
          error: 'No se especificó qué producto agregar',
        };
      }

      // Obtener datos del producto
      const product = await SQLService.getProductById(productId);
      if (!product) {
        return {
          type: 'add_to_cart',
          success: false,
          payload: { productId },
          error: 'Producto no encontrado',
        };
      }

      // Verificar stock
      const { available, currentStock } = await SQLService.checkStock(
        productId,
        quantity
      );
      if (!available) {
        return {
          type: 'add_to_cart',
          success: false,
          payload: { productId, requestedQuantity: quantity, currentStock },
          error:
            currentStock === 0
              ? 'Producto agotado'
              : `Solo hay ${currentStock} unidades disponibles`,
        };
      }

      // Obtener carrito actual
      const cart = await SQLService.getCart(identity.sessionId);

      // Verificar si el producto ya está en el carrito
      const existingItemIndex = cart.items.findIndex(
        (item) => item.productId === productId
      );

      let updatedItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Actualizar cantidad
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;

        // Verificar stock para nueva cantidad
        if (newQuantity > currentStock) {
          return {
            type: 'add_to_cart',
            success: false,
            payload: { productId, requestedQuantity: newQuantity, currentStock },
            error: `Solo hay ${currentStock} unidades disponibles`,
          };
        }

        updatedItems = cart.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        // Agregar nuevo item
        const newItem: CartItem = {
          productId: product.id,
          name: product.name,
          price: Number(product.price),
          quantity,
          imageUrl: product.image_url,
          maxStock: currentStock,
        };
        updatedItems = [...cart.items, newItem];
      }

      // Calcular nuevo total
      const newTotal = updatedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Actualizar sesión
      await this.updateSession(identity.sessionId, {
        cart_items: updatedItems,
        cart_total: newTotal,
        session_state: 'cart',
      });

      return {
        type: 'add_to_cart',
        success: true,
        payload: {
          productId,
          productName: product.name,
          quantity,
          price: product.price,
        },
        resultData: {
          cartItems: updatedItems.length,
          cartTotal: newTotal,
        },
      };
    } catch (error) {
      console.error('[Actions] Add to cart error:', error);
      return {
        type: 'add_to_cart',
        success: false,
        payload: {},
        error: String(error),
      };
    }
  }

  /**
   * Quita producto del carrito
   */
  static async removeFromCart(
    identity: CustomerIdentity,
    entities: ExtractedEntities
  ): Promise<ActionResult> {
    try {
      const cart = await SQLService.getCart(identity.sessionId);

      if (cart.items.length === 0) {
        return {
          type: 'remove_from_cart',
          success: false,
          payload: {},
          error: 'El carrito está vacío',
        };
      }

      let productToRemove: CartItem | undefined;

      // Buscar por productId o por nombre parcial
      if (entities.productId) {
        productToRemove = cart.items.find(
          (item) => item.productId === entities.productId
        );
      } else if (entities.productName) {
        const searchName = entities.productName.toLowerCase();
        productToRemove = cart.items.find((item) =>
          item.name.toLowerCase().includes(searchName)
        );
      } else {
        // Si no especifica, quitar el último agregado
        productToRemove = cart.items[cart.items.length - 1];
      }

      if (!productToRemove) {
        return {
          type: 'remove_from_cart',
          success: false,
          payload: {},
          error: 'No encontré ese producto en tu carrito',
        };
      }

      // Filtrar el producto
      const updatedItems = cart.items.filter(
        (item) => item.productId !== productToRemove!.productId
      );

      const newTotal = updatedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Actualizar sesión
      await this.updateSession(identity.sessionId, {
        cart_items: updatedItems,
        cart_total: newTotal,
        session_state: updatedItems.length > 0 ? 'cart' : 'idle',
      });

      return {
        type: 'remove_from_cart',
        success: true,
        payload: {
          productId: productToRemove.productId,
          productName: productToRemove.name,
        },
        resultData: {
          cartItems: updatedItems.length,
          cartTotal: newTotal,
        },
      };
    } catch (error) {
      console.error('[Actions] Remove from cart error:', error);
      return {
        type: 'remove_from_cart',
        success: false,
        payload: {},
        error: String(error),
      };
    }
  }

  /**
   * Actualiza cantidad de un producto en el carrito
   */
  static async updateCartQuantity(
    identity: CustomerIdentity,
    entities: ExtractedEntities
  ): Promise<ActionResult> {
    try {
      if (!entities.quantity) {
        return {
          type: 'update_cart_quantity',
          success: false,
          payload: {},
          error: 'No especificaste la cantidad',
        };
      }

      const cart = await SQLService.getCart(identity.sessionId);
      let productToUpdate: CartItem | undefined;

      if (entities.productId) {
        productToUpdate = cart.items.find(
          (item) => item.productId === entities.productId
        );
      } else if (entities.productName) {
        const searchName = entities.productName.toLowerCase();
        productToUpdate = cart.items.find((item) =>
          item.name.toLowerCase().includes(searchName)
        );
      } else if (cart.items.length === 1) {
        productToUpdate = cart.items[0];
      }

      if (!productToUpdate) {
        return {
          type: 'update_cart_quantity',
          success: false,
          payload: {},
          error: 'No encontré el producto a actualizar',
        };
      }

      // Verificar stock
      const { available, currentStock } = await SQLService.checkStock(
        productToUpdate.productId,
        entities.quantity
      );

      if (!available) {
        return {
          type: 'update_cart_quantity',
          success: false,
          payload: { requestedQuantity: entities.quantity, currentStock },
          error: `Solo hay ${currentStock} unidades disponibles`,
        };
      }

      // Actualizar cantidad
      const updatedItems = cart.items.map((item) =>
        item.productId === productToUpdate!.productId
          ? { ...item, quantity: entities.quantity! }
          : item
      );

      const newTotal = updatedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      await this.updateSession(identity.sessionId, {
        cart_items: updatedItems,
        cart_total: newTotal,
      });

      return {
        type: 'update_cart_quantity',
        success: true,
        payload: {
          productName: productToUpdate.name,
          newQuantity: entities.quantity,
        },
        resultData: { cartTotal: newTotal },
      };
    } catch (error) {
      return {
        type: 'update_cart_quantity',
        success: false,
        payload: {},
        error: String(error),
      };
    }
  }

  /**
   * Aplica un cupón al carrito
   */
  static async applyCoupon(
    identity: CustomerIdentity,
    couponCode: string
  ): Promise<ActionResult> {
    try {
      // Verificar cupón
      const couponContext = await SQLService.getCouponContext(
        identity.storeId,
        couponCode
      );

      if (!couponContext.data || !(couponContext.data as { isValid?: boolean }).isValid) {
        return {
          type: 'apply_coupon',
          success: false,
          payload: { couponCode },
          error: couponContext.formattedText,
        };
      }

      const coupon = couponContext.data as {
        id: string;
        code: string;
        discount_type: 'percentage' | 'fixed';
        discount_value: number;
        min_purchase_amount?: number;
        max_discount_amount?: number;
      };

      // Obtener carrito
      const cart = await SQLService.getCart(identity.sessionId);

      if (cart.items.length === 0) {
        return {
          type: 'apply_coupon',
          success: false,
          payload: { couponCode },
          error: 'El carrito está vacío',
        };
      }

      // Verificar compra mínima
      if (coupon.min_purchase_amount && cart.subtotal < coupon.min_purchase_amount) {
        return {
          type: 'apply_coupon',
          success: false,
          payload: { couponCode, minPurchase: coupon.min_purchase_amount },
          error: `Compra mínima de $${coupon.min_purchase_amount} MXN requerida`,
        };
      }

      // Calcular descuento
      let discountAmount: number;

      if (coupon.discount_type === 'percentage') {
        discountAmount = (cart.subtotal * coupon.discount_value) / 100;
        if (coupon.max_discount_amount) {
          discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
        }
      } else {
        discountAmount = coupon.discount_value;
      }

      // Actualizar sesión
      await this.updateSession(identity.sessionId, {
        applied_coupon_id: coupon.id,
        applied_coupon_code: coupon.code,
        discount_amount: discountAmount,
      });

      return {
        type: 'apply_coupon',
        success: true,
        payload: {
          couponCode: coupon.code,
          discountType: coupon.discount_type,
          discountValue: coupon.discount_value,
        },
        resultData: {
          discountAmount,
          newTotal: cart.subtotal - discountAmount,
        },
      };
    } catch (error) {
      return {
        type: 'apply_coupon',
        success: false,
        payload: { couponCode },
        error: String(error),
      };
    }
  }

  /**
   * Crea link de checkout (MercadoPago)
   */
  static async createCheckoutLink(
    identity: CustomerIdentity
  ): Promise<ActionResult> {
    try {
      const cart = await SQLService.getCart(identity.sessionId);

      if (cart.items.length === 0) {
        return {
          type: 'create_checkout_link',
          success: false,
          payload: {},
          error: 'El carrito está vacío',
        };
      }

      // Construir URL de checkout
      const checkoutUrl = `${APP_URL}/store/${identity.storeSlug}/checkout?session=${identity.sessionId}`;

      // Actualizar estado de sesión
      await this.updateSession(identity.sessionId, {
        session_state: 'checkout',
      });

      return {
        type: 'create_checkout_link',
        success: true,
        payload: {
          checkoutUrl,
          itemCount: cart.itemCount,
          total: cart.total,
        },
        resultData: {
          checkoutUrl,
          summary: {
            items: cart.itemCount,
            subtotal: cart.subtotal,
            discount: cart.discountAmount,
            total: cart.total,
          },
        },
      };
    } catch (error) {
      return {
        type: 'create_checkout_link',
        success: false,
        payload: {},
        error: String(error),
      };
    }
  }

  /**
   * Limpia el carrito
   */
  static async clearCart(identity: CustomerIdentity): Promise<ActionResult> {
    try {
      await this.updateSession(identity.sessionId, {
        cart_items: [],
        cart_total: 0,
        applied_coupon_id: null,
        applied_coupon_code: null,
        discount_amount: 0,
        session_state: 'idle',
      });

      return {
        type: 'clear_cart',
        success: true,
        payload: {},
      };
    } catch (error) {
      return {
        type: 'clear_cart',
        success: false,
        payload: {},
        error: String(error),
      };
    }
  }

  /**
   * Escala a atención humana
   */
  static escalateToHuman(identity: CustomerIdentity): ActionResult {
    // En producción, esto podría notificar al dueño de la tienda
    return {
      type: 'escalate_to_human',
      success: true,
      payload: {
        phoneNumber: identity.phoneNumber,
        storeId: identity.storeId,
        reason: 'Cliente solicitó atención humana',
      },
      resultData: {
        message:
          'Tu solicitud ha sido enviada. Un representante te contactará pronto.',
      },
    };
  }

  /**
   * Actualiza la sesión de WhatsApp
   */
  private static async updateSession(
    sessionId: string,
    updates: Record<string, unknown>
  ): Promise<void> {
    const { error } = await supabase
      .from('whatsapp_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      console.error('[Actions] Session update error:', error);
      throw new AgentError('Error actualizando sesión', 'ACTION_FAILED', {
        error: error.message,
      });
    }
  }

  /**
   * Crea orden y ticket de OXXO para pago en efectivo
   */
  static async createOxxoCheckout(
    identity: CustomerIdentity
  ): Promise<ActionResult> {
    try {
      const cart = await SQLService.getCart(identity.sessionId);

      if (cart.items.length === 0) {
        return {
          type: 'create_oxxo_ticket',
          success: false,
          payload: {},
          error: 'El carrito está vacío',
        };
      }

      // Obtener datos del cliente
      const { data: customer } = await supabase
        .from('whatsapp_customers')
        .select('customer_name, customer_email, phone_number')
        .eq('id', identity.customerId)
        .single();

      // Obtener datos de la tienda
      const { data: store } = await supabase
        .from('stores')
        .select('id, name, business_name, slug')
        .eq('id', identity.storeId)
        .single();

      if (!store) {
        return {
          type: 'create_oxxo_ticket',
          success: false,
          payload: {},
          error: 'Tienda no encontrada',
        };
      }

      // Crear la orden
      const orderData = {
        store_id: identity.storeId,
        customer_name: customer?.customer_name || 'Cliente WhatsApp',
        customer_email: customer?.customer_email || `${identity.phoneNumber.replace('+', '')}@whatsapp.temp`,
        customer_phone: identity.phoneNumber,
        total_amount: cart.total,
        discount_amount: cart.discountAmount || 0,
        coupon_id: cart.couponId || null,
        status: 'pending',
        payment_method: 'oxxo',
        delivery_method: 'delivery',
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select('id')
        .single();

      if (orderError || !order) {
        console.error('[OXXO] Error creating order:', orderError);
        return {
          type: 'create_oxxo_ticket',
          success: false,
          payload: {},
          error: 'Error al crear la orden',
        };
      }

      // Crear order items
      const orderItems = cart.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      await supabase.from('order_items').insert(orderItems);

      // Crear ticket OXXO
      const nameParts = (customer?.customer_name || 'Cliente').split(' ');
      const storeName = store.business_name || store.name;

      const oxxoResult = await createOxxoTicket({
        orderId: order.id,
        storeId: identity.storeId,
        amount: cart.total,
        description: `Pedido ${storeName}`,
        payer: {
          email: customer?.customer_email || `${identity.phoneNumber.replace('+', '')}@whatsapp.temp`,
          firstName: nameParts[0] || 'Cliente',
          lastName: nameParts.slice(1).join(' ') || 'WhatsApp',
        },
      });

      if (!oxxoResult.success) {
        // Marcar orden como fallida
        await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', order.id);

        return {
          type: 'create_oxxo_ticket',
          success: false,
          payload: {},
          error: oxxoResult.error || 'Error al generar ticket OXXO',
        };
      }

      // Actualizar orden con referencia OXXO
      await supabase
        .from('orders')
        .update({
          oxxo_reference: oxxoResult.reference,
          oxxo_ticket_id: oxxoResult.ticketId,
          oxxo_expiration: oxxoResult.expirationDate,
        })
        .eq('id', order.id);

      // Limpiar carrito después de crear la orden
      await this.updateSession(identity.sessionId, {
        cart_items: [],
        cart_total: 0,
        applied_coupon_id: null,
        applied_coupon_code: null,
        discount_amount: 0,
        session_state: 'idle',
      });

      return {
        type: 'create_oxxo_ticket',
        success: true,
        payload: {
          orderId: order.id,
          reference: formatOxxoReference(oxxoResult.reference!),
          referenceRaw: oxxoResult.reference,
          amount: oxxoResult.amount,
          expirationDate: oxxoResult.expirationDate,
          ticketUrl: oxxoResult.ticketUrl,
        },
        resultData: {
          storeName,
          itemCount: cart.itemCount,
          total: cart.total,
        },
      };
    } catch (error) {
      console.error('[OXXO] Checkout error:', error);
      return {
        type: 'create_oxxo_ticket',
        success: false,
        payload: {},
        error: String(error),
      };
    }
  }

  /**
   * Formatea resultados de acciones para el LLM
   */
  static formatActionResultsForLLM(results: ActionResult[]): string {
    if (results.length === 0) return '';

    const lines: string[] = ['RESULTADO DE ACCIONES:'];

    for (const result of results) {
      if (result.success) {
        lines.push(`✓ ${this.getActionDescription(result)}`);
      } else {
        lines.push(`✗ ${result.type}: ${result.error}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Obtiene descripción legible de una acción
   */
  private static getActionDescription(result: ActionResult): string {
    const payload = result.payload as Record<string, unknown>;
    const resultData = result.resultData as Record<string, unknown>;

    switch (result.type) {
      case 'add_to_cart':
        return `Agregado: ${payload.productName} x${payload.quantity} ($${payload.price} MXN). Carrito: ${resultData?.cartItems} productos, $${resultData?.cartTotal} MXN`;

      case 'remove_from_cart':
        return `Eliminado: ${payload.productName}. Carrito: ${resultData?.cartItems} productos`;

      case 'update_cart_quantity':
        return `Actualizado: ${payload.productName} a ${payload.newQuantity} unidades`;

      case 'apply_coupon':
        return `Cupón aplicado: ${payload.couponCode}. Descuento: $${resultData?.discountAmount} MXN`;

      case 'create_checkout_link':
        return `Link de pago generado: ${resultData?.checkoutUrl}`;

      case 'create_oxxo_ticket':
        return `Ticket OXXO generado. Referencia: ${payload.reference}. Monto: $${payload.amount} MXN. Vence: ${payload.expirationDate}`;

      case 'clear_cart':
        return 'Carrito vaciado';

      case 'escalate_to_human':
        return 'Solicitud de atención enviada';

      default:
        return `${result.type} ejecutado`;
    }
  }
}
