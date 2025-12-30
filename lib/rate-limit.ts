/**
 * Rate Limiting Utility
 *
 * Implementa múltiples estrategias de rate limiting:
 * - Token Bucket: Para límites flexibles con burst capacity
 * - Sliding Window: Para límites más estrictos y precisos
 * - IP-based: Previene abuso por dirección IP
 * - Endpoint-based: Diferentes límites por tipo de endpoint
 */

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

interface RateLimitConfig {
  interval: number // Ventana de tiempo en ms
  uniqueTokenPerInterval: number // Máximo de requests únicos en la ventana
}

interface TokenBucket {
  tokens: number
  lastRefill: number
}

// Store en memoria (para producción considerar Redis)
const tokenBuckets = new Map<string, TokenBucket>()
const slidingWindows = new Map<string, number[]>()

/**
 * Rate limiter basado en Token Bucket
 * Permite burst de requests pero mantiene un rate promedio
 */
export async function rateLimitTokenBucket(
  identifier: string,
  maxTokens: number = 10,
  refillRate: number = 1, // tokens por segundo
  refillInterval: number = 1000 // ms
): Promise<RateLimitResult> {
  const now = Date.now()
  const key = `tb_${identifier}`

  let bucket = tokenBuckets.get(key)

  if (!bucket) {
    bucket = {
      tokens: maxTokens,
      lastRefill: now
    }
    tokenBuckets.set(key, bucket)
  }

  // Calcular tokens a agregar desde el último refill
  const timePassed = now - bucket.lastRefill
  const tokensToAdd = Math.floor(timePassed / refillInterval) * refillRate

  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(maxTokens, bucket.tokens + tokensToAdd)
    bucket.lastRefill = now
  }

  // Intentar consumir un token
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1

    return {
      success: true,
      limit: maxTokens,
      remaining: Math.floor(bucket.tokens),
      reset: Math.ceil((maxTokens - bucket.tokens) * (refillInterval / refillRate))
    }
  }

  // No hay tokens disponibles
  const timeUntilNextToken = refillInterval - (now - bucket.lastRefill)

  return {
    success: false,
    limit: maxTokens,
    remaining: 0,
    reset: timeUntilNextToken,
    retryAfter: Math.ceil(timeUntilNextToken / 1000)
  }
}

/**
 * Rate limiter basado en Sliding Window
 * Más preciso pero más costoso computacionalmente
 */
export async function rateLimitSlidingWindow(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minuto por defecto
): Promise<RateLimitResult> {
  const now = Date.now()
  const key = `sw_${identifier}`

  let requests = slidingWindows.get(key) || []

  // Limpiar requests fuera de la ventana
  requests = requests.filter(timestamp => now - timestamp < windowMs)

  if (requests.length < maxRequests) {
    requests.push(now)
    slidingWindows.set(key, requests)

    const oldestRequest = requests[0] || now
    const resetTime = windowMs - (now - oldestRequest)

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - requests.length,
      reset: resetTime
    }
  }

  // Límite alcanzado
  const oldestRequest = requests[0]
  const resetTime = windowMs - (now - oldestRequest)

  return {
    success: false,
    limit: maxRequests,
    remaining: 0,
    reset: resetTime,
    retryAfter: Math.ceil(resetTime / 1000)
  }
}

/**
 * Obtener identificador único del request
 * Prioriza: API Key > IP Address > User Agent hash
 */
export function getRequestIdentifier(request: Request): string {
  // 1. Intentar obtener API key si existe
  const apiKey = request.headers.get('x-api-key')
  if (apiKey) {
    return `api_${apiKey}`
  }

  // 2. Obtener IP del cliente
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  let ip = 'unknown'
  if (forwardedFor) {
    ip = forwardedFor.split(',')[0].trim()
  } else if (realIp) {
    ip = realIp
  }

  // 3. Agregar user agent para mayor granularidad
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const uaHash = simpleHash(userAgent)

  return `ip_${ip}_${uaHash}`
}

/**
 * Hash simple para user agent
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Limpiar buckets antiguos periódicamente
 * Llamar esto con un cron job o setInterval
 */
export function cleanupOldBuckets(maxAge: number = 3600000): void {
  const now = Date.now()

  // Limpiar token buckets
  for (const [key, bucket] of tokenBuckets.entries()) {
    if (now - bucket.lastRefill > maxAge) {
      tokenBuckets.delete(key)
    }
  }

  // Limpiar sliding windows
  for (const [key, requests] of slidingWindows.entries()) {
    const filtered = requests.filter(timestamp => now - timestamp < maxAge)
    if (filtered.length === 0) {
      slidingWindows.delete(key)
    } else {
      slidingWindows.set(key, filtered)
    }
  }
}

// Limpiar cada hora
if (typeof window === 'undefined') {
  setInterval(() => cleanupOldBuckets(), 3600000)
}

/**
 * Rate limiter combinado que usa ambas estrategias
 * Token bucket para burst protection + Sliding window para rate estricto
 */
export async function rateLimitCombined(
  identifier: string,
  config: {
    // Token bucket config
    maxTokens?: number
    refillRate?: number
    refillInterval?: number
    // Sliding window config
    maxRequests?: number
    windowMs?: number
  } = {}
): Promise<RateLimitResult> {
  const {
    maxTokens = 10,
    refillRate = 1,
    refillInterval = 1000,
    maxRequests = 100,
    windowMs = 60000
  } = config

  // Primero verificar token bucket (burst protection)
  const tbResult = await rateLimitTokenBucket(
    identifier,
    maxTokens,
    refillRate,
    refillInterval
  )

  if (!tbResult.success) {
    return tbResult
  }

  // Luego verificar sliding window (rate limit general)
  const swResult = await rateLimitSlidingWindow(
    identifier,
    maxRequests,
    windowMs
  )

  if (!swResult.success) {
    // Devolver el token que consumimos
    const bucket = tokenBuckets.get(`tb_${identifier}`)
    if (bucket) {
      bucket.tokens = Math.min(maxTokens, bucket.tokens + 1)
    }
    return swResult
  }

  // Ambas validaciones pasaron
  return {
    success: true,
    limit: maxRequests,
    remaining: Math.min(tbResult.remaining, swResult.remaining),
    reset: Math.max(tbResult.reset, swResult.reset)
  }
}
