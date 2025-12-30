"use client"

import { AlertCircle, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

interface RateLimitErrorProps {
  retryAfter?: number // Segundos hasta poder reintentar
  limit?: number
  reset?: string // ISO timestamp
  onRetry?: () => void
}

export function RateLimitError({
  retryAfter = 60,
  limit,
  reset,
  onRetry
}: RateLimitErrorProps) {
  const [countdown, setCountdown] = useState(retryAfter)
  const [canRetry, setCanRetry] = useState(false)

  useEffect(() => {
    if (countdown <= 0) {
      setCanRetry(true)
      return
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanRetry(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} segundo${seconds !== 1 ? 's' : ''}`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (remainingSeconds === 0) {
      return `${minutes} minuto${minutes !== 1 ? 's' : ''}`
    }
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Límite de Solicitudes Excedido</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Has realizado demasiadas solicitudes en un período corto de tiempo.
          Por favor, espera antes de continuar.
        </p>

        {limit && (
          <p className="text-sm">
            <strong>Límite:</strong> {limit} solicitudes
          </p>
        )}

        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          {canRetry ? (
            <span className="text-green-600 dark:text-green-400 font-medium">
              Ya puedes reintentar
            </span>
          ) : (
            <span>
              Podrás reintentar en <strong>{formatTime(countdown)}</strong>
            </span>
          )}
        </div>

        {reset && (
          <p className="text-xs text-muted-foreground">
            Reinicio completo: {new Date(reset).toLocaleTimeString('es-ES')}
          </p>
        )}

        {onRetry && (
          <Button
            onClick={onRetry}
            disabled={!canRetry}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            {canRetry ? 'Reintentar Ahora' : `Espera ${countdown}s`}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

/**
 * Hook para manejar errores de rate limit en fetch
 */
export function useRateLimitHandler() {
  const [rateLimitError, setRateLimitError] = useState<{
    retryAfter?: number
    limit?: number
    reset?: string
  } | null>(null)

  const handleResponse = async (response: Response) => {
    if (response.status === 429) {
      const data = await response.json()
      setRateLimitError({
        retryAfter: data.retryAfter || 60,
        limit: data.limit,
        reset: data.reset
      })
      return null
    }

    // Limpiar error si la respuesta es exitosa
    setRateLimitError(null)
    return response
  }

  const clearError = () => setRateLimitError(null)

  return {
    rateLimitError,
    handleResponse,
    clearError
  }
}
