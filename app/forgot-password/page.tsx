"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Loader2, ArrowLeft, Mail, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useTheme } from "next-themes"

export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  const { theme } = useTheme()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!email.trim()) {
        toast.error("Por favor ingresa tu correo electrónico")
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        if (error.message.includes('rate limit')) {
          toast.error("Demasiados intentos. Espera unos minutos antes de intentar de nuevo.")
        } else {
          toast.error(`Error: ${error.message}`)
        }
        return
      }

      setEmailSent(true)
      toast.success("¡Correo enviado! Revisa tu bandeja de entrada.")
    } catch (error) {
      console.error("Error al enviar correo de recuperación:", error)
      toast.error("Error al enviar el correo de recuperación")
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
          <Link href="/login" className="inline-flex items-center gap-2 text-background/60 hover:text-background transition-colors mb-12 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Volver al login</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="heading-xl text-5xl xl:text-6xl mb-6">
              Recupera tu
              <br />
              <span className="text-primary">acceso.</span>
            </h1>
            <p className="text-background/60 text-lg max-w-md">
              No te preocupes, te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative z-10"
        >
          <div className="p-6 border-2 border-background/20 bg-background/5">
            <p className="text-sm text-background/80">
              <span className="text-primary font-bold">Tip:</span> Revisa tu carpeta de spam si no encuentras el correo.
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
          <Link href="/login" className="lg:hidden inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group">
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

          {emailSent ? (
            // Success state
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 border-2 border-primary flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>

              <h2 className="heading-lg text-2xl sm:text-3xl mb-4">
                ¡Correo enviado!
              </h2>

              <p className="text-muted-foreground mb-2">
                Hemos enviado un enlace de recuperación a:
              </p>

              <p className="font-mono text-sm bg-muted px-4 py-2 border-2 border-border mb-8">
                {email}
              </p>

              <p className="text-sm text-muted-foreground mb-8">
                El enlace expira en 1 hora. Si no recibes el correo, revisa tu carpeta de spam.
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => setEmailSent(false)}
                  className="w-full py-4 border-2 border-border hover:border-foreground transition-colors font-medium"
                >
                  Enviar de nuevo
                </button>

                <Link href="/login" className="block w-full">
                  <button className="btn-brutal w-full py-4">
                    Volver al login
                  </button>
                </Link>
              </div>
            </motion.div>
          ) : (
            // Form state
            <>
              <div className="mb-10">
                <span className="label-mono mb-4 block">Recuperar cuenta</span>
                <h2 className="heading-lg text-3xl sm:text-4xl">
                  ¿Olvidaste tu contraseña?
                </h2>
                <p className="text-muted-foreground mt-4">
                  Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium block">
                    Correo electrónico
                  </label>
                  <div className={`relative border-2 transition-colors ${focusedField === 'email' ? 'border-primary' : 'border-border'}`}>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      placeholder="tu@negocio.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                  </div>
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
                      Enviando...
                    </span>
                  ) : (
                    "Enviar enlace de recuperación"
                  )}
                </button>
              </form>

              {/* Back to login */}
              <p className="mt-8 text-center text-muted-foreground">
                ¿Recordaste tu contraseña?{" "}
                <Link href="/login" className="text-foreground font-medium hover:text-primary transition-colors">
                  Inicia sesión
                </Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
