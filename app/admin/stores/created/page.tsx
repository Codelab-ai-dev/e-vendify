"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Store, Mail, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { isAdmin } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function StoreCreatedPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [adminLoading, setAdminLoading] = useState(true)
  const searchParams = useSearchParams()

  // En una implementación real, estos datos vendrían de los parámetros de la URL
  const storeData = {
    name: searchParams?.get("name") || "Nueva Tienda",
    owner: searchParams?.get("owner") || "Propietario",
    email: searchParams?.get("email") || "email@ejemplo.com",
    storeUrl: searchParams?.get("url") || "#",
    plan: searchParams?.get("plan") || "basic",
  }

  // Protección de ruta: verificar autenticación y permisos de admin
  useEffect(() => {
    const checkAuth = async () => {
      // Si no hay usuario autenticado, redirigir al home
      if (!authLoading && !user) {
        console.log('Usuario no autenticado, redirigiendo al home')
        router.push('/')
        return
      }

      // Si hay usuario, verificar si es admin
      if (user) {
        try {
          const { isAdmin: userIsAdmin, error } = await isAdmin(user.id)
          if (error) {
            console.error('Error verificando permisos de admin:', error)
            router.push('/')
            return
          }

          if (!userIsAdmin) {
            console.log('Usuario no es admin, redirigiendo al home')
            router.push('/')
            return
          }

          setIsAdminUser(true)
        } catch (error) {
          console.error('Error inesperado verificando admin:', error)
          router.push('/')
        } finally {
          setAdminLoading(false)
        }
      }
    }

    checkAuth()
  }, [user, authLoading, router])

  // Mostrar loading mientras se verifica autenticación
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Verificando permisos...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario o no es admin, no mostrar nada (se redirigirá)
  if (!user || !isAdminUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">¡Tienda creada exitosamente!</CardTitle>
          <CardDescription>La tienda ha sido configurada y está lista para usar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información de la tienda creada */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Nombre de la tienda:</span>
              <span className="font-semibold">{storeData.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Propietario:</span>
              <span className="font-semibold">{storeData.owner}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Email:</span>
              <span className="font-semibold">{storeData.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Plan:</span>
              <Badge
                className={storeData.plan === "premium" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}
              >
                {storeData.plan === "premium" ? "Premium" : "Básico"}
              </Badge>
            </div>
          </div>

          {/* Acciones realizadas automáticamente */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Acciones completadas:</h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Cuenta de usuario creada
              </div>
              <div className="flex items-center text-sm text-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Tienda digital configurada
              </div>
              <div className="flex items-center text-sm text-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Email de bienvenida enviado
              </div>
              <div className="flex items-center text-sm text-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Credenciales de acceso generadas
              </div>
            </div>
          </div>

          {/* Próximos pasos */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Próximos pasos:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• El propietario recibirá un email con las instrucciones de acceso</li>
              <li>• Podrá iniciar sesión y comenzar a agregar productos inmediatamente</li>
              <li>• La tienda estará disponible públicamente una vez agregue productos</li>
            </ul>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link href="/admin/dashboard" className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                Volver al panel
              </Button>
            </Link>
            <Link href={storeData.storeUrl} className="flex-1">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Store className="h-4 w-4 mr-2" />
                Ver tienda pública
              </Button>
            </Link>
            <Button className="flex-1 bg-green-600 hover:bg-green-700">
              <Mail className="h-4 w-4 mr-2" />
              Reenviar credenciales
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
