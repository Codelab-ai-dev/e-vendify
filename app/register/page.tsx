"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Store, Loader2, CheckCircle, Upload, X, User, MapPin, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase, signUpWithRetry } from "@/lib/supabase"
import { generateUniqueSlug } from "@/lib/slugs"
import { toast } from "sonner"

const mexicanCities = [
  "Ciudad de México",
  "Guadalajara",
  "Monterrey",
  "Puebla",
  "Tijuana",
  "León",
  "Juárez",
  "Torreón",
  "Querétaro",
  "San Luis Potosí",
  "Mérida",
  "Mexicali",
  "Aguascalientes",
  "Cuernavaca",
  "Saltillo",
  "Xalapa",
  "Tampico",
  "Morelia",
  "Reynosa",
  "Toluca",
  "Chihuahua",
  "Culiacán",
  "Hermosillo",
  "Cancún",
  "Veracruz",
]

const businessCategories = [
  "Alimentación y Bebidas",
  "Moda y Accesorios",
  "Tecnología y Electrónicos",
  "Salud y Belleza",
  "Hogar y Decoración",
  "Deportes y Recreación",
  "Servicios Profesionales",
  "Educación",
  "Otros",
]

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    // Paso 1: Información básica
    businessName: "",
    email: "",
    password: "",
    
    // Paso 2: Información del negocio
    businessDescription: "",
    businessCategory: "",
    logo: "",
    
    // Paso 3: Información personal
    ownerName: "",
    ownerPhone: "",
    
    // Paso 4: Ubicación
    address: "",
    city: "",
  })
  const router = useRouter()

  const totalSteps = 4

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.businessName.trim()) {
          toast.error("El nombre del negocio es requerido")
          return false
        }
        if (!formData.email.trim()) {
          toast.error("El correo electrónico es requerido")
          return false
        }
        if (formData.password.length < 8) {
          toast.error("La contraseña debe tener al menos 8 caracteres")
          return false
        }
        return true
      case 2:
        if (!formData.businessCategory) {
          toast.error("La categoría del negocio es requerida")
          return false
        }
        return true
      case 3:
        if (!formData.ownerName.trim()) {
          toast.error("Tu nombre es requerido")
          return false
        }
        return true
      case 4:
        if (!formData.city) {
          toast.error("La ciudad es requerida")
          return false
        }
        return true
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      nextStep()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep(currentStep)) {
      return
    }
    
    setIsLoading(true)

    try {
      // Registrar usuario en Supabase con reintentos
      const { data, error } = await signUpWithRetry(
        formData.email,
        formData.password,
        {
          data: {
            business_name: formData.businessName,
            owner_name: formData.ownerName,
            user_type: 'business_owner'
          },
        }
      )

      if (error) {
        console.error('Error de registro:', error)
        toast.error(`Error al crear la cuenta: ${error.message}`)
        return
      }

      if (data?.user) {
        // Generar slug único para la tienda
        const storeSlug = await generateUniqueSlug(formData.businessName, supabase)
        
        // Crear tienda en la tabla stores unificada
        const newStore = {
          user_id: data.user!.id,
          name: formData.businessName,
          business_name: formData.businessName,
          owner: formData.ownerName,
          email: formData.email,
          phone: formData.ownerPhone,
          address: formData.address,
          city: formData.city,
          description: formData.businessDescription,
          logo_url: formData.logo,
          category: formData.businessCategory,
          slug: storeSlug,
          
          // Estados y configuración por defecto
          registered_date: new Date().toISOString(),
          status: 'active' as const,
          is_active: true,
          
          // Plan básico por defecto
          plan: 'basic' as const,
          
          // Estadísticas iniciales
          products_count: 0,
          monthly_revenue: 0,
          last_login: new Date().toISOString(),
          
          // Timestamps
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Crear la tienda en la tabla stores
        const { error: storeError } = await supabase
          .from('stores')
          .insert(newStore)

        if (storeError) {
          console.error('Error al crear la tienda:', storeError.message)
          toast.error(`Error al crear la tienda: ${storeError.message}`)
          return
        }

        // Guardar datos para confirmación
        localStorage.setItem('pendingConfirmationEmail', formData.email)
        localStorage.setItem('pendingBusinessName', formData.businessName)
        
        setIsSuccess(true)
        
        // Verificar si el email necesita confirmación
        if (data.user && data.user.email_confirmed_at) {
          toast.success("¡Tienda creada exitosamente!")
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        } else {
          toast.success("¡Tienda creada! Revisa tu email para confirmar tu cuenta")
          setTimeout(() => {
            router.push('/confirm-email')
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Error inesperado:', error)
      toast.error("Error inesperado al crear la tienda")
    } finally {
      setIsLoading(false)
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

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return "Información Básica"
      case 2: return "Detalles del Negocio"
      case 3: return "Información Personal"
      case 4: return "Ubicación"
      default: return ""
    }
  }

  const getStepDescription = (step: number) => {
    switch (step) {
      case 1: return "Comencemos con lo básico de tu tienda"
      case 2: return "Cuéntanos más sobre tu negocio"
      case 3: return "Información de contacto del propietario"
      case 4: return "¿Dónde se encuentra tu negocio?"
      default: return ""
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
        <div className="flex items-center justify-center">
              <img
                src="/e-vendify-icon-tight.webp"
                alt="e-vendify"
                style={{ height: "100px", width: "auto", padding: "5px", marginBottom: "20px" }}
              />
            </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {getStepTitle(currentStep)}
          </CardTitle>
          <CardDescription>
            {getStepDescription(currentStep)}
          </CardDescription>
          
          {/* Progress indicator */}
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Paso {currentStep} de {totalSteps}
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={currentStep === totalSteps ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
            
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Nombre de tu negocio *</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    type="text"
                    placeholder="Ej: Panadería San José"
                    value={formData.businessName}
                    onChange={handleChange}
                    disabled={isLoading || isSuccess}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@negocio.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading || isSuccess}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading || isSuccess}
                      required
                      minLength={8}
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
              </div>
            )}

            {/* Step 2: Business Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessCategory">Categoría del negocio *</Label>
                  <Select onValueChange={(value) => handleSelectChange("businessCategory", value)} value={formData.businessCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessDescription">Descripción del negocio</Label>
                  <Textarea
                    id="businessDescription"
                    name="businessDescription"
                    placeholder="Describe brevemente tu negocio..."
                    value={formData.businessDescription}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Logo del negocio (opcional)</Label>
                  <div className="flex items-center space-x-4">
                    {logoPreview ? (
                      <div className="relative">
                        <img src={logoPreview} alt="Logo preview" className="w-20 h-20 object-cover rounded-lg border" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600"
                          onClick={removeLogo}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <Upload className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        id="logo"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Label htmlFor="logo" className="cursor-pointer">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>Subir logo</span>
                        </Button>
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG hasta 5MB</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Personal Information */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <User className="h-5 w-5 mr-2 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Información del propietario</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Tu nombre completo *</Label>
                  <Input
                    id="ownerName"
                    name="ownerName"
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    value={formData.ownerName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerPhone">Teléfono (opcional)</Label>
                  <Input
                    id="ownerPhone"
                    name="ownerPhone"
                    type="tel"
                    placeholder="Ej: +57 300 123 4567"
                    value={formData.ownerPhone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Location */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Ubicación del negocio</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad *</Label>
                  <Select onValueChange={(value) => handleSelectChange("city", value)} value={formData.city}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu ciudad" />
                    </SelectTrigger>
                    <SelectContent>
                      {mexicanCities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección (opcional)</Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    placeholder="Ej: Calle 123 #45-67"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
                <div className="bg-blue-50 p-4 rounded-lg mt-4">
                  <h4 className="font-medium text-blue-900 mb-2">¡Ya casi terminamos!</h4>
                  <p className="text-sm text-blue-800">
                    Al crear tu tienda, tendrás acceso inmediato a tu panel de control donde podrás agregar productos, gestionar pedidos y personalizar tu tienda.
                  </p>
                </div>
              </div>
            )}
            
            {/* Navigation buttons */}
            <div className="flex justify-between pt-6">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={isLoading || isSuccess}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
              )}
              
              <div className="ml-auto">
                {currentStep < totalSteps ? (
                  <Button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading || isSuccess}
                  >
                    Siguiente
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    className="bg-green-600 hover:bg-green-700" 
                    disabled={isLoading || isSuccess}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creando tienda...
                      </>
                    ) : isSuccess ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        ¡Tienda creada! Redirigiendo...
                      </>
                    ) : (
                      <>
                        <Store className="h-4 w-4 mr-2" />
                        Crear mi tienda digital
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Inicia sesión
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
