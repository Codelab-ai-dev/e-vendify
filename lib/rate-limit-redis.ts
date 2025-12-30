/**
 * Rate Limiting con Redis - Para Producción
 *
 * Esta implementación usa Redis como backend, permitiendo:
 * - Múltiples instancias del servidor (load balancing)
 * - Persistencia entre reinicios
 * - Rate limiting distribuido
 * - Mayor performance en alta escala
 *
 * INSTALACIÓN:
 * pnpm add ioredis
 *
 * CONFIGURACIÓN:
 * Agregar a .env.local:
 * REDIS_URL=redis://localhost:6379
 * o para producción:
 * REDIS_URL=redis://user:password@host:6379
 */

// NOTA: Descomentar estas líneas después de instalar ioredis
// import Redis from 'ioredis'
// import type { RedisOptions } from 'ioredis'

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

/**
 * Cliente Redis singleton
 */
let redisClient: any = null

export function getRedisClient() {
  if (redisClient) {
    return redisClient
  }

  // Verificar si Redis está disponible
  if (!process.env.REDIS_URL) {
    console.warn('[RATE_LIMIT_REDIS] REDIS_URL no configurado. Usando fallback en memoria.')
    return null
  }

  // DESCOMENTAR después de instalar ioredis:
  /*
  const redisOptions: RedisOptions = {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000)
      return delay
    }
  }

  redisClient = new Redis(process.env.REDIS_URL, redisOptions)

  redisClient.on('error', (error: Error) => {
    console.error('[RATE_LIMIT_REDIS] Error:', error)
  })

  redisClient.on('connect', () => {
    console.log('[RATE_LIMIT_REDIS] Conectado exitosamente')
  })
  */

  return redisClient
}

/**
 * Rate limiting con Sliding Window usando Redis
 *
 * Usa Redis sorted sets para implementar sliding window eficientemente
 */
export async function rateLimitRedis(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  const redis = getRedisClient()

  // Fallback a memoria si Redis no está disponible
  if (!redis) {
    // Importar versión de memoria como fallback
    const { rateLimitSlidingWindow } = require('./rate-limit')
    return rateLimitSlidingWindow(identifier, maxRequests, windowMs)
  }

  // DESCOMENTAR después de instalar ioredis:
  /*
  const key = `rl:${identifier}`
  const now = Date.now()
  const windowStart = now - windowMs

  try {
    // Pipeline para operaciones atómicas
    const pipeline = redis.pipeline()

    // 1. Remover entries antiguos fuera de la ventana
    pipeline.zremrangebyscore(key, 0, windowStart)

    // 2. Contar requests en la ventana actual
    pipeline.zcard(key)

    // 3. Agregar request actual
    pipeline.zadd(key, now, `${now}-${Math.random()}`)

    // 4. Configurar expiración de la key
    pipeline.expire(key, Math.ceil(windowMs / 1000))

    const results = await pipeline.exec()

    if (!results) {
      throw new Error('Redis pipeline failed')
    }

    // results[1] es el resultado de ZCARD (count antes de agregar)
    const currentCount = (results[1][1] as number) || 0

    if (currentCount < maxRequests) {
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - currentCount - 1,
        reset: windowMs
      }
    }

    // Límite excedido - remover el request que acabamos de agregar
    await redis.zrem(key, `${now}-${Math.random()}`)

    // Calcular tiempo hasta reset
    const oldestInWindow = await redis.zrange(key, 0, 0, 'WITHSCORES')
    const oldestTimestamp = oldestInWindow.length > 1
      ? parseInt(oldestInWindow[1])
      : now

    const resetTime = windowMs - (now - oldestTimestamp)

    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: resetTime,
      retryAfter: Math.ceil(resetTime / 1000)
    }
  } catch (error) {
    console.error('[RATE_LIMIT_REDIS] Error en rate limit:', error)

    // En caso de error, permitir el request (fail-open)
    // o podrías preferir denegar (fail-closed) cambiando success a false
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests,
      reset: windowMs
    }
  }
  */

  // Mientras tanto, retornar placeholder
  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests,
    reset: windowMs
  }
}

/**
 * Token Bucket con Redis
 *
 * Usa Redis hash + Lua script para operaciones atómicas
 */
