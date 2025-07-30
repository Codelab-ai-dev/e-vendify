import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Poppins, Inter } from 'next/font/google'
import { Toaster } from 'sonner'
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
  title: 'MiKiosko Digital',
  description: 'Plataforma digital para emprendedores y pequeños negocios',
  generator: 'MiKiosko Digital',
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
        {children}
        <Toaster 
          position="top-right" 
          richColors 
          closeButton
          duration={4000}
        />
      </body>
    </html>
  )
}
