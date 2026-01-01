// ============================================================================
// E-VENDIFY: Router Service
// Clasifica intents y extrae entidades del mensaje del usuario
// ============================================================================

import {
  Intent,
  IntentClassification,
  ExtractedEntities,
  CustomerIdentity,
} from '@/lib/types/agent.types';

// ============================================================================
// PATTERNS DE KEYWORDS CON PESOS
// ============================================================================

interface IntentPattern {
  intent: Intent;
  keywords: Array<{ word: string; weight: number }>;
  approach: 'rag' | 'sql' | 'action' | 'both' | 'llm_only';
  requiresConfirmation: boolean;
}

const INTENT_PATTERNS: IntentPattern[] = [
  // Saludos
  {
    intent: 'greeting',
    keywords: [
      { word: 'hola', weight: 10 },
      { word: 'buenos dias', weight: 10 },
      { word: 'buenas tardes', weight: 10 },
      { word: 'buenas noches', weight: 10 },
      { word: 'hey', weight: 8 },
      { word: 'hi', weight: 8 },
      { word: 'hello', weight: 8 },
      { word: 'que tal', weight: 7 },
      { word: 'como estas', weight: 6 },
    ],
    approach: 'llm_only',
    requiresConfirmation: false,
  },

  // Despedidas
  {
    intent: 'farewell',
    keywords: [
      { word: 'adios', weight: 10 },
      { word: 'bye', weight: 10 },
      { word: 'hasta luego', weight: 10 },
      { word: 'nos vemos', weight: 9 },
      { word: 'chao', weight: 9 },
      { word: 'gracias por todo', weight: 8 },
      { word: 'eso es todo', weight: 7 },
    ],
    approach: 'llm_only',
    requiresConfirmation: false,
  },

  // Búsqueda de productos
  {
    intent: 'search_product',
    keywords: [
      { word: 'busco', weight: 10 },
      { word: 'quiero', weight: 9 },
      { word: 'necesito', weight: 9 },
      { word: 'tienes', weight: 8 },
      { word: 'tienen', weight: 8 },
      { word: 'hay', weight: 7 },
      { word: 'venden', weight: 8 },
      { word: 'mostrar', weight: 7 },
      { word: 'ver', weight: 6 },
      { word: 'productos', weight: 6 },
      { word: 'catalogo', weight: 8 },
      { word: 'que tienen', weight: 8 },
      { word: 'opciones', weight: 6 },
    ],
    approach: 'rag',
    requiresConfirmation: false,
  },

  // Consulta de precio
  {
    intent: 'price_inquiry',
    keywords: [
      { word: 'precio', weight: 10 },
      { word: 'cuanto', weight: 10 },
      { word: 'cuánto', weight: 10 },
      { word: 'cuesta', weight: 10 },
      { word: 'costo', weight: 9 },
      { word: 'vale', weight: 8 },
      { word: 'valor', weight: 8 },
      { word: 'barato', weight: 6 },
      { word: 'economico', weight: 6 },
      { word: 'descuento', weight: 5 },
    ],
    approach: 'rag',
    requiresConfirmation: false,
  },

  // Verificar stock
  {
    intent: 'stock_check',
    keywords: [
      { word: 'stock', weight: 10 },
      { word: 'disponible', weight: 10 },
      { word: 'disponibilidad', weight: 10 },
      { word: 'quedan', weight: 9 },
      { word: 'hay existencia', weight: 9 },
      { word: 'tienen en', weight: 8 },
      { word: 'agotado', weight: 8 },
      { word: 'inventario', weight: 7 },
    ],
    approach: 'sql',
    requiresConfirmation: false,
  },

  // Agregar al carrito
  {
    intent: 'add_to_cart',
    keywords: [
      { word: 'agregar', weight: 10 },
      { word: 'añadir', weight: 10 },
      { word: 'carrito', weight: 9 },
      { word: 'quiero ese', weight: 9 },
      { word: 'lo quiero', weight: 9 },
      { word: 'me lo llevo', weight: 9 },
      { word: 'dame', weight: 8 },
      { word: 'ponme', weight: 8 },
      { word: 'agrega', weight: 8 },
      { word: 'quiero comprar', weight: 8 },
    ],
    approach: 'both',  // RAG para encontrar el producto + action para agregarlo
    requiresConfirmation: false,
  },

  // Ver carrito
  {
    intent: 'view_cart',
    keywords: [
      { word: 'mi carrito', weight: 10 },
      { word: 'ver carrito', weight: 10 },
      { word: 'que tengo', weight: 9 },
      { word: 'que llevo', weight: 9 },
      { word: 'mostrar carrito', weight: 9 },
      { word: 'mi pedido', weight: 7 },
      { word: 'resumen', weight: 6 },
    ],
    approach: 'sql',
    requiresConfirmation: false,
  },

  // Quitar del carrito
  {
    intent: 'remove_from_cart',
    keywords: [
      { word: 'quitar', weight: 10 },
      { word: 'eliminar', weight: 10 },
      { word: 'remover', weight: 10 },
      { word: 'borrar', weight: 9 },
      { word: 'sacar', weight: 9 },
      { word: 'no quiero', weight: 8 },
      { word: 'cancelar', weight: 7 },
    ],
    approach: 'action',
    requiresConfirmation: true,
  },

  // Actualizar cantidad
  {
    intent: 'update_cart',
    keywords: [
      { word: 'cambiar cantidad', weight: 10 },
      { word: 'modificar', weight: 9 },
      { word: 'actualizar', weight: 9 },
      { word: 'mas unidades', weight: 8 },
      { word: 'menos unidades', weight: 8 },
      { word: 'aumentar', weight: 7 },
      { word: 'reducir', weight: 7 },
    ],
    approach: 'action',
    requiresConfirmation: false,
  },

  // Checkout / Pagar
  {
    intent: 'checkout',
    keywords: [
      { word: 'pagar', weight: 10 },
      { word: 'comprar', weight: 9 },
      { word: 'checkout', weight: 10 },
      { word: 'finalizar', weight: 9 },
      { word: 'ordenar', weight: 8 },
      { word: 'hacer pedido', weight: 9 },
      { word: 'confirmar', weight: 7 },
      { word: 'proceder', weight: 7 },
      { word: 'listo para pagar', weight: 10 },
    ],
    approach: 'action',
    requiresConfirmation: true,
  },

  // Aplicar cupón
  {
    intent: 'apply_coupon',
    keywords: [
      { word: 'cupon', weight: 10 },
      { word: 'cupón', weight: 10 },
      { word: 'codigo', weight: 9 },
      { word: 'código', weight: 9 },
      { word: 'descuento', weight: 8 },
      { word: 'promocion', weight: 8 },
      { word: 'oferta', weight: 7 },
    ],
    approach: 'action',
    requiresConfirmation: false,
  },

  // Tracking de orden
  {
    intent: 'order_tracking',
    keywords: [
      { word: 'donde esta', weight: 10 },
      { word: 'dónde está', weight: 10 },
      { word: 'rastrear', weight: 10 },
      { word: 'tracking', weight: 10 },
      { word: 'estado de mi pedido', weight: 10 },
      { word: 'mi orden', weight: 8 },
      { word: 'ya llego', weight: 8 },
      { word: 'cuando llega', weight: 9 },
      { word: 'envio', weight: 7 },
    ],
    approach: 'sql',
    requiresConfirmation: false,
  },

  // Historial de órdenes
  {
    intent: 'order_history',
    keywords: [
      { word: 'mis pedidos', weight: 10 },
      { word: 'historial', weight: 10 },
      { word: 'ordenes anteriores', weight: 10 },
      { word: 'compras anteriores', weight: 9 },
      { word: 'que he comprado', weight: 9 },
    ],
    approach: 'sql',
    requiresConfirmation: false,
  },

  // FAQ
  {
    intent: 'faq',
    keywords: [
      { word: 'envio gratis', weight: 10 },
      { word: 'metodos de pago', weight: 10 },
      { word: 'formas de pago', weight: 10 },
      { word: 'devolucion', weight: 10 },
      { word: 'devolución', weight: 10 },
      { word: 'garantia', weight: 9 },
      { word: 'garantía', weight: 9 },
      { word: 'tiempo de entrega', weight: 9 },
      { word: 'politica', weight: 8 },
      { word: 'horario', weight: 8 },
      { word: 'donde estan', weight: 7 },
      { word: 'ubicacion', weight: 7 },
    ],
    approach: 'rag',
    requiresConfirmation: false,
  },

  // Info de tienda
  {
    intent: 'store_info',
    keywords: [
      { word: 'sobre ustedes', weight: 10 },
      { word: 'quienes son', weight: 10 },
      { word: 'informacion', weight: 8 },
      { word: 'contacto', weight: 8 },
      { word: 'telefono', weight: 7 },
      { word: 'direccion', weight: 7 },
      { word: 'redes sociales', weight: 7 },
    ],
    approach: 'rag',
    requiresConfirmation: false,
  },

  // Soporte
  {
    intent: 'support',
    keywords: [
      { word: 'ayuda', weight: 8 },
      { word: 'problema', weight: 10 },
      { word: 'queja', weight: 10 },
      { word: 'reclamo', weight: 10 },
      { word: 'hablar con alguien', weight: 10 },
      { word: 'humano', weight: 9 },
      { word: 'persona real', weight: 10 },
      { word: 'asesor', weight: 9 },
      { word: 'no funciona', weight: 9 },
      { word: 'error', weight: 8 },
    ],
    approach: 'action',
    requiresConfirmation: false,
  },
];

