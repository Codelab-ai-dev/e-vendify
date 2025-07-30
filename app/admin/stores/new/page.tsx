"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, X, Shield, Store, User, MapPin, CreditCard, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { isAdmin } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const colombianCities = [
  "Bogotá",
  "Medellín",
  "Cali",
  "Barranquilla",
  "Cartagena",
  "Bucaramanga",
  "Pereira",
  "Santa Marta",
  "Ibagué",
  "Manizales",
  "Villavicencio",
  "Armenia",
  "Neiva",
  "Pasto",
  "Montería",
]

export default function NewStorePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [adminLoading, setAdminLoading] = useState(true)
  const [formData, setFormData] = useState({
    // Información del negocio
    businessName: "",
    businessDescription: "",
    businessCategory: "",
    logo: "",

    // Información del propietario
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    ownerPassword: "",

    // Ubicación
    address: "",
    city: "",

    // Plan y configuración
    plan: "basic",
    status: "active",
  })

  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Aquí iría la lógica para crear la tienda
      console.log("Creating new store:", formData)

      // Simular delay de creación
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simular redirección al dashboard
      alert("¡Tienda creada exitosamente!")
      window.location.href = "/admin/dashboard"
    } catch (error) {
      console.error("Error creating store:", error)
      alert("Error al crear la tienda. Intenta nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setLogoPreview(result)
        setFormData({ ...formData, logo: result })
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoPreview(null)
    setFormData({ ...formData, logo: "" })
  }

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, ownerPassword: password })
  }

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al panel
              </Button>
            </Link>
            <Shield className="h-6 w-6 text-red-600 mr-3" />
            <h1 className="text-xl font-semibold text-gray-900">Crear nueva tienda</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información del Negocio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Store className="h-5 w-5 mr-2 text-blue-600" />
                Información del Negocio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo del negocio (opcional)</Label>
                {logoPreview ? (
                  <div className="relative w-32 h-32">
                    <img
                      src={logoPreview || "/placeholder.svg"}
                      alt="Logo preview"
                      className="w-32 h-32 object-cover rounded-full border-4 border-gray-200"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
                      onClick={removeLogo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <label htmlFor="logo-upload" className="cursor-pointer text-sm text-blue-600 hover:text-blue-500">
                        Subir logo
                        <input
                          id="logo-upload"
                          name="logo-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleLogoUpload}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre del negocio */}
                <div className="space-y-2">
                  <Label htmlFor="businessName">Nombre del negocio *</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    type="text"
                    placeholder="Ej: Panadería San José"
                    value={formData.businessName}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Categoría */}
                <div className="space-y-2">
                  <Label htmlFor="businessCategory">Categoría del negocio</Label>
                  <Select onValueChange={(value) => handleSelectChange("businessCategory", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="panaderia">Panadería</SelectItem>
                      <SelectItem value="restaurante">Restaurante</SelectItem>
                      <SelectItem value="tienda">Tienda de abarrotes</SelectItem>
                      <SelectItem value="carniceria">Carnicería</SelectItem>
                      <SelectItem value="fruteria">Frutería</SelectItem>
                      <SelectItem value="farmacia">Farmacia</SelectItem>
                      <SelectItem value="ropa">Ropa y accesorios</SelectItem>
                      <SelectItem value="otros">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="businessDescription">Descripción del negocio</Label>
                <Textarea
                  id="businessDescription"
                  name="businessDescription"
                  placeholder="Describe el negocio, especialidades, años de experiencia..."
                  rows={3}
                  value={formData.businessDescription}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Información del Propietario */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-green-600" />
                Información del Propietario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre del propietario */}
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Nombre completo *</Label>
                  <Input
                    id="ownerName"
                    name="ownerName"
                    type="text"
                    placeholder="Ej: María González"
                    value={formData.ownerName}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="ownerEmail">Correo electrónico *</Label>
                  <Input
                    id="ownerEmail"
                    name="ownerEmail"
                    type="email"
                    placeholder="maria@panaderiasanjose.com"
                    value={formData.ownerEmail}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Teléfono */}
                <div className="space-y-2">
                  <Label htmlFor="ownerPhone">Teléfono *</Label>
                  <Input
                    id="ownerPhone"
                    name="ownerPhone"
                    type="tel"
                    placeholder="573001234567"
                    value={formData.ownerPhone}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Contraseña */}
                <div className="space-y-2">
                  <Label htmlFor="ownerPassword">Contraseña inicial *</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="ownerPassword"
                      name="ownerPassword"
                      type="text"
                      placeholder="Contraseña temporal"
                      value={formData.ownerPassword}
                      onChange={handleChange}
                      required
                    />
                    <Button type="button" variant="outline" onClick={generatePassword}>
                      Generar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    El propietario podrá cambiar esta contraseña en su primer acceso
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ubicación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-purple-600" />
                Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dirección */}
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección completa</Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    placeholder="Calle 123 #45-67"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>

                {/* Ciudad */}
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad *</Label>
                  <Select onValueChange={(value) => handleSelectChange("city", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una ciudad" />
                    </SelectTrigger>
                    <SelectContent>
                      {colombianCities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuración de Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-orange-600" />
                Plan y Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Plan */}
                <div className="space-y-2">
                  <Label htmlFor="plan">Plan inicial *</Label>
                  <Select onValueChange={(value) => handleSelectChange("plan", value)} defaultValue="basic">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">
                        <div className="flex flex-col">
                          <span className="font-medium">Plan Básico</span>
                          <span className="text-xs text-gray-500">Hasta 10 productos</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="premium">
                        <div className="flex flex-col">
                          <span className="font-medium">Plan Premium</span>
                          <span className="text-xs text-gray-500">Productos ilimitados + analytics</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Estado inicial */}
                <div className="space-y-2">
                  <Label htmlFor="status">Estado inicial</Label>
                  <Select onValueChange={(value) => handleSelectChange("status", value)} defaultValue="active">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activa</SelectItem>
                      <SelectItem value="inactive">Inactiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Información importante:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Se enviará un email de bienvenida al propietario con las credenciales</li>
                  <li>• La tienda estará disponible inmediatamente después de la creación</li>
                  <li>• El propietario podrá cambiar su contraseña en el primer acceso</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4 pt-6">
            <Link href="/admin/dashboard">
              <Button variant="outline" disabled={isSubmitting}>
                Cancelar
              </Button>
            </Link>
            <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando tienda...
                </>
              ) : (
                <>
                  <Store className="h-4 w-4 mr-2" />
                  Crear tienda
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