export async function rateLimitTokenBucketRedis(
  identifier: string,
  maxTokens: number = 10,
  refillRate: number = 1,
  refillInterval: number = 1000
): Promise<RateLimitResult> {
  const redis = getRedisClient()

  if (!redis) {
    const { rateLimitTokenBucket } = require('./rate-limit')
    return rateLimitTokenBucket(identifier, maxTokens, refillRate, refillInterval)
  }

  // DESCOMENTAR después de instalar ioredis:
  /*
  const key = `tb:${identifier}`
  const now = Date.now()

  // Lua script para operación atómica de token bucket
  const luaScript = `
    local key = KEYS[1]
    local maxTokens = tonumber(ARGV[1])
    local refillRate = tonumber(ARGV[2])
    local refillInterval = tonumber(ARGV[3])
    local now = tonumber(ARGV[4])

    local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
    local tokens = tonumber(bucket[1]) or maxTokens
    local lastRefill = tonumber(bucket[2]) or now

    -- Calcular tokens a agregar
    local timePassed = now - lastRefill
    local tokensToAdd = math.floor(timePassed / refillInterval) * refillRate

    if tokensToAdd > 0 then
      tokens = math.min(maxTokens, tokens + tokensToAdd)
      lastRefill = now
    end

    -- Intentar consumir token
    if tokens >= 1 then
      tokens = tokens - 1
      redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', lastRefill)
      redis.call('EXPIRE', key, 3600) -- 1 hora
      return {1, tokens, maxTokens}
    else
      return {0, 0, maxTokens}
    end
  `

  try {
    const result = await redis.eval(
      luaScript,
      1,
      key,
      maxTokens,
      refillRate,
      refillInterval,
      now
    ) as [number, number, number]

    const [success, remaining, limit] = result

    if (success === 1) {
      return {
        success: true,
        limit: limit,
        remaining: Math.floor(remaining),
        reset: Math.ceil((limit - remaining) * (refillInterval / refillRate))
      }
    }

    const timeUntilNextToken = refillInterval
    return {
      success: false,
      limit: limit,
      remaining: 0,
      reset: timeUntilNextToken,
      retryAfter: Math.ceil(timeUntilNextToken / 1000)
    }
  } catch (error) {
    console.error('[RATE_LIMIT_REDIS] Error en token bucket:', error)
    return {
      success: true,
      limit: maxTokens,
      remaining: maxTokens,
      reset: refillInterval
    }
  }
  */

  return {
    success: true,
    limit: maxTokens,
    remaining: maxTokens,
    reset: refillInterval
  }
}

/**
 * Estrategia combinada con Redis
 */
export async function rateLimitCombinedRedis(
  identifier: string,
  config: {
    maxTokens?: number
    refillRate?: number
    refillInterval?: number
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

  // Token bucket primero
  const tbResult = await rateLimitTokenBucketRedis(
    identifier,
    maxTokens,
    refillRate,
    refillInterval
  )

  if (!tbResult.success) {
    return tbResult
  }

  // Sliding window después
  const swResult = await rateLimitRedis(identifier, maxRequests, windowMs)

  if (!swResult.success) {
    // Devolver el token que consumimos
    // (en implementación completa de Redis)
    return swResult
  }

  return {
    success: true,
    limit: maxRequests,
    remaining: Math.min(tbResult.remaining, swResult.remaining),
    reset: Math.max(tbResult.reset, swResult.reset)
  }
}

/**
 * Obtener estadísticas de rate limiting desde Redis
 */
export async function getRateLimitStats(identifier: string) {
  const redis = getRedisClient()
  if (!redis) {
    return null
  }

  // DESCOMENTAR después de instalar ioredis:
  /*
  try {
    const keys = await redis.keys(`rl:${identifier}*`)
    const stats = {
      activeWindows: keys.length,
      identifier,
      windows: [] as any[]
    }

    for (const key of keys) {
      const count = await redis.zcard(key)
      const ttl = await redis.ttl(key)
      stats.windows.push({ key, count, ttl })
    }

    return stats
  } catch (error) {
    console.error('[RATE_LIMIT_REDIS] Error obteniendo stats:', error)
    return null
  }
  */

  return null
}

/**
 * Limpiar rate limits de un identificador
 * Útil para resetear límites manualmente
 */
export async function clearRateLimit(identifier: string) {
  const redis = getRedisClient()
  if (!redis) {
    console.warn('Redis no disponible, no se puede limpiar')
    return false
  }

  // DESCOMENTAR después de instalar ioredis:
  /*
  try {
    const keys = await redis.keys(`*:${identifier}`)
    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(`[RATE_LIMIT_REDIS] Limpiados ${keys.length} keys para ${identifier}`)
      return true
    }
    return false
  } catch (error) {
    console.error('[RATE_LIMIT_REDIS] Error limpiando:', error)
    return false
  }
  */

  return false
}

/**
 * Health check de Redis
 */
export async function redisHealthCheck(): Promise<boolean> {
  const redis = getRedisClient()
  if (!redis) {
    return false
  }

  // DESCOMENTAR después de instalar ioredis:
  /*
  try {
    const result = await redis.ping()
    return result === 'PONG'
  } catch (error) {
    console.error('[RATE_LIMIT_REDIS] Health check failed:', error)
    return false
  }
  */

  return false
}

/**
 * Cerrar conexión Redis (cleanup)
 */
export async function closeRedis() {
  if (redisClient) {
    // DESCOMENTAR después de instalar ioredis:
    // await redisClient.quit()
    redisClient = null
    console.log('[RATE_LIMIT_REDIS] Conexión cerrada')
  }
}

// Cleanup al terminar proceso
if (typeof process !== 'undefined') {
  process.on('SIGTERM', closeRedis)
  process.on('SIGINT', closeRedis)
}
