import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Poppins, Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { ThemeProvider } from "@/components/theme-provider"
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'e-vendify',
  description: 'Plataforma digital para emprendedores y pequeños negocios',
  generator: 'e-vendify',
  icons: {
    icon: [
      {
        url: '/e-vendify-icon-tight.webp',
        sizes: '32x32',
        type: 'image/webp',
      },
      {
        url: '/vendify_logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
    shortcut: '/e-vendify-icon-tight.webp',
    apple: [
      {
        url: '/e-vendify-icon-tight.webp',
        sizes: '180x180',
        type: 'image/webp',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${inter.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
  --font-poppins: ${poppins.style.fontFamily};
  --font-inter: ${inter.style.fontFamily};
}
        `}</style>
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} ${poppins.variable} ${inter.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={4000}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
