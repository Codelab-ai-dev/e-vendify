"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Loader2, CheckCircle, Upload, X, ArrowRight, ArrowLeft } from "lucide-react"
import { supabase, signUpWithRetry } from "@/lib/supabase"
import { generateUniqueSlug } from "@/lib/slugs"
import { toast } from "sonner"
import { useTheme } from "next-themes"

const mexicanCities = [
  "Ciudad de Mexico",
  "Guadalajara",
  "Monterrey",
  "Puebla",
  "Tijuana",
  "Leon",
  "Juarez",
  "Torreon",
  "Queretaro",
  "San Luis Potosi",
  "Merida",
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
  "Culiacan",
  "Hermosillo",
  "Cancun",
  "Veracruz",
]

const businessCategories = [
  "Alimentacion y Bebidas",
  "Moda y Accesorios",
  "Tecnologia y Electronicos",
  "Salud y Belleza",
  "Hogar y Decoracion",
  "Deportes y Recreacion",
  "Servicios Profesionales",
  "Educacion",
  "Otros",
]

export default function RegisterPage() {
  const { theme } = useTheme()
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    password: "",
    businessDescription: "",
    businessCategory: "",
    logo: "",
    ownerName: "",
    ownerPhone: "",
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
          toast.error("El correo electronico es requerido")
          return false
        }
        if (formData.password.length < 8) {
          toast.error("La contraseña debe tener al menos 8 caracteres")
          return false
        }
        return true
      case 2:
        if (!formData.businessCategory) {
          toast.error("La categoria del negocio es requerida")
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
        toast.error(`Error al crear la cuenta: ${error.message}`)
        return
      }

      if (data?.user) {
        const storeSlug = await generateUniqueSlug(formData.businessName, supabase)

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
          registered_date: new Date().toISOString(),
          status: 'active' as const,
          is_active: true,
          plan: 'basic' as const,
          products_count: 0,
          monthly_revenue: 0,
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { error: storeError } = await supabase
          .from('stores')
          .insert(newStore)

        if (storeError) {
          toast.error(`Error al crear la tienda: ${storeError.message}`)
          return
        }

        localStorage.setItem('pendingConfirmationEmail', formData.email)
        localStorage.setItem('pendingBusinessName', formData.businessName)

        setIsSuccess(true)

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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

  const steps = [
    { num: 1, title: "Cuenta", subtitle: "Credenciales de acceso" },
    { num: 2, title: "Negocio", subtitle: "Detalles de tu tienda" },
    { num: 3, title: "Contacto", subtitle: "Informacion personal" },
    { num: 4, title: "Ubicacion", subtitle: "Donde te encuentras" },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Left side - Progress */}
      <div className="hidden lg:flex lg:w-2/5 bg-foreground text-background p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-background/60 hover:text-background transition-colors mb-12 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Volver al inicio</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="heading-xl text-4xl xl:text-5xl mb-6">
              Crea tu
              <br />
              <span className="text-primary">tienda digital.</span>
            </h1>
            <p className="text-background/60 text-lg max-w-md mb-12">
              En solo 4 pasos tendras tu negocio listo para vender en linea.
            </p>
          </motion.div>

          {/* Steps indicator */}
          <div className="space-y-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                className={`flex items-center gap-4 ${currentStep >= step.num ? 'opacity-100' : 'opacity-40'}`}
              >
                <div className={`w-10 h-10 flex items-center justify-center font-mono text-sm font-bold transition-colors ${
                  currentStep > step.num
                    ? 'bg-primary text-primary-foreground'
                    : currentStep === step.num
                      ? 'bg-background text-foreground'
                      : 'bg-background/20 text-background'
                }`}>
                  {currentStep > step.num ? <CheckCircle className="w-5 h-5" /> : step.num.toString().padStart(2, '0')}
                </div>
                <div>
                  <p className="font-display font-bold">{step.title}</p>
                  <p className="text-sm text-background/60">{step.subtitle}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="relative z-10"
        >
          <p className="text-sm text-background/40">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-background hover:text-primary transition-colors font-medium">
              Inicia sesion
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-lg"
        >
          {/* Mobile header */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm">Volver</span>
            </Link>
            <Link href="/" className="block mb-4">
              <Image
                src={theme === 'dark' ? '/e-logo-oscuro.png' : '/logo-ev-claro.png'}
                alt="e-vendify"
                width={160}
                height={45}
                className={theme === 'dark' ? 'h-10 w-auto' : 'h-8 w-auto'}
              />
            </Link>
            {/* Mobile progress */}
            <div className="flex gap-2 mb-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-1 flex-1 transition-colors ${step <= currentStep ? 'bg-primary' : 'bg-border'}`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Paso {currentStep} de {totalSteps}</p>
          </div>

          <div className="mb-8">
            <span className="label-mono mb-4 block">{steps[currentStep - 1].subtitle}</span>
            <h2 className="heading-lg text-3xl sm:text-4xl">
              {steps[currentStep - 1].title}
            </h2>
          </div>

          <form onSubmit={currentStep === totalSteps ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            <AnimatePresence mode="wait">
              {/* Step 1: Account */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label htmlFor="businessName" className="text-sm font-medium block">
                      Nombre de tu negocio *
                    </label>
                    <div className={`border-2 transition-colors ${focusedField === 'businessName' ? 'border-primary' : 'border-border'}`}>
                      <input
                        id="businessName"
                        name="businessName"
                        type="text"
                        placeholder="Ej: Panaderia San Jose"
                        value={formData.businessName}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('businessName')}
                        onBlur={() => setFocusedField(null)}
                        disabled={isLoading || isSuccess}
                        required
                        className="w-full px-4 py-4 bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium block">
                      Correo electronico *
                    </label>
                    <div className={`border-2 transition-colors ${focusedField === 'email' ? 'border-primary' : 'border-border'}`}>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="tu@negocio.com"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        disabled={isLoading || isSuccess}
                        required
                        className="w-full px-4 py-4 bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium block">
                      Contraseña *
                    </label>
                    <div className={`relative border-2 transition-colors ${focusedField === 'password' ? 'border-primary' : 'border-border'}`}>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimo 8 caracteres"
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        disabled={isLoading || isSuccess}
                        required
                        minLength={8}
                        className="w-full px-4 py-4 bg-transparent focus:outline-none pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Business */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label htmlFor="businessCategory" className="text-sm font-medium block">
                      Categoria del negocio *
                    </label>
                    <div className={`border-2 transition-colors ${focusedField === 'businessCategory' ? 'border-primary' : 'border-border'}`}>
                      <select
                        id="businessCategory"
                        name="businessCategory"
                        value={formData.businessCategory}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('businessCategory')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full px-4 py-4 bg-transparent focus:outline-none cursor-pointer appearance-none"
                        required
                      >
                        <option value="">Selecciona una categoria</option>
                        {businessCategories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="businessDescription" className="text-sm font-medium block">
                      Descripcion del negocio
                    </label>
                    <div className={`border-2 transition-colors ${focusedField === 'businessDescription' ? 'border-primary' : 'border-border'}`}>
                      <textarea
                        id="businessDescription"
                        name="businessDescription"
                        placeholder="Describe brevemente tu negocio..."
                        value={formData.businessDescription}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('businessDescription')}
                        onBlur={() => setFocusedField(null)}
                        rows={3}
                        className="w-full px-4 py-4 bg-transparent focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium block">Logo del negocio</label>
                    <div className="flex items-center gap-4">
                      {logoPreview ? (
                        <div className="relative">
                          <img src={logoPreview} alt="Logo preview" className="w-20 h-20 object-cover border-2 border-border" />
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-foreground text-background flex items-center justify-center hover:bg-primary transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 border-2 border-dashed border-border flex items-center justify-center">
                          <Upload className="h-6 w-6 text-muted-foreground" />
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
                        <label htmlFor="logo" className="btn-brutal-outline text-sm px-4 py-2 cursor-pointer inline-block">
                          Subir logo
                        </label>
                        <p className="text-xs text-muted-foreground mt-2">JPG, PNG hasta 5MB</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Contact */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label htmlFor="ownerName" className="text-sm font-medium block">
                      Tu nombre completo *
                    </label>
                    <div className={`border-2 transition-colors ${focusedField === 'ownerName' ? 'border-primary' : 'border-border'}`}>
                      <input
                        id="ownerName"
                        name="ownerName"
                        type="text"
                        placeholder="Ej: Juan Perez"
                        value={formData.ownerName}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('ownerName')}
                        onBlur={() => setFocusedField(null)}
                        required
                        className="w-full px-4 py-4 bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="ownerPhone" className="text-sm font-medium block">
                      Telefono (opcional)
                    </label>
                    <div className={`border-2 transition-colors ${focusedField === 'ownerPhone' ? 'border-primary' : 'border-border'}`}>
                      <input
                        id="ownerPhone"
                        name="ownerPhone"
                        type="tel"
                        placeholder="Ej: +52 55 1234 5678"
                        value={formData.ownerPhone}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('ownerPhone')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full px-4 py-4 bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Location */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label htmlFor="city" className="text-sm font-medium block">
                      Ciudad *
                    </label>
                    <div className={`border-2 transition-colors ${focusedField === 'city' ? 'border-primary' : 'border-border'}`}>
                      <select
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('city')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full px-4 py-4 bg-transparent focus:outline-none cursor-pointer appearance-none"
                        required
                      >
                        <option value="">Selecciona tu ciudad</option>
                        {mexicanCities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="address" className="text-sm font-medium block">
                      Direccion (opcional)
                    </label>
                    <div className={`border-2 transition-colors ${focusedField === 'address' ? 'border-primary' : 'border-border'}`}>
                      <input
                        id="address"
                        name="address"
                        type="text"
                        placeholder="Ej: Av. Reforma 123, Col. Centro"
                        value={formData.address}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('address')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full px-4 py-4 bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-muted/50 border-2 border-border">
                    <p className="font-display font-bold mb-2">¡Ya casi terminamos!</p>
                    <p className="text-sm text-muted-foreground">
                      Al crear tu tienda, tendras acceso a tu panel de control donde podras agregar productos, gestionar pedidos y personalizar tu tienda.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-10 pt-6 border-t border-border">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={isLoading || isSuccess}
                  className="btn-brutal-outline px-6 py-3 inline-flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Anterior
                </button>
              ) : (
                <div />
              )}

              {currentStep < totalSteps ? (
                <button
                  type="submit"
                  disabled={isLoading || isSuccess}
                  className="btn-brutal px-8 py-3 inline-flex items-center gap-2"
                >
                  Siguiente
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading || isSuccess}
                  className="btn-brutal bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 inline-flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creando tienda...
                    </>
                  ) : isSuccess ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      ¡Listo! Redirigiendo...
                    </>
                  ) : (
                    <>
                      Crear mi tienda
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Mobile login link */}
          <p className="lg:hidden mt-8 text-center text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-foreground font-medium hover:text-primary transition-colors">
              Inicia sesion
            </Link>
          </p>

          {/* Terms */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Al registrarte, aceptas nuestros{" "}
            <Link href="#" className="hover:text-foreground transition-colors">Terminos</Link>
            {" "}y{" "}
            <Link href="#" className="hover:text-foreground transition-colors">Privacidad</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
