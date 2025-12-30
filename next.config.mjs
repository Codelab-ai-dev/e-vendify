/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Habilitar optimización de imágenes con sharp
    unoptimized: false,
    // Formatos modernos para mejor compresión
    formats: ['image/avif', 'image/webp'],
    // Dominios remotos permitidos
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Permitir todos los dominios HTTPS
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    // Tamaños de dispositivos para responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Tamaños de imagen para diferentes layouts
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache optimizado
    minimumCacheTTL: 60, // 60 segundos
  },
  // Configuración para permitir ACME challenges de Traefik/Let's Encrypt
  async rewrites() {
    return {
      beforeFiles: [
        // Permitir que Traefik maneje los ACME challenges
        {
          source: '/.well-known/acme-challenge/:path*',
          destination: '/.well-known/acme-challenge/:path*',
          has: [
            {
              type: 'header',
              key: 'host',
            },
          ],
        },
      ],
    }
  },
  // Headers para permitir que el reverse proxy maneje SSL
  async headers() {
    return [
      {
        source: '/.well-known/acme-challenge/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ]
  },
}

export default nextConfig
