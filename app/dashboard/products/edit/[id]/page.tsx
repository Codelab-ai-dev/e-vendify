"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowLeft, Upload, X, Save, ChevronDown, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { uploadProductImage, deleteImage, isStorageUrl } from "@/lib/storage"

const productCategories = [
  "Alimentacion y Bebidas",
  "Moda y Accesorios",
  "Tecnologia y Electronicos",
  "Salud y Belleza",
  "Hogar y Decoracion",
  "Deportes y Recreacion",
  "Libros y Educacion",
  "Arte y Manualidades",
  "Otros",
]

interface Product {
  id: string
  name: string
  price: number
  description: string | null
  category: string | null
  image_url: string | null
  is_available: boolean
  store_id: string
}

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { theme } = useTheme()
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    image_url: "",
    is_available: true,
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)

  useEffect(() => {
    const loadProduct = async () => {
      if (!authLoading && !user) {
        router.push('/login')
        return
      }

      if (user && params.id) {
        try {
          const { data: productData, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', params.id)
            .single()

          if (error) {
            console.error('Error al cargar producto:', error)
            toast.error('Producto no encontrado')
            router.push('/dashboard')
            return
          }

          // Verify product belongs to user's store
          const { data: storeData } = await supabase
            .from('stores')
            .select('id')
            .eq('user_id', user.id)
            .single()

          if (!storeData || productData.store_id !== storeData.id) {
            toast.error('No tienes permiso para editar este producto')
            router.push('/dashboard')
            return
          }

          setProduct(productData)
          setFormData({
            name: productData.name,
            price: productData.price.toString(),
            description: productData.description || "",
            category: productData.category || "",
            image_url: productData.image_url || "",
            is_available: productData.is_available,
          })
          setImagePreview(productData.image_url)
          setOriginalImageUrl(productData.image_url)
        } catch (error) {
          console.error('Error inesperado:', error)
          toast.error('Error al cargar el producto')
          router.push('/dashboard')
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadProduct()
  }, [user, authLoading, params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!product) return

    if (!formData.name.trim() || !formData.price) {
      toast.error('Por favor completa los campos obligatorios')
      return
    }

    setIsSaving(true)

    try {
      let imageUrl: string | null = formData.image_url || null

      // Subir nueva imagen si hay archivo seleccionado
      if (imageFile && user) {
        setIsUploading(true)
        const uploadResult = await uploadProductImage(imageFile, user.id)
        setIsUploading(false)

        if (!uploadResult.success) {
          toast.error(uploadResult.error || 'Error al subir la imagen')
          setIsSaving(false)
          return
        }

        imageUrl = uploadResult.url || null

        // Eliminar imagen anterior si era del storage
        if (originalImageUrl && isStorageUrl(originalImageUrl)) {
          await deleteImage(originalImageUrl, user.id)
        }
      }

      // Si se elimino la imagen (imagePreview es null pero habia imagen original)
      if (!imagePreview && originalImageUrl && isStorageUrl(originalImageUrl) && user) {
        await deleteImage(originalImageUrl, user.id)
        imageUrl = null
      }

      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price),
          category: formData.category || null,
          image_url: imageUrl,
          is_available: formData.is_available,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id)

      if (error) {
        console.error('Error al actualizar producto:', error)
        toast.error(`Error al actualizar: ${error.message}`)
        return
      }

      toast.success('Producto actualizado')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error inesperado:', error)
      toast.error('Error inesperado al actualizar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!product) return

    if (!confirm('¿Estas seguro de eliminar este producto? Esta accion no se puede deshacer.')) {
      return
    }

    setIsSaving(true)

    try {
      // Eliminar imagen del storage si existe
      if (originalImageUrl && isStorageUrl(originalImageUrl) && user) {
        await deleteImage(originalImageUrl, user.id)
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)

      if (error) {
        console.error('Error al eliminar producto:', error)
        toast.error(`Error al eliminar: ${error.message}`)
        return
      }

      // Update product count
      await supabase
        .from('stores')
        .update({
          products_count: supabase.rpc('decrement_products_count'),
          updated_at: new Date().toISOString()
        })
        .eq('id', product.store_id)

      toast.success('Producto eliminado')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error inesperado:', error)
      toast.error('Error inesperado al eliminar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setImageFile(file)

      // Mostrar preview local
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setImageFile(null)
    setFormData({ ...formData, image_url: "" })
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-foreground border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-mono text-sm">Cargando producto...</p>
        </div>
      </div>
    )
  }

  if (!user || !product) {
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b-2 border-border sticky top-0 z-50 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm">Dashboard</span>
              </Link>
              <div className="hidden sm:block w-px h-6 bg-border" />
              <Link href="/" className="hidden sm:block">
                <Image
                  src={theme === 'dark' ? '/e-logo-oscuro.png' : '/logo-ev-claro.png'}
                  alt="e-vendify"
                  width={120}
                  height={35}
                  className={theme === 'dark' ? 'h-8 w-auto' : 'h-6 w-auto'}
                />
              </Link>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="px-4 py-2 border-2 border-border text-sm inline-flex items-center gap-2 hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Eliminar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Title */}
          <div className="mb-8">
            <span className="label-mono mb-2 block">Editar producto</span>
            <h1 className="font-display font-bold text-3xl sm:text-4xl">
              {product.name}
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Image Upload */}
            <div className="space-y-3">
              <label className="text-sm font-medium block">
                Imagen del producto
              </label>
              {imagePreview ? (
                <div className="relative border-2 border-border">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 w-10 h-10 bg-background border-2 border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="image-upload"
                  className="block border-2 border-dashed border-border p-8 hover:border-foreground transition-colors cursor-pointer group"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 border-2 border-border flex items-center justify-center mx-auto mb-4 group-hover:border-primary transition-colors">
                      <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="font-medium mb-1">Subir imagen</p>
                    <p className="text-sm text-muted-foreground">PNG, JPG hasta 10MB</p>
                  </div>
                  <input
                    id="image-upload"
                    name="image-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center justify-between p-4 border-2 border-border">
              <div>
                <p className="font-medium">Disponibilidad</p>
                <p className="text-sm text-muted-foreground">
                  {formData.is_available ? 'Visible en tu tienda' : 'Oculto de tu tienda'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_available: !formData.is_available })}
                className={`w-14 h-8 relative transition-colors ${
                  formData.is_available ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-background border-2 border-border transition-all ${
                    formData.is_available ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Name */}
            <div className="space-y-3">
              <label htmlFor="name" className="text-sm font-medium block">
                Nombre del producto *
              </label>
              <div className={`border-2 transition-colors ${focusedField === 'name' ? 'border-primary' : 'border-border'}`}>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Ej: Pan integral artesanal"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="w-full px-4 py-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* Price */}
            <div className="space-y-3">
              <label htmlFor="price" className="text-sm font-medium block">
                Precio (MXN) *
              </label>
              <div className={`border-2 transition-colors flex ${focusedField === 'price' ? 'border-primary' : 'border-border'}`}>
                <div className="px-4 py-4 bg-muted border-r-2 border-inherit font-mono font-bold">
                  $
                </div>
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('price')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="flex-1 px-4 py-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-3">
              <label className="text-sm font-medium block">
                Categoria
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCategoryOpen(!categoryOpen)}
                  className={`w-full border-2 px-4 py-4 text-left flex items-center justify-between transition-colors ${
                    categoryOpen ? 'border-primary' : 'border-border'
                  }`}
                >
                  <span className={formData.category ? 'text-foreground' : 'text-muted-foreground'}>
                    {formData.category || 'Selecciona una categoria'}
                  </span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${categoryOpen ? 'rotate-180' : ''}`} />
                </button>

                {categoryOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-10 w-full mt-1 border-2 border-border bg-background max-h-64 overflow-auto"
                  >
                    {productCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, category })
                          setCategoryOpen(false)
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-muted transition-colors ${
                          formData.category === category ? 'bg-primary text-primary-foreground' : ''
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label htmlFor="description" className="text-sm font-medium block">
                Descripcion
              </label>
              <div className={`border-2 transition-colors ${focusedField === 'description' ? 'border-primary' : 'border-border'}`}>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Describe tu producto, ingredientes, caracteristicas especiales..."
                  rows={5}
                  value={formData.description}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('description')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t-2 border-border">
              <Link
                href="/dashboard"
                className="flex-1 sm:flex-none px-8 py-4 border-2 border-border text-center font-medium hover:border-foreground transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 btn-brutal py-4 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin" />
                    {isUploading ? 'Subiendo imagen...' : 'Guardando...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <Link href="/">
              <Image
                src={theme === 'dark' ? '/e-logo-oscuro.png' : '/logo-ev-claro.png'}
                alt="e-vendify"
                width={100}
                height={30}
                className={theme === 'dark' ? 'h-6 w-auto opacity-60 hover:opacity-100 transition-opacity' : 'h-5 w-auto opacity-60 hover:opacity-100 transition-opacity'}
              />
            </Link>
            <span className="font-mono text-xs">2025 e-vendify</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