// ============================================================================
// EXTRACCIÓN DE ENTIDADES
// ============================================================================

const ENTITY_PATTERNS = {
  // Cantidad numérica
  quantity: /(\d+)\s*(unidad|piezas?|productos?)?/i,

  // Precio máximo
  maxPrice: /menos de \$?(\d+)|hasta \$?(\d+)|maximo \$?(\d+)|max \$?(\d+)/i,

  // Precio mínimo
  minPrice: /mas de \$?(\d+)|desde \$?(\d+)|minimo \$?(\d+)|min \$?(\d+)/i,

  // Tallas
  size: /talla\s*(xs|s|m|l|xl|xxl|\d+)|size\s*(xs|s|m|l|xl|xxl|\d+)/i,

  // Colores
  color: /(negro|blanco|rojo|azul|verde|amarillo|rosa|morado|gris|cafe|marron|naranja|beige)/i,

  // Email
  email: /[\w.-]+@[\w.-]+\.\w+/i,

  // Código de cupón (alfanumérico mayúsculas)
  couponCode: /(?:codigo|cupón?|cupon)\s*:?\s*([A-Z0-9]{4,20})/i,

  // ID de orden
  orderId: /(?:orden|pedido)\s*#?\s*([a-zA-Z0-9-]{8,})/i,

  // Categorías comunes
  category: /(zapatos?|tenis|ropa|playeras?|pantalones?|vestidos?|accesorios?|bolsas?|electronica|comida|bebidas?)/i,
};

