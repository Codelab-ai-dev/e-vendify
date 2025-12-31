"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Upload,
  X,
  Shield,
  Store,
  User,
  MapPin,
  CreditCard,
  Loader2,
  Mail,
  Phone,
  Globe,
  Tag,
  FileText,
  Key,
  Sparkles,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { isAdmin, supabase } from "@/lib/supabase"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { uploadStoreLogo } from "@/lib/storage"

const mexicanCities = [
  "Ciudad de Mexico",
  "Guadalajara",
  "Monterrey",
  "Puebla",
  "Tijuana",
  "Leon",
  "Juarez",
  "Zapopan",
  "Merida",
  "San Luis Potosi",
  "Aguascalientes",
  "Hermosillo",
  "Saltillo",
  "Mexicali",
  "Culiacan",
  "Queretaro",
  "Morelia",
  "Chihuahua",
  "Cancun",
  "Veracruz",
  "Toluca",
  "Acapulco",
  "Oaxaca",
  "Villahermosa",
  "Tuxtla Gutierrez",
]

const businessCategories = [
  { value: "alimentos", label: "Alimentos y Bebidas" },
  { value: "restaurante", label: "Restaurante" },
  { value: "panaderia", label: "Panaderia" },
  { value: "abarrotes", label: "Abarrotes" },
  { value: "carniceria", label: "Carniceria" },
  { value: "frutas", label: "Frutas y Verduras" },
  { value: "farmacia", label: "Farmacia" },
  { value: "ropa", label: "Ropa y Accesorios" },
  { value: "electronica", label: "Electronica" },
  { value: "hogar", label: "Hogar y Decoracion" },
  { value: "belleza", label: "Belleza y Cuidado Personal" },
  { value: "deportes", label: "Deportes" },
  { value: "mascotas", label: "Mascotas" },
  { value: "servicios", label: "Servicios" },
  { value: "otros", label: "Otros" },
]

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/-+/g, '-') // Replace multiple - with single -
    .trim()
}

function generatePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%"
  let password = ""
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export default function NewStorePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const [isAdminUser, setIsAdminUser] = useState(false)
  const [adminLoading, setAdminLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    // Negocio
    businessName: "",
    slug: "",
    description: "",
    category: "",

    // Propietario
    ownerName: "",
    email: "",
    phone: "",
    password: "",

    // Ubicacion
    address: "",
    city: "",

    // Configuracion
    plan: "basic",
    status: "active",
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Verificar autenticacion y permisos
  useEffect(() => {
    const checkAuth = async () => {
      if (!authLoading && !user) {
        router.push('/')
        return
      }

      if (user) {
        try {
          const { isAdmin: userIsAdmin, error } = await isAdmin(user.id)
          if (error || !userIsAdmin) {
            router.push('/')
            return
          }
          setIsAdminUser(true)
        } catch (error) {
          router.push('/')
        } finally {
          setAdminLoading(false)
        }
      }
    }

    checkAuth()
  }, [user, authLoading, router])

  // Auto-generar slug cuando cambia el nombre
  useEffect(() => {
    if (formData.businessName) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(prev.businessName)
      }))
    }
  }, [formData.businessName])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo es muy grande (max 5MB)')
        return
      }
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
  }

  const handleGeneratePassword = () => {
    setFormData(prev => ({ ...prev, password: generatePassword() }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.businessName || !formData.ownerName || !formData.email || !formData.password) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Subir logo si existe
      let logoUrl: string | null = null
      if (logoFile) {
        const tempStoreId = crypto.randomUUID()
        const { url, error: uploadError } = await uploadStoreLogo(logoFile, tempStoreId)
        if (uploadError) {
          console.error('Error uploading logo:', uploadError)
          toast.error('Error al subir el logo')
        } else {
          logoUrl = url
        }
      }

      // 2. Crear la tienda en Supabase
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert({
          name: formData.businessName,
          business_name: formData.businessName,
          slug: formData.slug,
          description: formData.description || null,
          category: formData.category || null,
          owner: formData.ownerName,
          email: formData.email,
          phone: formData.phone || null,
          address: formData.address || null,
          city: formData.city || null,
          logo_url: logoUrl,
          plan: formData.plan,
          status: formData.status,
        })
        .select()
        .single()

      if (storeError) {
        console.error('Error creating store:', storeError)
        if (storeError.code === '23505') {
          toast.error('Ya existe una tienda con ese slug o email')
        } else {
          toast.error('Error al crear la tienda')
        }
        return
      }

      toast.success('Tienda creada exitosamente!')
      router.push(`/admin/stores/created?id=${store.id}&name=${encodeURIComponent(formData.businessName)}&email=${encodeURIComponent(formData.email)}&password=${encodeURIComponent(formData.password)}`)

    } catch (error) {
      console.error('Error:', error)
      toast.error('Error inesperado al crear la tienda')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground font-mono text-sm">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdminUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b-2 border-border sticky top-0 z-50 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline font-mono text-sm">Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-lg">Nueva Tienda</span>
              </div>
            </div>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-10 h-10 border-2 border-border flex items-center justify-center hover:border-foreground transition-colors"
            >
              {theme === 'dark' ? '○' : '●'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Seccion: Negocio */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-border"
          >
            <div className="border-b-2 border-border p-4 flex items-center gap-3">
              <Store className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold text-lg">Informacion del Negocio</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Logo */}
              <div>
                <label className="block font-mono text-sm uppercase tracking-wider text-muted-foreground mb-3">
                  Logo (opcional)
                </label>
                {logoPreview ? (
                  <div className="relative w-32 h-32 border-2 border-border">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="w-32 h-32 border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-foreground transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                    <span className="font-mono text-xs text-muted-foreground">Subir</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div>
                  <label className="block font-mono text-sm uppercase tracking-wider text-muted-foreground mb-2">
                    Nombre del Negocio *
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="Ej: Panaderia San Jose"
                    required
                    className="w-full px-4 py-3 border-2 border-border bg-transparent focus:border-foreground focus:outline-none transition-colors"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block font-mono text-sm uppercase tracking-wider text-muted-foreground mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    URL de la Tienda
                  </label>
                  <div className="flex items-center border-2 border-border">
                    <span className="px-3 py-3 bg-muted text-muted-foreground font-mono text-sm border-r-2 border-border">
                      /store/
                    </span>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      placeholder="panaderia-san-jose"
                      className="flex-1 px-4 py-3 bg-transparent focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Categoria */}
                <div>
                  <label className="block font-mono text-sm uppercase tracking-wider text-muted-foreground mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Categoria
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-border bg-background focus:border-foreground focus:outline-none transition-colors"
                  >
                    <option value="">Seleccionar categoria</option>
                    {businessCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descripcion */}
              <div>
                <label className="block font-mono text-sm uppercase tracking-wider text-muted-foreground mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Descripcion
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe el negocio, especialidades, etc..."
                  className="w-full px-4 py-3 border-2 border-border bg-transparent focus:border-foreground focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>
          </motion.div>

          {/* Seccion: Propietario */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border-2 border-border"
          >
            <div className="border-b-2 border-border p-4 flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold text-lg">Propietario</h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div>
                  <label className="block font-mono text-sm uppercase tracking-wider text-muted-foreground mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    placeholder="Ej: Maria Gonzalez"
                    required
                    className="w-full px-4 py-3 border-2 border-border bg-transparent focus:border-foreground focus:outline-none transition-colors"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-mono text-sm uppercase tracking-wider text-muted-foreground mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="maria@ejemplo.com"
                    required
                    className="w-full px-4 py-3 border-2 border-border bg-transparent focus:border-foreground focus:outline-none transition-colors"
                  />
                </div>

                {/* Telefono */}
                <div>
                  <label className="block font-mono text-sm uppercase tracking-wider text-muted-foreground mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Telefono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="52 55 1234 5678"
                    className="w-full px-4 py-3 border-2 border-border bg-transparent focus:border-foreground focus:outline-none transition-colors"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block font-mono text-sm uppercase tracking-wider text-muted-foreground mb-2">
                    <Key className="w-4 h-4 inline mr-1" />
                    Contrasena Inicial *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Contrasena temporal"
                      required
                      className="flex-1 px-4 py-3 border-2 border-border bg-transparent focus:border-foreground focus:outline-none transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="px-4 py-3 border-2 border-border hover:border-foreground transition-colors flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="hidden sm:inline font-mono text-sm">Generar</span>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-mono">
                    El propietario podra cambiarla despues
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Seccion: Ubicacion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border-2 border-border"
          >
            <div className="border-b-2 border-border p-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold text-lg">Ubicacion</h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Direccion */}
                <div>
                  <label className="block font-mono text-sm uppercase tracking-wider text-muted-foreground mb-2">
                    Direccion
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Calle 123 #45"
                    className="w-full px-4 py-3 border-2 border-border bg-transparent focus:border-foreground focus:outline-none transition-colors"
                  />
                </div>

                {/* Ciudad */}
                <div>
                  <label className="block font-mono text-sm uppercase tracking-wider text-muted-foreground mb-2">
                    Ciudad
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-border bg-background focus:border-foreground focus:outline-none transition-colors"
                  >
                    <option value="">Seleccionar ciudad</option>
                    {mexicanCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Seccion: Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border-2 border-border"
          >
            <div className="border-b-2 border-border p-4 flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold text-lg">Plan y Configuracion</h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Plan */}
                <div>
                  <label className="block font-mono text-sm uppercase tracking-wider text-muted-foreground mb-2">
                    Plan
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, plan: 'basic' }))}
                      className={`p-4 border-2 transition-colors text-left ${
                        formData.plan === 'basic'
                          ? 'border-foreground bg-muted'
                          : 'border-border hover:border-foreground'
                      }`}
                    >
                      <span className="font-display font-bold block">Basico</span>
                      <span className="text-xs text-muted-foreground font-mono">Hasta 10 productos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, plan: 'premium' }))}
                      className={`p-4 border-2 transition-colors text-left ${
                        formData.plan === 'premium'
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary'
                      }`}
                    >
                      <span className="font-display font-bold block text-primary">Premium</span>
                      <span className="text-xs text-muted-foreground font-mono">Ilimitados + analytics</span>
                    </button>
                  </div>
                </div>

                {/* Estado */}
                <div>
                  <label className="block font-mono text-sm uppercase tracking-wider text-muted-foreground mb-2">
                    Estado Inicial
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, status: 'active' }))}
                      className={`p-4 border-2 transition-colors ${
                        formData.status === 'active'
                          ? 'border-green-500 bg-green-500/10 text-green-600'
                          : 'border-border hover:border-green-500'
                      }`}
                    >
                      <span className="font-mono font-bold">ACTIVA</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, status: 'inactive' }))}
                      className={`p-4 border-2 transition-colors ${
                        formData.status === 'inactive'
                          ? 'border-foreground bg-muted'
                          : 'border-border hover:border-foreground'
                      }`}
                    >
                      <span className="font-mono font-bold">INACTIVA</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="mt-6 p-4 border-2 border-primary/30 bg-primary/5">
                <h4 className="font-mono font-bold text-sm uppercase mb-2">Informacion:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 font-mono">
                  <li>• La tienda estara disponible inmediatamente</li>
                  <li>• Se mostraran las credenciales al crear</li>
                  <li>• El propietario podra cambiar su contrasena</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Botones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-end gap-4 pt-4"
          >
            <Link
              href="/admin/dashboard"
              className="px-6 py-3 border-2 border-border hover:border-foreground transition-colors font-mono"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-brutal px-8 py-3 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Store className="w-4 h-4" />
                  Crear Tienda
                </>
              )}
            </button>
          </motion.div>
        </form>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <Link href="/">
              <Image
                src={theme === 'dark' ? '/e-logo-oscuro.png' : '/logo-ev-claro.png'}
                alt="e-vendify"
                width={120}
                height={35}
                className={theme === 'dark' ? 'h-8 w-auto opacity-60 hover:opacity-100 transition-opacity' : 'h-6 w-auto opacity-60 hover:opacity-100 transition-opacity'}
              />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary animate-pulse" />
              <span className="font-mono text-xs">Admin Panel</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
