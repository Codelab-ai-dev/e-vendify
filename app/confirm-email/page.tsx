"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Mail, Check, AlertTriangle, ArrowLeft, Send } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useTheme } from "next-themes"

export const dynamic = 'force-dynamic'

export default function ConfirmEmailPage() {
  const { theme } = useTheme()
  const [email, setEmail] = useState<string>("")
  const [isResending, setIsResending] = useState(false)
  const [resendCount, setResendCount] = useState(0)

  useEffect(() => {
    const savedEmail = localStorage.getItem("pendingConfirmationEmail")
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error("No se encontro el email para reenviar la confirmacion")
      return
    }

    setIsResending(true)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) {
        toast.error("Error al reenviar confirmacion: " + error.message)
      } else {
        toast.success("Email de confirmacion reenviado")
        setResendCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error al reenviar confirmacion:', error)
      toast.error("Error inesperado al reenviar confirmacion")
    } finally {
      setIsResending(false)
    }
  }

  const steps = [
    {
      number: 1,
      title: "Revisa tu bandeja",
      description: "Busca un email de e-vendify con el asunto \"Confirma tu cuenta\""
    },
    {
      number: 2,
      title: "Haz clic en el enlace",
      description: "Presiona el boton \"Confirmar email\" en el mensaje"
    },
    {
      number: 3,
      title: "Listo",
      description: "Seras redirigido automaticamente a tu dashboard"
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background p-12 flex-col justify-between relative overflow-hidden">
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
              Un paso
              <br />
              <span className="text-primary">mas.</span>
            </h1>
            <p className="text-background/60 text-lg max-w-md">
              Confirma tu email para activar tu cuenta y comenzar a vender.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary-foreground" />
            </div>
            <p className="text-sm text-background/60">
              <span className="text-background font-medium">Verificacion segura</span>
              <br />
              Protegemos tu cuenta
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right side - Content */}
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

          {/* Icon */}
          <div className="w-20 h-20 border-2 border-primary bg-primary/10 flex items-center justify-center mb-8">
            <Mail className="w-10 h-10 text-primary" />
          </div>

          {/* Title */}
          <div className="mb-8">
            <span className="label-mono mb-2 block">Verificacion</span>
            <h2 className="heading-lg text-3xl sm:text-4xl mb-2">
              Confirma tu email
            </h2>
            <p className="text-muted-foreground">
              Te enviamos un email de confirmacion para activar tu cuenta
            </p>
          </div>

          {/* Email info */}
          {email && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="border-2 border-primary p-4 mb-8"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email enviado a:</p>
                  <p className="font-mono text-sm text-muted-foreground">{email}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Steps */}
          <div className="space-y-4 mb-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 border-2 border-border flex items-center justify-center font-mono font-bold flex-shrink-0">
                  {step.number}
                </div>
                <div>
                  <h4 className="font-display font-bold">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Spam notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="border-2 border-border p-4 mb-8 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">No ves el email?</p>
              <p className="text-sm text-muted-foreground">
                Revisa tu carpeta de spam o correo no deseado
              </p>
            </div>
          </motion.div>

          {/* Resend button */}
          <button
            onClick={handleResendConfirmation}
            disabled={isResending || !email}
            className="btn-brutal-outline w-full py-4 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {isResending ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin" />
                Reenviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Reenviar email de confirmacion
              </>
            )}
          </button>

          {resendCount > 0 && (
            <p className="text-center text-sm text-muted-foreground mb-6 font-mono">
              Reenviado {resendCount} {resendCount === 1 ? 'vez' : 'veces'}
            </p>
          )}

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">o</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Login link */}
          <p className="text-center text-muted-foreground">
            Ya confirmaste tu email?{" "}
            <Link href="/login" className="text-foreground font-medium hover:text-primary transition-colors">
              Iniciar sesion
            </Link>
          </p>

          {/* Footer */}
          <p className="mt-12 text-center text-xs text-muted-foreground">
            Si tienes problemas, contactanos en{" "}
            <Link href="/contact" className="hover:text-foreground transition-colors">
              soporte
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
