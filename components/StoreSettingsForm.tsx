import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, Upload, X, Edit, Check, Palette } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { generateUniqueSlug } from "@/lib/slugs"
import { toast } from "sonner"
import { themes, themeLabels, Theme } from "@/lib/themes"
import { uploadStoreLogo, deleteImage, isStorageUrl } from "@/lib/storage"

// ... imports and constants ...

// Lista de ciudades mexicanas
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

interface BusinessProfile {
  id: string
  user_id: string | null
  name: string
  business_name: string | null
  owner: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  description: string | null
  website: string | null
  logo_url: string | null
  category: string | null
  registered_date: string
  status: 'active' | 'inactive'
  is_active: boolean
  products_count: number
  monthly_revenue: number
  last_login: string
  plan: 'basic' | 'premium'
  slug: string
  theme: string
  created_at: string
  updated_at: string
}

interface StoreSettingsFormProps {
  businessProfile: BusinessProfile
  onUpdate: () => void
}

export default function StoreSettingsForm({ businessProfile, onUpdate }: StoreSettingsFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [originalLogoUrl, setOriginalLogoUrl] = useState<string | null>(businessProfile.logo_url)
  const [logoPreview, setLogoPreview] = useState<string | null>(businessProfile.logo_url)
  const [formData, setFormData] = useState({
    business_name: businessProfile.business_name || businessProfile.name || '',
    owner: businessProfile.owner || '',
    email: businessProfile.email || '',
    phone: businessProfile.phone || '',
    address: businessProfile.address || '',
    city: businessProfile.city || '',
    description: businessProfile.description || '',
    website: businessProfile.website || '',
    logo_url: businessProfile.logo_url || '',
    category: businessProfile.category || '',
    theme: businessProfile.theme || 'modern',
  })

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
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF.')
        return
      }

      // Validar tamano (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo es muy grande. Maximo 5MB.')
        return
      }

      // Guardar archivo para subir despues
      setLogoFile(file)

      // Mostrar preview local
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setLogoPreview(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoPreview(null)
    setLogoFile(null)
    setFormData({ ...formData, logo_url: "" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let logoUrl: string | null = formData.logo_url || null

      // Subir nuevo logo si hay archivo seleccionado
      if (logoFile && businessProfile.user_id) {
        setIsUploading(true)
        const uploadResult = await uploadStoreLogo(logoFile, businessProfile.user_id)
        setIsUploading(false)

        if (!uploadResult.success) {
          toast.error(uploadResult.error || 'Error al subir el logo')
          setIsLoading(false)
          return
        }

        logoUrl = uploadResult.url || null

        // Eliminar logo anterior si era del storage
        if (originalLogoUrl && isStorageUrl(originalLogoUrl)) {
          await deleteImage(originalLogoUrl, businessProfile.user_id)
        }
      }

      // Si se elimino el logo
      if (!logoPreview && originalLogoUrl && isStorageUrl(originalLogoUrl) && businessProfile.user_id) {
        await deleteImage(originalLogoUrl, businessProfile.user_id)
        logoUrl = null
      }

      // Verificar si cambió el nombre del negocio para regenerar slug
      let updateData = {
        business_name: formData.business_name,
        name: formData.business_name, // Mantener sincronizado
        owner: formData.owner,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        description: formData.description,
        website: formData.website,
        logo_url: logoUrl,
        category: formData.category,
        theme: formData.theme,
        updated_at: new Date().toISOString(),
      }

      // Si cambió el nombre del negocio, generar nuevo slug
      if (formData.business_name !== (businessProfile.business_name || businessProfile.name)) {
        const newSlug = await generateUniqueSlug(formData.business_name, supabase, businessProfile.id)
        updateData = { ...updateData, slug: newSlug } as any
      }

      const { error } = await supabase
        .from('stores')
        .update(updateData)
        .eq('id', businessProfile.id)

      if (error) {
        console.error('Error updating store:', error)
        toast.error(`Error al actualizar la tienda: ${error.message}`)
        return
      }

      // Actualizar estado local
      setOriginalLogoUrl(logoUrl)
      setLogoFile(null)

      toast.success('Tienda actualizada exitosamente')
      setIsEditing(false)
      onUpdate() // Recargar datos del dashboard
    } catch (error) {
      console.error('Error updating store:', error)
      toast.error('Error inesperado al actualizar la tienda')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // Restaurar datos originales
    setFormData({
      business_name: businessProfile.business_name || businessProfile.name || '',
      owner: businessProfile.owner || '',
      email: businessProfile.email || '',
      phone: businessProfile.phone || '',
      address: businessProfile.address || '',
      city: businessProfile.city || '',
      description: businessProfile.description || '',
      website: businessProfile.website || '',
      logo_url: businessProfile.logo_url || '',
      category: businessProfile.category || '',
      theme: businessProfile.theme || 'modern',
    })
    setLogoPreview(businessProfile.logo_url)
    setLogoFile(null)
    setIsEditing(false)
  }

  if (!isEditing) {
    // Vista de solo lectura
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden border">
              <img
                src={businessProfile.logo_url || "/placeholder.svg?height=64&width=64&text=Logo"}
                alt="Logo de la tienda"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{businessProfile.business_name || businessProfile.name}</h3>
              <p className="text-gray-600">{businessProfile.category}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary">
                  Plan {businessProfile.plan}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  Tema: {themeLabels[businessProfile.theme as Theme] || 'Moderno'}
                </Badge>
              </div>
            </div>
          </div>
          <Button onClick={() => setIsEditing(true)} variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Editar Tienda
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Propietario</Label>
              <p className="mt-1">{businessProfile.owner || 'No especificado'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Email</Label>
              <p className="mt-1">{businessProfile.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Teléfono</Label>
              <p className="mt-1">{businessProfile.phone || 'No especificado'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Sitio Web</Label>
              <p className="mt-1">{businessProfile.website || 'No especificado'}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Ciudad</Label>
              <p className="mt-1">{businessProfile.city || 'No especificada'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Dirección</Label>
              <p className="mt-1">{businessProfile.address || 'No especificada'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Descripción</Label>
              <p className="mt-1">{businessProfile.description || 'Sin descripción'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">URL de la tienda</Label>
              <p className="mt-1 text-blue-600">/store/{businessProfile.slug}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Vista de edición
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna izquierda */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="business_name">Nombre del Negocio *</Label>
            <Input
              id="business_name"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="owner">Propietario *</Label>
            <Input
              id="owner"
              name="owner"
              value={formData.owner}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Ej: +52 55 1234 5678"
            />
          </div>

          <div>
            <Label htmlFor="website">Sitio Web</Label>
            <Input
              id="website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="https://mi-sitio.com"
            />
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="category">Categoría *</Label>
            <Select onValueChange={(value) => handleSelectChange("category", value)} value={formData.category}>
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

          <div>
            <Label>Tema de la Tienda</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {(Object.keys(themes) as Theme[]).map((themeKey) => (
                <div
                  key={themeKey}
                  className={`
                    relative cursor-pointer rounded-lg border-2 p-2 flex items-center gap-3 transition-all
                    ${formData.theme === themeKey ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                  `}
                  onClick={() => handleSelectChange("theme", themeKey)}
                >
                  <div className={`w-8 h-8 rounded-full ${themes[themeKey].primary} shadow-sm`} />
                  <span className="text-sm font-medium text-gray-700">{themeLabels[themeKey].split(' ')[0]}</span>
                  {formData.theme === themeKey && (
                    <div className="absolute top-2 right-2 text-blue-600">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
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

          <div>
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Calle, número, colonia"
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
              rows={3}
              placeholder="Describe tu negocio..."
            />
          </div>

          {/* Logo Upload */}
          <div>
            <Label>Logo del Negocio</Label>
            <div className="flex items-center space-x-4 mt-2">
              {logoPreview ? (
                <div className="relative">
                  <img src={logoPreview} alt="Logo preview" className="w-16 h-16 object-cover rounded-lg border" />
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
                <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
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
                  disabled={isLoading}
                />
                <Label htmlFor="logo" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild disabled={isLoading}>
                    <span>Cambiar logo</span>
                  </Button>
                </Label>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG hasta 5MB</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isUploading ? 'Subiendo logo...' : 'Guardando...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
