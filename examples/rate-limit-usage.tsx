/**
 * Ejemplos de Uso de Rate Limiting
 *
 * Este archivo muestra cómo implementar rate limiting en diferentes escenarios
 */

import { RateLimitError, useRateLimitHandler } from '@/components/RateLimitError'
import { toast } from 'sonner'

// ============================================
// EJEMPLO 1: Fetch con manejo de rate limit
// ============================================

export async function fetchWithRateLimit(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options)

    // Verificar headers de rate limit
    const limit = response.headers.get('X-RateLimit-Limit')
    const remaining = response.headers.get('X-RateLimit-Remaining')

    // Alertar si quedan pocas solicitudes
    if (remaining && parseInt(remaining) < 5) {
      console.warn(`⚠️ Rate limit warning: ${remaining}/${limit} requests remaining`)
    }

    // Manejar 429
    if (response.status === 429) {
      const data = await response.json()
      throw new RateLimitException(data)
    }

    return response
  } catch (error) {
    if (error instanceof RateLimitException) {
      console.error('Rate limit exceeded:', error.data)
      throw error
    }
    throw error
  }
}

class RateLimitException extends Error {
  constructor(public data: any) {
    super('Rate limit exceeded')
    this.name = 'RateLimitException'
  }
}

// ============================================
// EJEMPLO 2: Hook de React con retry automático
// ============================================

export function useApiWithRateLimit<T>(
  fetcher: () => Promise<T>,
  options: { maxRetries?: number } = {}
) {
  const { maxRetries = 3 } = options
  const { rateLimitError, handleResponse, clearError } = useRateLimitHandler()

  const execute = async (retryCount = 0): Promise<T | null> => {
    try {
      const result = await fetcher()
      return result
    } catch (error: any) {
      if (error.response?.status === 429) {
        const processedResponse = await handleResponse(error.response)

        if (!processedResponse && retryCount < maxRetries) {
          const retryAfter = error.response.headers.get('Retry-After')
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : 60000

          console.log(`Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`)

          await new Promise(resolve => setTimeout(resolve, delay))
          return execute(retryCount + 1)
        }
      }
      throw error
    }
  }

  return { execute, rateLimitError, clearError }
}

// ============================================
// EJEMPLO 3: Componente de formulario con rate limit
// ============================================

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function LoginFormExample() {
  const { rateLimitError, handleResponse } = useRateLimitHandler()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '...', password: '...' })
      })

      const processedResponse = await handleResponse(response)

      if (!processedResponse) {
        // Rate limit excedido, el error ya está en estado
        return
      }

      if (processedResponse.ok) {
        toast.success('Login exitoso')
      }
    } catch (error) {
      toast.error('Error en login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {rateLimitError && (
        <RateLimitError
          retryAfter={rateLimitError.retryAfter}
          limit={rateLimitError.limit}
          reset={rateLimitError.reset}
          onRetry={() => handleSubmit(new Event('submit') as any)}
        />
      )}

      {/* Campos del formulario */}

      <Button type="submit" disabled={loading || !!rateLimitError}>
        Iniciar Sesión
      </Button>
    </form>
  )
}

// ============================================
// EJEMPLO 4: Interceptor global de fetch
// ============================================

export function setupRateLimitInterceptor() {
  const originalFetch = window.fetch

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const response = await originalFetch(input, init)

    // Log automático de headers de rate limit
    if (process.env.NODE_ENV === 'development') {
      const limit = response.headers.get('X-RateLimit-Limit')
      const remaining = response.headers.get('X-RateLimit-Remaining')
      const endpoint = response.headers.get('X-RateLimit-Endpoint')

      if (limit && remaining) {
        console.log(`[Rate Limit] ${endpoint}: ${remaining}/${limit}`)
      }
    }

    // Manejar 429 globalmente
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      toast.error(`Demasiadas solicitudes. Espera ${retryAfter}s`, {
        duration: parseInt(retryAfter || '60') * 1000
      })
    }

    return response
  }
}

// Activar en _app.tsx o layout.tsx:
// useEffect(() => { setupRateLimitInterceptor() }, [])

// ============================================
// EJEMPLO 5: Debouncing con rate limit awareness
// ============================================

export function useRateLimitAwareDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
) {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>()
  const { rateLimitError } = useRateLimitHandler()

  const debouncedCallback = (...args: Parameters<T>) => {
    // Si hay rate limit activo, no hacer nada
    if (rateLimitError) {
      console.warn('Debounced action blocked due to rate limit')
      return
    }

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    const newTimeoutId = setTimeout(() => {
      callback(...args)
    }, delay)

    setTimeoutId(newTimeoutId)
  }

  return debouncedCallback
}

// ============================================
// EJEMPLO 6: Queue de requests con rate limit
// ============================================

class RateLimitedQueue {
  private queue: Array<() => Promise<any>> = []
  private processing = false
  private lastRequestTime = 0
  private minInterval = 1000 // 1 request por segundo

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      this.process()
    })
  }

  private async process() {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    while (this.queue.length > 0) {
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime

      // Esperar si es necesario
      if (timeSinceLastRequest < this.minInterval) {
        await new Promise(resolve =>
          setTimeout(resolve, this.minInterval - timeSinceLastRequest)
        )
      }

      const request = this.queue.shift()
      if (request) {
        try {
          await request()
          this.lastRequestTime = Date.now()
        } catch (error) {
          console.error('Request failed:', error)

          // Si es 429, pausar el queue
          if ((error as any).response?.status === 429) {
            const retryAfter = (error as any).response.headers.get('Retry-After')
            const delay = parseInt(retryAfter || '60') * 1000

            console.log(`Queue paused for ${delay}ms due to rate limit`)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }
    }

    this.processing = false
  }
}

// Uso:
const apiQueue = new RateLimitedQueue()

export async function queuedApiCall<T>(fetcher: () => Promise<T>): Promise<T> {
  return apiQueue.add(fetcher)
}

// ============================================
// EJEMPLO 7: Monitoring de rate limits
// ============================================

export class RateLimitMonitor {
  private static limits = new Map<string, { limit: number; remaining: number; reset: string }>()

  static track(endpoint: string, headers: Headers) {
    const limit = headers.get('X-RateLimit-Limit')
    const remaining = headers.get('X-RateLimit-Remaining')
    const reset = headers.get('X-RateLimit-Reset')

    if (limit && remaining && reset) {
      this.limits.set(endpoint, {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        reset
      })

      // Alertar si quedan < 20%
      const percentRemaining = (parseInt(remaining) / parseInt(limit)) * 100
      if (percentRemaining < 20) {
        console.warn(`⚠️ Low rate limit on ${endpoint}: ${remaining}/${limit} (${percentRemaining.toFixed(1)}%)`)
      }
    }
  }

  static getStatus(endpoint: string) {
    return this.limits.get(endpoint)
  }

  static getAllStatus() {
    return Array.from(this.limits.entries()).map(([endpoint, status]) => ({
      endpoint,
      ...status,
      percentRemaining: (status.remaining / status.limit) * 100
    }))
  }
}

// Usar en interceptor:
// RateLimitMonitor.track('/api/products', response.headers)
