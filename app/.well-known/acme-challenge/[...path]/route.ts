import { NextRequest, NextResponse } from 'next/server'

// Esta ruta permite que Traefik/Let's Encrypt maneje los ACME challenges
// sin que Next.js interfiera con el proceso de verificación SSL

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Obtener la ruta completa del challenge
  const challengePath = params.path.join('/')
  const fullPath = `/.well-known/acme-challenge/${challengePath}`
  
  console.log(`ACME Challenge solicitado: ${fullPath}`)
  
  // En un entorno con Traefik, este endpoint normalmente no debería ser alcanzado
  // porque Traefik debería interceptar estas rutas antes de llegar a Next.js
  // Sin embargo, si llega aquí, devolvemos un 404 para que Traefik pueda manejar la respuesta
  
  return new NextResponse('ACME Challenge - Handled by Traefik', {
    status: 404,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Manejar requests HEAD para ACME challenges
  return new NextResponse(null, {
    status: 404,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
