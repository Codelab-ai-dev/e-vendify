/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
