"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Mail, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export const dynamic = 'force-dynamic'

export default function ConfirmEmailPage() {
  const [email, setEmail] = useState<string>("")
  const [isResending, setIsResending] = useState(false)
  const [resendCount, setResendCount] = useState(0)

  useEffect(() => {
    // Obtener el email del localStorage si está disponible
    const savedEmail = localStorage.getItem("pendingConfirmationEmail")
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error("No se encontró el email para reenviar la confirmación")
      return
    }

    setIsResending(true)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) {
        toast.error("Error al reenviar confirmación: " + error.message)
      } else {
        toast.success("Email de confirmación reenviado exitosamente")
        setResendCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error al reenviar confirmación:', error)
      toast.error("Error inesperado al reenviar confirmación")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Mail className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Confirma tu email
          </CardTitle>
          <CardDescription>
            Te hemos enviado un email de confirmación para activar tu cuenta
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email info */}
          {email && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Email enviado a:
                  </p>
                  <p className="text-sm text-blue-700">{email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-green-100 p-2 rounded-full mr-3 mt-1">
                <span className="text-green-600 font-bold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Revisa tu bandeja de entrada</h4>
                <p className="text-sm text-gray-600">
                  Busca un email de MiKiosko con el asunto "Confirma tu cuenta"
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-green-100 p-2 rounded-full mr-3 mt-1">
                <span className="text-green-600 font-bold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Haz clic en el enlace</h4>
                <p className="text-sm text-gray-600">
                  Haz clic en el botón "Confirmar email" en el mensaje
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-green-100 p-2 rounded-full mr-3 mt-1">
                <span className="text-green-600 font-bold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">¡Listo!</h4>
                <p className="text-sm text-gray-600">
                  Serás redirigido automáticamente a tu dashboard
                </p>
              </div>
            </div>
          </div>

          {/* Spam notice */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  ¿No ves el email?
                </p>
                <p className="text-sm text-yellow-700">
                  Revisa tu carpeta de spam o correo no deseado
                </p>
              </div>
            </div>
          </div>

          {/* Resend button */}
          <div className="text-center">
            <Button
              variant="outline"
              onClick={handleResendConfirmation}
              disabled={isResending || !email}
              className="w-full"
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Reenviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Reenviar email de confirmación
                </>
              )}
            </Button>

            {resendCount > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Email reenviado {resendCount} {resendCount === 1 ? 'vez' : 'veces'}
              </p>
            )}
          </div>

          {/* Back to login */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600">
              ¿Ya confirmaste tu email?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
