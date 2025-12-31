"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Link from "next/link"

export const dynamic = 'force-dynamic'

function AuthCallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Verificar si hay tokens en el hash (autenticación exitosa)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const hashType = hashParams.get('type')

        if (accessToken && refreshToken) {
          console.log('Tokens encontrados en el hash, estableciendo sesión...', { type: hashType })

          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) {
            console.error('Error al establecer sesión:', error)
            setStatus('error')
            setMessage('Error al establecer la sesión: ' + error.message)
            toast.error('Error al establecer la sesión')
            return
          }

          // Si es recuperación de contraseña, redirigir a reset-password
          if (hashType === 'recovery' && data.session) {
            console.log('Tipo recovery detectado, redirigiendo a reset-password...')
            setStatus('success')
            setMessage('Redirigiendo para cambiar tu contraseña...')
            // Limpiar el hash de la URL antes de redirigir
            window.history.replaceState({}, document.title, window.location.pathname)
            router.push('/reset-password')
            return
          }

          if (data.session && data.user) {
            await handleSuccessfulAuth(data.user)
            return
          }
        }

        // Verificar parámetros de verificación de email (tanto token como token_hash)
        const token = searchParams.get('token') || searchParams.get('token_hash')
        const type = searchParams.get('type')
        const next = searchParams.get('next') ?? '/dashboard'

        if (token && type) {
          console.log('Token de verificación encontrado, procesando...', { token: token.substring(0, 10) + '...', type })

          // Intentar con verifyOtp usando token_hash
          const verifyResult = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type as any
          })

          let user = null
          let authError = null

          // Si verifyOtp funciona, extraer usuario de la sesión
          if (!verifyResult.error && verifyResult.data.session) {
            user = verifyResult.data.session.user

            // Si es recuperación de contraseña, redirigir a reset-password
            if (type === 'recovery') {
              console.log('Tipo recovery detectado en query params, redirigiendo a reset-password...')
              setStatus('success')
              setMessage('Redirigiendo para cambiar tu contraseña...')
              router.push('/reset-password')
              return
            }
          } else {
            console.log('Falló verifyOtp con token_hash, intentando método alternativo...')
            authError = verifyResult.error

            // Para emails de confirmación, usar exchangeCodeForSession si es posible
            if (type === 'signup' || type === 'email_change') {
              try {
                const exchangeResult = await supabase.auth.exchangeCodeForSession(token)
                if (!exchangeResult.error && exchangeResult.data.session) {
                  user = exchangeResult.data.session.user
                  authError = null
                }
              } catch (exchangeError) {
                console.error('Error con exchangeCodeForSession:', exchangeError)
                // Si también falla, intentar obtener la sesión actual
                const sessionResult = await supabase.auth.getSession()
                if (!sessionResult.error && sessionResult.data.session) {
                  user = sessionResult.data.session.user
                  authError = null
                }
              }
            }
          }

          if (authError && !user) {
            console.error('Error de verificación:', authError)
            setStatus('error')
            setMessage('Error al verificar el email: ' + authError.message)
            toast.error('Error al verificar el email')
            return
          }

          if (user) {
            await handleSuccessfulAuth(user)
            return
          }
        }

        // Si no hay tokens ni parámetros de verificación, verificar sesión existente
        console.log('No se encontraron parámetros específicos, verificando sesión existente...')
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error al obtener sesión:', error)
          setStatus('error')
          setMessage('Error al obtener la sesión: ' + error.message)
          return
        }

        if (data.session) {
          console.log('Sesión existente encontrada')
          setStatus('success')
          setMessage('Sesión iniciada correctamente')
          toast.success('Sesión iniciada correctamente')
          setTimeout(() => router.push('/dashboard'), 1500)
        } else {
          console.log('No se encontró sesión válida')
          setStatus('error')
          setMessage('No se pudo establecer la sesión')
        }

      } catch (error) {
        console.error('Error en callback:', error)
        setStatus('error')
        setMessage('Error inesperado durante la verificación')
        toast.error('Error inesperado')
      }
    }

    const handleSuccessfulAuth = async (user: any) => {
      try {
        // Limpiar datos pendientes del localStorage
        const pendingEmail = localStorage.getItem('pendingConfirmationEmail')
        const pendingBusinessName = localStorage.getItem('pendingBusinessName')
        localStorage.removeItem('pendingConfirmationEmail')
        localStorage.removeItem('pendingBusinessName')

        // Crear o actualizar perfil de negocio
        if (pendingBusinessName) {
          console.log('Procesando perfil de negocio:', {
            user_id: user.id,
            business_name: pendingBusinessName,
            email: user.email || pendingEmail
          })

          const { data: existingProfile } = await supabase
            .from('business_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

          if (existingProfile) {
            const { error: updateError } = await supabase
              .from('business_profiles')
              .update({
                business_name: pendingBusinessName,
                email: user.email || pendingEmail,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id)

            if (updateError) {
              console.error('Error al actualizar perfil:', updateError)
              toast.error('Error al actualizar el perfil: ' + updateError.message)
            } else {
              toast.success('Perfil actualizado exitosamente')
            }
          } else {
            const { error: insertError } = await supabase
              .from('business_profiles')
              .insert({
                user_id: user.id,
                business_name: pendingBusinessName,
                email: user.email || pendingEmail,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })

            if (insertError) {
              console.error('Error al crear perfil:', insertError)
              toast.error('Error al crear perfil: ' + insertError.message)
            } else {
              toast.success('Perfil creado exitosamente')
            }
          }
        }

        setStatus('success')
        setMessage('¡Email verificado exitosamente!')
        toast.success('¡Bienvenido! Tu cuenta ha sido activada')

        setTimeout(() => router.push('/dashboard'), 2000)

      } catch (error) {
        console.error('Error al procesar autenticación exitosa:', error)
        // No bloquear el flujo principal por errores en el perfil
        setStatus('success')
        setMessage('Email verificado, pero hubo un problema con el perfil')
        setTimeout(() => router.push('/dashboard'), 2000)
      }
    }

    // Solo ejecutar cuando el router esté listo
    if (router) {
      handleAuthCallback()
    }
  }, [searchParams, router])

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-600" />
      case 'error':
        return <XCircle className="h-12 w-12 text-red-600" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600'
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
    }
  }

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verificando tu email...'
      case 'success':
        return '¡Email verificado!'
      case 'error':
        return 'Error de verificación'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className={`text-2xl font-bold ${getStatusColor()}`}>
            {getStatusTitle()}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Por favor espera mientras verificamos tu email...'}
            {status === 'success' && 'Tu cuenta ha sido activada exitosamente'}
            {status === 'error' && 'Hubo un problema al verificar tu email'}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          {message && (
            <div className={`p-4 rounded-lg ${status === 'success' ? 'bg-green-50 text-green-800' :
                status === 'error' ? 'bg-red-50 text-red-800' :
                  'bg-blue-50 text-blue-800'
              }`}>
              <p className="text-sm">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Serás redirigido automáticamente a tu dashboard en unos segundos...
              </p>
              <Link href="/dashboard">
                <Button className="w-full">
                  Ir al Dashboard
                </Button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Si el problema persiste, puedes intentar registrarte nuevamente o contactar soporte.
              </p>
              <div className="flex gap-2">
                <Link href="/register" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Registrarse de nuevo
                  </Button>
                </Link>
                <Link href="/login" className="flex-1">
                  <Button className="w-full">
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="space-y-3">
              <div className="animate-pulse">
                <div className="h-2 bg-blue-200 rounded-full"></div>
              </div>
              <p className="text-sm text-gray-500">
                Esto puede tomar unos segundos...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold text-blue-600">
              Cargando...
            </CardTitle>
            <CardDescription>
              Por favor espera mientras cargamos la página...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}