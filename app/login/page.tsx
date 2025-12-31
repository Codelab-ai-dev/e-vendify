"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react"
import { supabase, isAdmin } from "@/lib/supabase"
import { toast } from "sonner"
import { useTheme } from "next-themes"

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const { theme } = useTheme()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!email.trim() || !password.trim()) {
        toast.error("Por favor completa todos los campos")
        return
      }

      if (password.length < 6) {
        toast.error("La contraseña debe tener al menos 6 caracteres")
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error("Credenciales incorrectas. Verifica tu email y contraseña.")
        } else if (error.message.includes('Email not confirmed')) {
          toast.error("Problema con verificación de email. Contacta al administrador si persiste.")
        } else {
          toast.error(`Error de autenticación: ${error.message}`)
        }
        return
      }

      if (data.user) {
        const { isAdmin: userIsAdmin } = await isAdmin(data.user.id)

        if (userIsAdmin) {
          toast.success("¡Bienvenido, administrador!")
          router.push("/admin/dashboard")
        } else {
          toast.success("¡Bienvenido de vuelta!")
          router.push("/dashboard")
        }
      }
    } catch (error) {
      console.error("Error inesperado durante el login:", error)
      toast.error("Error inesperado durante el login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-background/60 hover:text-background transition-colors mb-12 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Volver al inicio</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="heading-xl text-5xl xl:text-6xl mb-6">
              Bienvenido
              <br />
              <span className="text-primary">de vuelta.</span>
            </h1>
            <p className="text-background/60 text-lg max-w-md">
              Accede a tu panel de control y gestiona tu negocio desde cualquier lugar.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-6">
            <div className="flex -space-x-2">
              {["bg-primary", "bg-white/20", "bg-white/10"].map((color, i) => (
                <div key={i} className={`w-10 h-10 rounded-full ${color} border-2 border-foreground`} />
              ))}
            </div>
            <p className="text-sm text-background/60">
              <span className="text-background font-medium">+500</span> emprendedores activos
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Mobile back link */}
          <Link href="/" className="lg:hidden inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Volver</span>
          </Link>

          {/* Logo for mobile */}
          <div className="lg:hidden mb-8">
            <Link href="/">
              <Image
                src={theme === 'dark' ? '/e-logo-oscuro.png' : '/logo-ev-claro.png'}
                alt="e-vendify"
                width={160}
                height={45}
                className={theme === 'dark' ? 'h-10 w-auto' : 'h-8 w-auto'}
              />
            </Link>
          </div>

          <div className="mb-10">
            <span className="label-mono mb-4 block">Iniciar sesion</span>
            <h2 className="heading-lg text-3xl sm:text-4xl">
              Ingresa a tu cuenta
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium block">
                Correo electronico
              </label>
              <div className={`relative border-2 transition-colors ${focusedField === 'email' ? 'border-primary' : 'border-border'}`}>
                <input
                  id="email"
                  type="email"
                  placeholder="tu@negocio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="w-full px-4 py-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium block">
                Contraseña
              </label>
              <div className={`relative border-2 transition-colors ${focusedField === 'password' ? 'border-primary' : 'border-border'}`}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="w-full px-4 py-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Forgot password link */}
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-brutal w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ingresando...
                </span>
              ) : (
                "Ingresar"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">o</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Register link */}
          <p className="text-center text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-foreground font-medium hover:text-primary transition-colors">
              Registrate aqui
            </Link>
          </p>

          {/* Footer */}
          <p className="mt-12 text-center text-xs text-muted-foreground">
            Al ingresar, aceptas nuestros{" "}
            <Link href="#" className="hover:text-foreground transition-colors">Terminos</Link>
            {" "}y{" "}
            <Link href="#" className="hover:text-foreground transition-colors">Privacidad</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
