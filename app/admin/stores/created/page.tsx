"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  CheckCircle,
  Store,
  Mail,
  Loader2,
  Copy,
  ExternalLink,
  ArrowLeft,
  Shield,
  Key,
  User,
  Eye,
  EyeOff,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { isAdmin } from "@/lib/supabase"
import { useTheme } from "next-themes"
import { toast } from "sonner"

function StoreCreatedContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [adminLoading, setAdminLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const searchParams = useSearchParams()

  const storeData = {
    id: searchParams?.get("id") || "",
    name: searchParams?.get("name") || "Nueva Tienda",
    email: searchParams?.get("email") || "email@ejemplo.com",
    password: searchParams?.get("password") || "",
  }

  useEffect(() => {
    const checkAuth = async () => {
      if (!authLoading && !user) {
        router.push('/')
        return
      }

      if (user) {
        try {
          const { isAdmin: userIsAdmin, error } = await isAdmin(user.id)
          if (error || !userIsAdmin) {
            router.push('/')
            return
          }
          setIsAdminUser(true)
        } catch (error) {
          router.push('/')
        } finally {
          setAdminLoading(false)
        }
      }
    }

    checkAuth()
  }, [user, authLoading, router])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado`)
  }

  const copyAllCredentials = () => {
    const text = `Tienda: ${storeData.name}\nEmail: ${storeData.email}\nContrasena: ${storeData.password}\nURL: ${window.location.origin}/store/${storeData.id}`
    navigator.clipboard.writeText(text)
    toast.success('Todas las credenciales copiadas')
  }

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground font-mono text-sm">Verificando...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdminUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b-2 border-border sticky top-0 z-50 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline font-mono text-sm">Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="font-display font-bold text-lg">Tienda Creada</span>
              </div>
            </div>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-10 h-10 border-2 border-border flex items-center justify-center hover:border-foreground transition-colors"
            >
              {theme === 'dark' ? '○' : '●'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-green-500 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl mb-3">
            ¡Tienda creada exitosamente!
          </h1>
          <p className="text-muted-foreground">
            La tienda <span className="font-bold text-foreground">{storeData.name}</span> esta lista
          </p>
        </motion.div>

        {/* Credenciales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="border-2 border-border mb-6"
        >
          <div className="border-b-2 border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold text-lg">Credenciales de Acceso</h2>
            </div>
            <button
              onClick={copyAllCredentials}
              className="px-3 py-1.5 border-2 border-border hover:border-foreground transition-colors font-mono text-xs inline-flex items-center gap-2"
            >
              <Copy className="w-3 h-3" />
              Copiar todo
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Email */}
            <div className="flex items-center justify-between p-4 bg-muted/50 border border-border">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground font-mono uppercase">Email</p>
                  <p className="font-mono font-bold">{storeData.email}</p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(storeData.email, 'Email')}
                className="p-2 hover:bg-muted transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            {/* Password */}
            <div className="flex items-center justify-between p-4 bg-muted/50 border border-border">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground font-mono uppercase">Contrasena</p>
                  <p className="font-mono font-bold">
                    {showPassword ? storeData.password : '••••••••••••'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 hover:bg-muted transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => copyToClipboard(storeData.password, 'Contrasena')}
                  className="p-2 hover:bg-muted transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* URL */}
            <div className="flex items-center justify-between p-4 bg-muted/50 border border-border">
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground font-mono uppercase">URL de la tienda</p>
                  <p className="font-mono text-sm">/store/{storeData.id.slice(0, 8)}...</p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(`${window.location.origin}/store/${storeData.id}`, 'URL')}
                className="p-2 hover:bg-muted transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border-2 border-primary/30 bg-primary/5 p-6 mb-8"
        >
          <h3 className="font-mono font-bold text-sm uppercase mb-3">Importante:</h3>
          <ul className="text-sm text-muted-foreground space-y-2 font-mono">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              Guarda estas credenciales de forma segura
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              El propietario puede cambiar la contrasena al iniciar sesion
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              La tienda ya esta activa y accesible
            </li>
          </ul>
        </motion.div>

        {/* Botones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link
            href="/admin/dashboard"
            className="flex-1 px-6 py-4 border-2 border-border hover:border-foreground transition-colors font-mono text-center"
          >
            Volver al Dashboard
          </Link>
          <Link
            href={`/admin/stores/${storeData.id}`}
            className="flex-1 px-6 py-4 border-2 border-border hover:border-foreground transition-colors font-mono text-center inline-flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            Ver detalles
          </Link>
          <Link
            href={`/store/${storeData.id}`}
            target="_blank"
            className="flex-1 btn-brutal px-6 py-4 inline-flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Ver tienda publica
          </Link>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <Link href="/">
              <Image
                src={theme === 'dark' ? '/e-logo-oscuro.png' : '/logo-ev-claro.png'}
                alt="e-vendify"
                width={120}
                height={35}
                className={theme === 'dark' ? 'h-8 w-auto opacity-60 hover:opacity-100 transition-opacity' : 'h-6 w-auto opacity-60 hover:opacity-100 transition-opacity'}
              />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500" />
              <span className="font-mono text-xs">Tienda creada</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function StoreCreatedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <StoreCreatedContent />
    </Suspense>
  )
}
