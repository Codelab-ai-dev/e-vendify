"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Store, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase, isAdmin } from "@/lib/supabase"
import { toast } from "sonner"

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validaciones básicas
      if (!email.trim() || !password.trim()) {
        toast.error("Por favor completa todos los campos")
        return
      }

      if (password.length < 6) {
        toast.error("La contraseña debe tener al menos 6 caracteres")
        return
      }

      console.log("Intentando login con:", { email })

      // Intentar autenticación con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (error) {
        console.error("Error de autenticación:", error)

        // Mensajes de error más específicos
        if (error.message.includes('Invalid login credentials')) {
          toast.error("Credenciales incorrectas. Verifica tu email y contraseña.")
        } else if (error.message.includes('Email not confirmed')) {
          // Problema temporal con verificación de email - intentar forzar login
          console.warn("Email reportado como no confirmado, pero puede ser un error de Supabase")
          toast.error("Problema con verificación de email. Contacta al administrador si persiste.")

          // Opcional: Mostrar información adicional para debugging
          console.log("Detalles del error de confirmación:", error)
        } else {
          toast.error(`Error de autenticación: ${error.message}`)
        }
        return
      }

      if (data.user) {
        console.log("Usuario autenticado:", data.user.id)

        // Verificar si es administrador
        const { isAdmin: userIsAdmin, error: adminError } = await isAdmin(data.user.id)

        if (adminError) {
          console.error("Error al verificar permisos de admin:", adminError)
          // Continuar como usuario regular si hay error verificando admin
        }

        if (userIsAdmin) {
          console.log("Usuario es admin, redirigiendo a admin dashboard")
          toast.success("¡Bienvenido, administrador!")
          router.push("/admin/dashboard")
        } else {
          console.log("Usuario regular, redirigiendo a dashboard")
          toast.success("¡Bienvenido de vuelta!")
          router.push("/dashboard")
        }
      }
    } catch (error) {
      console.error("Error inesperado durante el login:", error)
      toast.error("Error inesperado durante el login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center">
            <img
              src="/e-vendify-tight-no-tagline.webp"
              alt="e-vendify"
              style={{ height: "70px", width: "auto", marginBottom: "40px" }}
            />
          </div>
          <CardDescription>Inicia sesión para gestionar tu tienda digital</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@negocio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
