import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Permitir que Traefik maneje los ACME challenges para SSL
  if (request.nextUrl.pathname.startsWith('/.well-known/acme-challenge/')) {
    console.log(`ACME Challenge interceptado: ${request.nextUrl.pathname}`)
    
    // Devolver una respuesta que indique que Traefik debe manejar esto
    // En un setup correcto, Traefik debería interceptar estas rutas
    // antes de que lleguen a Next.js
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

  // Para todas las demás rutas, continuar normalmente
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Aplicar middleware a rutas ACME challenge
    '/.well-known/acme-challenge/:path*',
    // Excluir archivos estáticos y API routes que no necesitan middleware
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
