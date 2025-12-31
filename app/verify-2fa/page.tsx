"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Shield, Loader2, ArrowLeft, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useMFA } from "@/hooks/useMFA"
import { toast } from "sonner"
import { useTheme } from "next-themes"

export const dynamic = 'force-dynamic'

function Verify2FAContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme } = useTheme()
  const { verifyLogin, getAuthenticatorAssuranceLevel } = useMFA()

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  useEffect(() => {
    // Verificar si hay un factor MFA pendiente
    const checkMFARequired = async () => {
      try {
        const { data: aalData } = await getAuthenticatorAssuranceLevel()

        if (!aalData) {
          router.push('/login')
          return
        }

        // Si ya completó 2FA, redirigir
        if (aalData.currentLevel === 'aal2') {
          router.push(redirectTo)
          return
        }

        // Si necesita 2FA pero no tiene el nivel requerido
        if (aalData.nextLevel === 'aal2' && aalData.currentLevel === 'aal1') {
          // Obtener factores disponibles
          const { data: factorsData } = await supabase.auth.mfa.listFactors()

          if (factorsData && factorsData.totp.length > 0) {
            const verifiedFactor = factorsData.totp.find(f => f.status === 'verified')
            if (verifiedFactor) {
              setFactorId(verifiedFactor.id)
            } else {
              // No hay factores verificados, redirigir a login
              router.push('/login')
            }
          } else {
            // No hay factores, redirigir a login
            router.push('/login')
          }
        } else if (aalData.currentLevel !== 'aal1') {
          // No está autenticado, redirigir a login
          router.push('/login')
        }
      } catch (error) {
        console.error('Error checking MFA:', error)
        router.push('/login')
      }
    }

    checkMFARequired()
  }, [router, redirectTo, getAuthenticatorAssuranceLevel])

  const handleInputChange = (index: number, value: string) => {
    // Solo permitir números
    const numValue = value.replace(/\D/g, '')

    if (numValue.length <= 1) {
      const newCode = [...code]
      newCode[index] = numValue
      setCode(newCode)
      setError(null)

      // Auto-focus siguiente input
      if (numValue && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }

      // Auto-submit cuando se completa
      if (numValue && index === 5) {
        const fullCode = newCode.join('')
        if (fullCode.length === 6) {
          handleVerify(fullCode)
        }
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)

    if (pastedData.length === 6) {
      const newCode = pastedData.split('')
      setCode(newCode)
      setError(null)
      handleVerify(pastedData)
    }
  }

  const handleVerify = async (fullCode?: string) => {
    const codeToVerify = fullCode || code.join('')

    if (codeToVerify.length !== 6) {
      setError('Ingresa el código completo de 6 dígitos')
      return
    }

    if (!factorId) {
      setError('Error de configuración. Intenta iniciar sesión de nuevo.')
      return
    }

    setLoading(true)
    setError(null)

    const result = await verifyLogin(factorId, codeToVerify)

    if (result.success) {
      toast.success('Verificación exitosa')
      router.push(redirectTo)
    } else {
      setError(result.error || 'Código incorrecto')
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    }

    setLoading(false)
  }

  const handleResend = () => {
    // Los códigos TOTP se generan en la app, no se pueden reenviar
    toast.info('Abre tu app de autenticación para ver el código actual')
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back Link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Volver al login</span>
        </Link>

        {/* Card */}
        <div className="border-2 border-border">
          {/* Header */}
          <div className="p-8 text-center border-b-2 border-border bg-primary/5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-primary mx-auto mb-4 flex items-center justify-center"
            >
              <Shield className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
              Verificación 2FA
            </h1>
            <p className="font-mono text-sm text-muted-foreground mt-2">
              Ingresa el código de tu app de autenticación
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Code Inputs */}
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={loading}
                  className={`w-12 h-14 text-center text-xl font-mono font-bold border-2 bg-transparent focus:outline-none transition-colors ${
                    error
                      ? 'border-red-500 text-red-500'
                      : digit
                      ? 'border-primary text-foreground'
                      : 'border-border text-foreground focus:border-primary'
                  } disabled:opacity-50`}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center font-mono text-sm text-red-500"
              >
                {error}
              </motion.p>
            )}

            {/* Verify Button */}
            <button
              onClick={() => handleVerify()}
              disabled={loading || code.join('').length !== 6}
              className="w-full py-4 bg-primary text-primary-foreground font-mono font-bold text-sm uppercase tracking-wider border-2 border-black hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Verificar'
              )}
            </button>

            {/* Help Text */}
            <div className="text-center space-y-2">
              <p className="font-mono text-xs text-muted-foreground">
                El código cambia cada 30 segundos
              </p>
              <button
                onClick={handleResend}
                className="font-mono text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                ¿No ves el código?
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-muted/50">
            <p className="font-mono text-xs text-center text-muted-foreground">
              Usa Google Authenticator, Authy u otra app compatible
            </p>
          </div>
        </div>

        {/* Logo */}
        <div className="mt-8 flex justify-center">
          <Link href="/">
            <Image
              src={theme === 'dark' ? '/e-logo-oscuro.png' : '/logo-ev-claro.png'}
              alt="e-vendify"
              width={120}
              height={35}
              className={theme === 'dark' ? 'h-8 w-auto opacity-50' : 'h-6 w-auto opacity-50'}
            />
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

function Verify2FALoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="font-mono text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  )
}

export default function Verify2FAPage() {
  return (
    <Suspense fallback={<Verify2FALoading />}>
      <Verify2FAContent />
    </Suspense>
  )
}
