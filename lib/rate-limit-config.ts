/**
 * Configuración de Rate Limiting por Endpoint
 *
 * Define diferentes límites según el tipo de endpoint y su criticidad
 */

export interface EndpointRateLimit {
  // Token Bucket settings
  maxTokens: number // Máximo de tokens (burst capacity)
  refillRate: number // Tokens por segundo
  refillInterval: number // Intervalo de refill en ms

  // Sliding Window settings
  maxRequests: number // Máximo de requests en ventana
  windowMs: number // Tamaño de ventana en ms

  // Metadata
  description: string
}

/**
 * Configuraciones predefinidas para diferentes tipos de endpoints
 */
export const rateLimitPresets = {
  // Para endpoints públicos de lectura (tiendas, productos)
  publicRead: {
    maxTokens: 20,
    refillRate: 2,
    refillInterval: 1000,
    maxRequests: 100,
    windowMs: 60000, // 100 requests por minuto
    description: 'Endpoints públicos de lectura'
  },

  // Para autenticación (login, registro)
  auth: {
    maxTokens: 5,
    refillRate: 1,
    refillInterval: 2000,
    maxRequests: 10,
    windowMs: 300000, // 10 requests por 5 minutos
    description: 'Endpoints de autenticación'
  },

  // Para operaciones de escritura (crear producto, actualizar tienda)
  write: {
    maxTokens: 10,
    refillRate: 1,
    refillInterval: 1000,
    maxRequests: 50,
    windowMs: 60000, // 50 requests por minuto
    description: 'Operaciones de escritura'
  },

  // Para checkout y pagos (más restrictivo)
  payment: {
    maxTokens: 3,
    refillRate: 1,
    refillInterval: 5000,
    maxRequests: 20,
    windowMs: 3600000, // 20 requests por hora
    description: 'Endpoints de pago'
  },

  // Para búsquedas (pueden ser costosas)
  search: {
    maxTokens: 15,
    refillRate: 2,
    refillInterval: 1000,
    maxRequests: 60,
    windowMs: 60000, // 60 requests por minuto
    description: 'Endpoints de búsqueda'
  },

  // Para API keys (límites más generosos)
  apiKey: {
    maxTokens: 50,
    refillRate: 5,
    refillInterval: 1000,
    maxRequests: 1000,
    windowMs: 60000, // 1000 requests por minuto
    description: 'Requests con API key'
  },

  // Para admin (menos restrictivo pero monitoreado)
  admin: {
    maxTokens: 30,
    refillRate: 3,
    refillInterval: 1000,
    maxRequests: 200,
    windowMs: 60000, // 200 requests por minuto
    description: 'Endpoints de administración'
  },

  // Para webhooks externos (MercadoPago, etc)
  webhook: {
    maxTokens: 10,
    refillRate: 2,
    refillInterval: 1000,
    maxRequests: 100,
    windowMs: 60000, // 100 requests por minuto
    description: 'Webhooks externos'
  }
} as const

/**
 * Mapeo de rutas a configuraciones de rate limit
 *
 * Las rutas se evalúan en orden, la primera que coincida se aplica
 */
export const endpointRateLimits: Array<{
  pattern: RegExp
  config: EndpointRateLimit
  name: string
}> = [
  // 1. Autenticación
  {
    pattern: /^\/(login|register|auth\/callback|confirm-email)/,
    config: rateLimitPresets.auth,
    name: 'auth'
  },

  // 2. Checkout y pagos
  {
    pattern: /^\/api\/checkout|\/store\/[^/]+\/checkout/,
    config: rateLimitPresets.payment,
    name: 'payment'
  },

  // 3. Admin
  {
    pattern: /^\/admin/,
    config: rateLimitPresets.admin,
    name: 'admin'
  },

  // 4. Dashboard (operaciones de escritura)
  {
    pattern: /^\/dashboard\/(products\/new|products\/edit|orders)/,
    config: rateLimitPresets.write,
    name: 'dashboard-write'
  },

  // 5. Búsquedas
  {
    pattern: /\/search|\/api\/search/,
    config: rateLimitPresets.search,
    name: 'search'
  },

  // 6. Tiendas públicas (lectura)
  {
    pattern: /^\/store\/[^/]+/,
    config: rateLimitPresets.publicRead,
    name: 'store-public'
  },

  // 7. API routes genéricos
  {
    pattern: /^\/api\//,
    config: rateLimitPresets.write,
    name: 'api-generic'
  }
]

/**
 * Rutas que están exentas de rate limiting
 */
export const rateLimitExemptions: RegExp[] = [
  /^\/_next\//, // Next.js internals
  /^\/favicon\.ico$/,
  /^\/.*\.(jpg|jpeg|png|gif|svg|webp|ico)$/, // Imágenes estáticas
  /^\/\.well-known\//, // ACME challenges, etc
  /^\/health$/, // Health checks
  /^\/api\/health$/ // API health checks
]

/**
 * Obtener configuración de rate limit para una ruta
 */
export function getRateLimitConfig(pathname: string): {
  config: EndpointRateLimit
  name: string
} | null {
  // Verificar si está exenta
  for (const exemption of rateLimitExemptions) {
    if (exemption.test(pathname)) {
      return null
    }
  }

  // Buscar configuración específica
  for (const { pattern, config, name } of endpointRateLimits) {
    if (pattern.test(pathname)) {
      return { config, name }
    }
  }

  // Configuración por defecto (público de lectura)
  return {
    config: rateLimitPresets.publicRead,
    name: 'default'
  }
}

/**
 * Headers estándar de rate limit según RFC 6585
 */
export function getRateLimitHeaders(result: {
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(Date.now() + result.reset).toISOString(),
    ...(result.retryAfter && {
      'Retry-After': result.retryAfter.toString()
    })
  }
}
