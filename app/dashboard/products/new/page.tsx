"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

// Categorías de productos
const productCategories = [
  "Alimentación y Bebidas",
  "Moda y Accesorios",
  "Tecnología y Electrónicos",
  "Salud y Belleza",
  "Hogar y Decoración",
  "Deportes y Recreación",
  "Libros y Educación",
  "Arte y Manualidades",
  "Otros",
]

export default function NewProductPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    image_url: "",
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeData, setStoreData] = useState<{ id: string; plan: string; products_count: number } | null>(null)

  // Protección de ruta y obtener store_id
  useEffect(() => {
    const loadStoreData = async () => {
      if (!authLoading && !user) {
        router.push('/login')
        return
      }

      if (user) {
        try {
          // Obtener información completa de la tienda del usuario
          const { data: storeInfo, error } = await supabase
            .from('stores')
            .select('id, plan, products_count')
            .eq('user_id', user.id)
            .single()

          if (error) {
            console.error('Error al obtener store:', error)
            toast.error('Error al cargar información de la tienda')
            router.push('/dashboard')
            return
          }

          setStoreId(storeInfo.id)
          setStoreData(storeInfo)
        } catch (error) {
          console.error('Error inesperado:', error)
          toast.error('Error inesperado')
          router.push('/dashboard')
        }
      }
    }

    loadStoreData()
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!storeId || !storeData) {
      toast.error('Error: No se pudo identificar la tienda')
      return
    }

    if (!formData.name.trim() || !formData.price) {
      toast.error('Por favor completa los campos obligatorios')
      return
    }

    // Verificar límite de productos para plan básico
    if (storeData.plan === 'basic') {
      // Contar productos actuales en tiempo real
      const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId)

      if (countError) {
        console.error('Error al contar productos:', countError)
        toast.error('Error al verificar límite de productos')
        return
      }

      const currentProductCount = count || 0
      
      if (currentProductCount >= 10) {
        toast.error(
          'Has alcanzado el límite de 10 productos para el plan básico. Actualiza a plan premium para agregar más productos.',
          { duration: 5000 }
        )
        return
      }
    }

    setIsLoading(true)

    try {
      // Preparar datos del producto
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        category: formData.category || null,
        image_url: formData.image_url || null,
        store_id: storeId,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log('Guardando producto:', productData)

      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()

      if (error) {
        console.error('Error al guardar producto:', error)
        toast.error(`Error al guardar el producto: ${error.message}`)
        return
      }

      console.log('Producto guardado exitosamente:', data)
      
      // Actualizar contador de productos en la tienda
      const { error: updateError } = await supabase
        .from('stores')
        .update({ 
          products_count: (storeData.products_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId)

      if (updateError) {
        console.error('Error al actualizar contador de productos:', updateError)
        // No mostramos error al usuario ya que el producto se creó exitosamente
      }
      
      toast.success('¡Producto agregado exitosamente!')
      
      // Redirigir al dashboard después de un breve delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)

    } catch (error) {
      console.error('Error inesperado al guardar producto:', error)
      toast.error('Error inesperado al guardar el producto')
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(result)
        setFormData({ ...formData, image_url: result })
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setFormData({ ...formData, image_url: "" })
  }

  // Mostrar loading mientras se autentica
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario, no mostrar nada (se redirigirá)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al dashboard
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Agregar nuevo producto</h1>
            </div>
            {storeData && storeData.plan === 'basic' && (
              <div className="text-sm text-gray-600">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Plan Básico: {storeData.products_count || 0}/10 productos
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Información del producto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Imagen */}
              <div className="space-y-2">
                <Label>Imagen del producto</Label>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="image-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Subir imagen</span>
                          <input
                            id="image-upload"
                            name="image-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </label>
                        <p className="pl-1">o arrastra y suelta</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG hasta 10MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del producto *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Ej: Pan integral artesanal"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Precio */}
              <div className="space-y-2">
                <Label htmlFor="price">Precio *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="price"
                    name="price"
                    type="text"
                    placeholder="2500 o Precio a consultar"
                    className="pl-8"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Categoría */}
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select onValueChange={(value) => handleSelectChange("category", value)} value={formData.category}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe tu producto, ingredientes, características especiales..."
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6">
                <Link href="/dashboard">
                  <Button variant="outline" disabled={isLoading}>Cancelar</Button>
                </Link>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar producto'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
