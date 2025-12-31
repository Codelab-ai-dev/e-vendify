"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, ArrowLeft, Eye, EyeOff, CheckCircle, Lock, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useTheme } from "next-themes"

export const dynamic = 'force-dynamic'

export default function ResetPasswordPage() {
  const { theme } = useTheme()
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Verificar que el usuario llegó desde el email de recuperación
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      // Si hay sesión, el usuario llegó correctamente desde el email
      if (session) {
        setIsValidSession(true)
      } else {
        // Verificar si hay un hash con tokens en la URL (Supabase los pone ahí)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const type = hashParams.get('type')

        if (accessToken && type === 'recovery') {
          // Establecer la sesión con el token de recuperación
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          })

          if (!error) {
            setIsValidSession(true)
            // Limpiar la URL
            window.history.replaceState({}, document.title, window.location.pathname)
          } else {
            setIsValidSession(false)
          }
        } else {
          setIsValidSession(false)
        }
      }
    }

    checkSession()
  }, [])

  const validatePassword = (pass: string): string[] => {
    const errors: string[] = []
    if (pass.length < 8) errors.push("Mínimo 8 caracteres")
    if (!/[A-Z]/.test(pass)) errors.push("Una mayúscula")
    if (!/[a-z]/.test(pass)) errors.push("Una minúscula")
    if (!/[0-9]/.test(pass)) errors.push("Un número")
    return errors
  }

  const passwordErrors = validatePassword(password)
  const isPasswordValid = passwordErrors.length === 0
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!isPasswordValid) {
        toast.error("La contraseña no cumple con los requisitos")
        return
      }

      if (!passwordsMatch) {
        toast.error("Las contraseñas no coinciden")
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        if (error.message.includes('same as the old password')) {
          toast.error("La nueva contraseña debe ser diferente a la anterior")
        } else {
          toast.error(`Error: ${error.message}`)
        }
        return
      }

      setIsSuccess(true)
      toast.success("¡Contraseña actualizada exitosamente!")

      // Cerrar sesión para que inicien con la nueva contraseña
      await supabase.auth.signOut()

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error) {
      console.error("Error al actualizar contraseña:", error)
      toast.error("Error al actualizar la contraseña")
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state mientras verificamos la sesión
  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    )
  }

  // Error state - enlace inválido o expirado
  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-destructive/10 border-2 border-destructive flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>

          <h1 className="heading-lg text-2xl sm:text-3xl mb-4">
            Enlace inválido o expirado
          </h1>

          <p className="text-muted-foreground mb-8">
            Este enlace de recuperación ya no es válido. Los enlaces expiran después de 1 hora por seguridad.
          </p>

          <div className="space-y-4">
            <Link href="/forgot-password" className="block w-full">
              <button className="btn-brutal w-full py-4">
                Solicitar nuevo enlace
              </button>
            </Link>

            <Link href="/login" className="block w-full">
              <button className="w-full py-4 border-2 border-border hover:border-foreground transition-colors font-medium">
                Volver al login
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    )
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
              Nueva
              <br />
              <span className="text-primary">contraseña.</span>
            </h1>
            <p className="text-background/60 text-lg max-w-md">
              Crea una contraseña segura para proteger tu cuenta.
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
            <p className="text-sm text-background/60 mb-2">Requisitos de seguridad:</p>
            <ul className="text-sm text-background/80 space-y-1">
              <li>• Mínimo 8 caracteres</li>
              <li>• Al menos una mayúscula</li>
              <li>• Al menos una minúscula</li>
              <li>• Al menos un número</li>
            </ul>
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

          {isSuccess ? (
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
                ¡Contraseña actualizada!
              </h2>

              <p className="text-muted-foreground mb-8">
                Tu contraseña ha sido cambiada exitosamente. Serás redirigido al login en unos segundos...
              </p>

              <Link href="/login" className="block w-full">
                <button className="btn-brutal w-full py-4">
                  Ir al login ahora
                </button>
              </Link>
            </motion.div>
          ) : (
            // Form state
            <>
              <div className="mb-10">
                <span className="label-mono mb-4 block">Restablecer</span>
                <h2 className="heading-lg text-3xl sm:text-4xl">
                  Crea tu nueva contraseña
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* New Password field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium block">
                    Nueva contraseña
                  </label>
                  <div className={`relative border-2 transition-colors ${focusedField === 'password' ? 'border-primary' : 'border-border'}`}>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Tu nueva contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="w-full pl-12 pr-12 py-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Password requirements */}
                  {password.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {["Mínimo 8 caracteres", "Una mayúscula", "Una minúscula", "Un número"].map((req, i) => {
                        const checks = [
                          password.length >= 8,
                          /[A-Z]/.test(password),
                          /[a-z]/.test(password),
                          /[0-9]/.test(password),
                        ]
                        const isValid = checks[i]
                        return (
                          <span
                            key={req}
                            className={`text-xs px-2 py-1 border transition-colors ${
                              isValid
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground'
                            }`}
                          >
                            {isValid ? '✓' : '○'} {req}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Confirm Password field */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium block">
                    Confirmar contraseña
                  </label>
                  <div className={`relative border-2 transition-colors ${
                    focusedField === 'confirmPassword'
                      ? 'border-primary'
                      : confirmPassword.length > 0
                        ? passwordsMatch
                          ? 'border-primary'
                          : 'border-destructive'
                        : 'border-border'
                  }`}>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirma tu contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="w-full pl-12 pr-12 py-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="text-xs text-destructive mt-1">
                      Las contraseñas no coinciden
                    </p>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading || !isPasswordValid || !passwordsMatch}
                  className="btn-brutal w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Actualizando...
                    </span>
                  ) : (
                    "Actualizar contraseña"
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
