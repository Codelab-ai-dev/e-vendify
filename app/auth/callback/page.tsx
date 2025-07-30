"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Link from "next/link"

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Obtener los parámetros de la URL
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')
        const next = searchParams.get('next') ?? '/dashboard'

        if (token_hash && type) {
          // Verificar el token con Supabase
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any
          })

          if (error) {
            console.error('Error de verificación:', error)
            setStatus('error')
            setMessage(error.message || 'Error al verificar el email')
            toast.error('Error al verificar el email')
            return
          }

          if (data.user) {
            // Limpiar el email pendiente del localStorage
            const pendingEmail = localStorage.getItem('pendingConfirmationEmail')
            const pendingBusinessName = localStorage.getItem('pendingBusinessName')
            localStorage.removeItem('pendingConfirmationEmail')
            localStorage.removeItem('pendingBusinessName')
            
            // Crear o actualizar perfil de negocio después de la confirmación
            if (pendingBusinessName) {
              try {
                console.log('Intentando crear perfil de negocio para:', {
                  user_id: data.user.id,
                  business_name: pendingBusinessName,
                  email: data.user.email || pendingEmail
                })
                
                // Primero verificar si ya existe un perfil
                const { data: existingProfile } = await supabase
                  .from('business_profiles')
                  .select('*')
                  .eq('user_id', data.user.id)
                  .single()
                
                if (existingProfile) {
                  console.log('Perfil ya existe, actualizando:', existingProfile)
                  
                  const { error: updateError } = await supabase
                    .from('business_profiles')
                    .update({
                      business_name: pendingBusinessName,
                      email: data.user.email || pendingEmail,
                      updated_at: new Date().toISOString()
                    })
                    .eq('user_id', data.user.id)
                  
                  if (updateError) {
                    console.error('Error al actualizar perfil:', updateError)
                    toast.error('Error al actualizar el perfil de negocio: ' + updateError.message)
                  } else {
                    console.log('Perfil actualizado exitosamente')
                    toast.success('Perfil de negocio actualizado')
                  }
                } else {
                  console.log('Creando nuevo perfil de negocio')
                  
                  const { error: insertError } = await supabase
                    .from('business_profiles')
                    .insert({
                      user_id: data.user.id,
                      business_name: pendingBusinessName,
                      email: data.user.email || pendingEmail,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    })
                  
                  if (insertError) {
                    console.error('Error al crear perfil:', insertError)
                    toast.error('Error al crear el perfil de negocio: ' + insertError.message)
                  } else {
                    console.log('Perfil creado exitosamente')
                    toast.success('Perfil de negocio creado')
                  }
                }
              } catch (error) {
                console.error('Error inesperado al manejar perfil:', error)
                toast.error('Error inesperado al crear el perfil')
              }
            }
            
            setStatus('success')
            setMessage('¡Email verificado exitosamente!')
            toast.success('¡Bienvenido! Tu cuenta ha sido activada')
            
            // Redirigir después de un momento
            setTimeout(() => {
              router.push(next)
            }, 2000)
          }
        } else {
          // Manejar callback de sesión normal
          const { data, error } = await supabase.auth.getSession()
          
          if (error) {
            setStatus('error')
            setMessage('Error al obtener la sesión')
            return
          }

          if (data.session) {
            setStatus('success')
            setMessage('Sesión iniciada correctamente')
            router.push('/dashboard')
          } else {
            setStatus('error')
            setMessage('No se pudo establecer la sesión')
          }
        }
      } catch (error) {
        console.error('Error en callback:', error)
        setStatus('error')
        setMessage('Error inesperado durante la verificación')
        toast.error('Error inesperado')
      }
    }

    handleAuthCallback()
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
            <div className={`p-4 rounded-lg ${
              status === 'success' ? 'bg-green-50 text-green-800' : 
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
