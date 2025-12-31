"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Key,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  X
} from "lucide-react"
import { useMFA } from "@/hooks/useMFA"
import { toast } from "sonner"

interface TwoFactorSetupProps {
  onComplete?: () => void
}

export function TwoFactorSetup({ onComplete }: TwoFactorSetupProps) {
  const {
    status,
    enrollmentData,
    enroll,
    verifyEnrollment,
    disable,
    cancelEnrollment
  } = useMFA()

  const [step, setStep] = useState<'idle' | 'setup' | 'verify' | 'disable'>('idle')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)

  const handleStartSetup = async () => {
    setLoading(true)
    const result = await enroll()
    setLoading(false)

    if (result.success) {
      setStep('setup')
    } else {
      toast.error(result.error || 'Error al iniciar configuración')
    }
  }

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast.error('El código debe tener 6 dígitos')
      return
    }

    setLoading(true)
    const result = await verifyEnrollment(verificationCode)
    setLoading(false)

    if (result.success) {
      toast.success('Autenticación de dos factores activada')
      setStep('idle')
      setVerificationCode('')
      onComplete?.()
    } else {
      toast.error(result.error || 'Error al verificar código')
    }
  }

  const handleDisable = async () => {
    if (status.factors.length === 0) return

    setLoading(true)
    const result = await disable(status.factors[0].id)
    setLoading(false)

    if (result.success) {
      toast.success('Autenticación de dos factores desactivada')
      setStep('idle')
    } else {
      toast.error(result.error || 'Error al desactivar 2FA')
    }
  }

  const handleCancel = async () => {
    await cancelEnrollment()
    setStep('idle')
    setVerificationCode('')
  }

  const copySecret = () => {
    if (enrollmentData?.secret) {
      navigator.clipboard.writeText(enrollmentData.secret)
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
      toast.success('Código secreto copiado')
    }
  }

  if (status.loading) {
    return (
      <div className="p-6 border-2 border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#BFFF00]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 flex items-center justify-center ${
            status.isEnabled
              ? 'bg-green-500'
              : 'bg-neutral-100 dark:bg-neutral-900'
          }`}>
            {status.isEnabled ? (
              <ShieldCheck className="w-6 h-6 text-white" />
            ) : (
              <Shield className="w-6 h-6 text-neutral-400" />
            )}
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-black dark:text-white uppercase tracking-tight">
              Autenticación de Dos Factores
            </h3>
            <p className="font-mono text-sm text-neutral-500">
              {status.isEnabled
                ? 'Tu cuenta está protegida con 2FA'
                : 'Agrega una capa extra de seguridad'}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-3 py-1 font-mono text-xs uppercase ${
          status.isEnabled
            ? 'bg-green-500 text-white'
            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
        }`}>
          {status.isEnabled ? 'Activo' : 'Inactivo'}
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {step === 'idle' && !status.isEnabled && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 border-2 border-neutral-200 dark:border-neutral-800"
          >
            <div className="flex items-start gap-4 mb-6">
              <Smartphone className="w-8 h-8 text-[#BFFF00] flex-shrink-0" />
              <div>
                <h4 className="font-mono font-bold text-black dark:text-white mb-1">
                  Usa una app de autenticación
                </h4>
                <p className="font-mono text-sm text-neutral-500">
                  Necesitarás una app como Google Authenticator, Authy, o Microsoft Authenticator
                  para generar códigos de verificación.
                </p>
              </div>
            </div>

            <button
              onClick={handleStartSetup}
              disabled={loading}
              className="w-full py-4 bg-[#BFFF00] text-black font-mono font-bold text-sm uppercase tracking-wider border-2 border-black hover:bg-[#a8e600] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              Configurar 2FA
            </button>
          </motion.div>
        )}

        {step === 'idle' && status.isEnabled && (
          <motion.div
            key="enabled"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 border-2 border-green-500 bg-green-50 dark:bg-green-950/30"
          >
            <div className="flex items-start gap-4 mb-6">
              <ShieldCheck className="w-8 h-8 text-green-500 flex-shrink-0" />
              <div>
                <h4 className="font-mono font-bold text-green-800 dark:text-green-200 mb-1">
                  2FA está activo
                </h4>
                <p className="font-mono text-sm text-green-700 dark:text-green-300">
                  Tu cuenta requiere un código de verificación adicional al iniciar sesión.
                </p>
              </div>
            </div>

            <button
              onClick={() => setStep('disable')}
              className="w-full py-4 bg-transparent text-red-600 font-mono font-bold text-sm uppercase tracking-wider border-2 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors flex items-center justify-center gap-2"
            >
              <ShieldOff className="w-4 h-4" />
              Desactivar 2FA
            </button>
          </motion.div>
        )}

        {step === 'setup' && enrollmentData && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 border-2 border-[#BFFF00]"
          >
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-mono font-bold text-black dark:text-white uppercase">
                Paso 1: Escanea el código QR
              </h4>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center mb-6">
              <div className="p-4 bg-white border-2 border-neutral-200 mb-4">
                <img
                  src={enrollmentData.qrCode}
                  alt="QR Code para 2FA"
                  className="w-48 h-48"
                />
              </div>
              <p className="font-mono text-xs text-neutral-500 text-center">
                Escanea este código con tu app de autenticación
              </p>
            </div>

            {/* Secret Key */}
            <div className="mb-6">
              <p className="font-mono text-xs text-neutral-500 uppercase mb-2">
                O ingresa este código manualmente:
              </p>
              <div className="flex items-center gap-2 p-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <Key className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <code className="font-mono text-sm text-black dark:text-white flex-1 break-all">
                  {enrollmentData.secret}
                </code>
                <button
                  onClick={copySecret}
                  className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                >
                  {copiedSecret ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-neutral-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep('verify')}
              className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-mono font-bold text-sm uppercase tracking-wider border-2 border-black dark:border-white hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              Continuar
            </button>
          </motion.div>
        )}

        {step === 'verify' && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 border-2 border-[#BFFF00]"
          >
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-mono font-bold text-black dark:text-white uppercase">
                Paso 2: Verifica el código
              </h4>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="font-mono text-sm text-neutral-500 mb-6">
              Ingresa el código de 6 dígitos que muestra tu app de autenticación.
            </p>

            {/* Code Input */}
            <div className="mb-6">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-4 text-center text-2xl font-mono font-bold tracking-[0.5em] bg-transparent border-2 border-neutral-200 dark:border-neutral-800 focus:border-[#BFFF00] text-black dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-700 focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('setup')}
                className="flex-1 py-4 bg-transparent text-black dark:text-white font-mono font-bold text-sm uppercase tracking-wider border-2 border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={handleVerify}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1 py-4 bg-[#BFFF00] text-black font-mono font-bold text-sm uppercase tracking-wider border-2 border-black hover:bg-[#a8e600] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Verificar
              </button>
            </div>
          </motion.div>
        )}

        {step === 'disable' && (
          <motion.div
            key="disable"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 border-2 border-red-500 bg-red-50 dark:bg-red-950/30"
          >
            <div className="flex items-start gap-4 mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0" />
              <div>
                <h4 className="font-mono font-bold text-red-800 dark:text-red-200 mb-1">
                  ¿Desactivar 2FA?
                </h4>
                <p className="font-mono text-sm text-red-700 dark:text-red-300">
                  Tu cuenta será menos segura sin la autenticación de dos factores.
                  Solo desactívalo si es absolutamente necesario.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('idle')}
                className="flex-1 py-4 bg-transparent text-black dark:text-white font-mono font-bold text-sm uppercase tracking-wider border-2 border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDisable}
                disabled={loading}
                className="flex-1 py-4 bg-red-500 text-white font-mono font-bold text-sm uppercase tracking-wider border-2 border-red-600 hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldOff className="w-4 h-4" />
                )}
                Desactivar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
