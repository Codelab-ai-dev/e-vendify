"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Shield, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { signInWithEmail, isAdmin } from "@/lib/supabase"
import { toast } from "sonner"

export const dynamic = 'force-dynamic'

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Intentar autenticación con Supabase
      const { data, error } = await signInWithEmail(formData.email, formData.password)

      if (error) {
        toast.error("Error de autenticación: " + error.message)
        return
      }

      if (data.user) {
        // Verificar si el usuario es admin
        const { isAdmin: userIsAdmin, error: adminError } = await isAdmin(data.user.id)

        if (adminError) {
          toast.error("Error al verificar permisos de administrador")
          return
        }

        if (!userIsAdmin) {
          toast.error("No tienes permisos de administrador")
          return
        }

        toast.success("¡Bienvenido, administrador!")
        router.push("/admin/dashboard")
      }
    } catch (error) {
      console.error("Error durante el login:", error)
      toast.error("Error inesperado durante el login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-200">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center">
            <img
              src="/e-vendify-tight-no-tagline.webp"
              alt="e-vendify"
              style={{ height: "70px", width: "auto", marginBottom: "40px" }}
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Panel de Administración</CardTitle>

        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo de administrador</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@mikioskodigital.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña de administrador"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
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
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Acceder al Panel
                </>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">Solo personal autorizado puede acceder a este panel</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