export class RouterService {
  /**
   * Clasifica el intent del mensaje del usuario
   */
  static classifyIntent(
    message: string,
    identity: CustomerIdentity
  ): IntentClassification {
    const normalizedMessage = this.normalizeMessage(message);
    const scores: Map<Intent, number> = new Map();

    // Calcular scores para cada intent
    for (const pattern of INTENT_PATTERNS) {
      let score = 0;

      for (const { word, weight } of pattern.keywords) {
        if (normalizedMessage.includes(this.normalizeMessage(word))) {
          score += weight;
        }
      }

      if (score > 0) {
        scores.set(pattern.intent, score);
      }
    }

    // Encontrar el intent con mayor score
    let bestIntent: Intent = 'unknown';
    let bestScore = 0;
    let bestPattern: IntentPattern | null = null;

    for (const [intent, score] of scores) {
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
        bestPattern = INTENT_PATTERNS.find((p) => p.intent === intent) || null;
      }
    }

    // Calcular confianza (normalizar score)
    const maxPossibleScore = 30; // Aproximado
    const confidence = Math.min(bestScore / maxPossibleScore, 1);

    // Ajustar intent basado en contexto de sesión
    const adjustedIntent = this.adjustIntentByContext(
      bestIntent,
      identity,
      normalizedMessage
    );

    // Extraer entidades
    const entities = this.extractEntities(message);

    // Si no se encontró intent pero hay entidades de producto, es búsqueda
    if (adjustedIntent === 'unknown' && (entities.productName || entities.category)) {
      return {
        intent: 'search_product',
        confidence: 0.6,
        entities,
        suggestedApproach: 'rag',
        requiresConfirmation: false,
      };
    }

