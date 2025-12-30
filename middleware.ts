import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimitCombined, getRequestIdentifier } from '@/lib/rate-limit'
import { getRateLimitConfig, getRateLimitHeaders } from '@/lib/rate-limit-config'

/**
 * Middleware de Next.js con Rate Limiting
 *
 * Funcionalidades:
 * 1. ACME challenges para SSL (Traefik)
 * 2. Rate limiting por endpoint con múltiples estrategias
 * 3. Headers estándar de rate limit
 * 4. Logging de violaciones
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. ACME Challenges - permitir que Traefik maneje SSL
  if (pathname.startsWith('/.well-known/acme-challenge/')) {
    console.log(`[ACME] Challenge interceptado: ${pathname}`)

    return new NextResponse('ACME Challenge - Should be handled by Traefik', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Acme-Challenge': 'true',
      },
    })
  }

  // 2. Rate Limiting
  const rateLimitSetup = getRateLimitConfig(pathname)

  // Si la ruta está exenta, continuar sin rate limit
  if (!rateLimitSetup) {
    return NextResponse.next()
  }

  const { config, name } = rateLimitSetup
  const identifier = getRequestIdentifier(request)

  try {
    // Aplicar rate limiting
    const result = await rateLimitCombined(identifier, config)

    // Obtener headers estándar
    const rateLimitHeaders = getRateLimitHeaders(result)

    // Si el límite fue excedido
    if (!result.success) {
      console.warn(`[RATE_LIMIT] Límite excedido - Endpoint: ${name}, Path: ${pathname}, Identifier: ${identifier}`)

      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Has excedido el límite de solicitudes. Por favor, intenta más tarde.',
          retryAfter: result.retryAfter,
          limit: result.limit,
          reset: new Date(Date.now() + result.reset).toISOString()
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...rateLimitHeaders,
          },
        }
      )
    }

    // Request permitido - agregar headers informativos
    const response = NextResponse.next()

    // Agregar headers de rate limit a la respuesta
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Header adicional para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      response.headers.set('X-RateLimit-Endpoint', name)
    }

    return response

  } catch (error) {
    // En caso de error en el rate limiter, permitir el request
    // pero loguear el error para investigación
    console.error('[RATE_LIMIT] Error en middleware:', error)

    // En producción, podrías querer denegar el request por seguridad
    // Por ahora, permitimos continuar para evitar interrupciones
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    // Aplicar a todas las rutas excepto recursos estáticos
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|png|gif|svg|webp|ico)).*)',
  ],
}