    return {
      intent: adjustedIntent,
      confidence: adjustedIntent === 'unknown' ? 0.3 : confidence,
      entities,
      suggestedApproach: bestPattern?.approach || 'rag',
      requiresConfirmation: bestPattern?.requiresConfirmation || false,
    };
  }

  /**
   * Normaliza el mensaje para comparación
   */
  private static normalizeMessage(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^\w\s]/g, ' ') // Remover puntuación
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Ajusta el intent basado en el contexto de la sesión
   */
  private static adjustIntentByContext(
    intent: Intent,
    identity: CustomerIdentity,
    message: string
  ): Intent {
    // Si el carrito está vacío y quiere hacer checkout, es búsqueda
    if (intent === 'checkout' && identity.cartItemsCount === 0) {
      return 'search_product';
    }

    // Si dice "si" o "confirmar" y está en checkout
    if (
      identity.sessionState === 'checkout' &&
      /^(si|sí|confirmar|ok|dale|va|listo)$/i.test(message.trim())
    ) {
      return 'checkout';
    }

    // Si dice un número simple y tiene carrito, podría ser agregar
    if (/^\d+$/.test(message.trim()) && identity.cartItemsCount > 0) {
      return 'update_cart';
    }

    return intent;
  }

  /**
   * Extrae entidades del mensaje
   */
  static extractEntities(message: string): ExtractedEntities {
    const entities: ExtractedEntities = {};

    // Cantidad
    const quantityMatch = message.match(ENTITY_PATTERNS.quantity);
    if (quantityMatch) {
      entities.quantity = parseInt(quantityMatch[1], 10);
    }

    // Precio máximo
    const maxPriceMatch = message.match(ENTITY_PATTERNS.maxPrice);
    if (maxPriceMatch) {
      entities.maxPrice = parseInt(
        maxPriceMatch[1] || maxPriceMatch[2] || maxPriceMatch[3] || maxPriceMatch[4],
        10
      );
    }

    // Precio mínimo
    const minPriceMatch = message.match(ENTITY_PATTERNS.minPrice);
    if (minPriceMatch) {
      entities.minPrice = parseInt(
        minPriceMatch[1] || minPriceMatch[2] || minPriceMatch[3] || minPriceMatch[4],
        10
      );
    }

    // Talla
    const sizeMatch = message.match(ENTITY_PATTERNS.size);
    if (sizeMatch) {
      entities.size = (sizeMatch[1] || sizeMatch[2]).toUpperCase();
    }

    // Color
    const colorMatch = message.match(ENTITY_PATTERNS.color);
    if (colorMatch) {
      entities.color = colorMatch[1].toLowerCase();
    }

    // Email
    const emailMatch = message.match(ENTITY_PATTERNS.email);
    if (emailMatch) {
      entities.email = emailMatch[0].toLowerCase();
    }

    // Cupón
    const couponMatch = message.match(ENTITY_PATTERNS.couponCode);
    if (couponMatch) {
      entities.couponCode = couponMatch[1].toUpperCase();
    }

    // Order ID
    const orderMatch = message.match(ENTITY_PATTERNS.orderId);
    if (orderMatch) {
      entities.orderId = orderMatch[1];
    }

    // Categoría
    const categoryMatch = message.match(ENTITY_PATTERNS.category);
    if (categoryMatch) {
      entities.category = categoryMatch[1].toLowerCase();
    }

    // Extraer posible nombre de producto (lo que queda después de keywords)
    const productName = this.extractProductName(message);
    if (productName) {
      entities.productName = productName;
    }

    // Si no hay entidades específicas, guardar query completa
    if (Object.keys(entities).length === 0) {
      entities.customQuery = message.trim();
    }

    return entities;
  }

  /**
   * Extrae el nombre del producto del mensaje
   */
  private static extractProductName(message: string): string | null {
    // Remover keywords de intent
    const cleanMessage = message
      .replace(
        /\b(busco|quiero|necesito|tienes|tienen|hay|venden|agregar|añadir|carrito|comprar|precio|cuanto|cuesta)\b/gi,
        ''
      )
      .replace(/\s+/g, ' ')
      .trim();

    // Si queda algo significativo (más de 2 caracteres)
    if (cleanMessage.length > 2) {
      return cleanMessage;
    }

    return null;
  }

  /**
   * Obtiene keywords de búsqueda para RAG
   */
  static getSearchKeywords(entities: ExtractedEntities): string {
    const parts: string[] = [];

    if (entities.productName) parts.push(entities.productName);
    if (entities.category) parts.push(entities.category);
    if (entities.color) parts.push(entities.color);
    if (entities.size) parts.push(`talla ${entities.size}`);
    if (entities.customQuery) parts.push(entities.customQuery);

    return parts.join(' ').trim() || 'productos';
  }
}
