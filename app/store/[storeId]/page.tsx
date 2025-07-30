"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Store, MessageCircle, MapPin, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

// Tipos para TypeScript
interface Store {
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
  created_at: string
  updated_at: string
}

interface Product {
  id: string
  store_id: string
  name: string
  description?: string
  price: number
  image_url?: string
  category?: string
  is_available: boolean
  created_at: string
  updated_at: string
}

export default function StorePage() {
  const params = useParams()
  const storeSlug = params.storeId as string // Now expecting a slug instead of ID
  
  // Estados para datos de Supabase
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar datos de la tienda y productos
  useEffect(() => {
    const loadStoreData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Variables para almacenar los datos de la tienda
        let finalStoreData: Store | null = null

        // Buscar tienda por slug en la tabla stores unificada
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('slug', storeSlug)
          .eq('is_active', true)
          .single()

        if (storeError) {
          console.error('Error al cargar tienda:', storeError)
          setError('Tienda no encontrada')
          return
        }
        
        finalStoreData = storeData
        setStore(storeData)

        // Cargar productos de la tienda
        const storeId = finalStoreData?.id
        if (storeId) {
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', storeId)
            .eq('is_available', true)
            .order('created_at', { ascending: false })

          if (productsError) {
            console.error('Error al cargar productos:', productsError)
            toast.error('Error al cargar productos')
          } else {
            setProducts(productsData || [])
          }
        }
      } catch (error) {
        console.error('Error al cargar datos de la tienda:', error)
        setError('Error al cargar la tienda')
        toast.error('Error al cargar la tienda')
      } finally {
        setLoading(false)
      }
    }

    if (storeSlug) {
      loadStoreData()
    }
  }, [storeSlug])

  const handleWhatsAppOrder = (productName: string, productPrice: number) => {
    if (!store?.phone) {
      toast.error('No hay número de WhatsApp disponible')
      return
    }
    const message = `Hola! Quiero pedir: ${productName} - $${productPrice.toLocaleString()}`
    const whatsappUrl = `https://wa.me/${store.phone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  // Estados de carga y error
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando tienda...</p>
        </div>
      </div>
    )
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tienda no encontrada</h2>
          <p className="text-gray-600 mb-4">{error || 'La tienda que buscas no existe o no está disponible'}</p>
          <Button onClick={() => window.location.href = '/'}>Volver al inicio</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <img
              src={store.logo_url || "/placeholder.svg?height=80&width=80&text=Logo"}
              alt={`Logo de ${store.business_name}`}
              className="w-20 h-20 rounded-full object-cover border-4 border-blue-100"
            />
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{store.business_name}</h1>
              <p className="text-gray-600 mb-4">{store.description || 'Bienvenido a nuestra tienda'}</p>
              <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-500">
                {store.address && (
                  <div className="flex items-center justify-center sm:justify-start">
                    <MapPin className="h-4 w-4 mr-2" />
                    {store.address}
                  </div>
                )}
                {store.website && (
                  <div className="flex items-center justify-center sm:justify-start">
                    <Clock className="h-4 w-4 mr-2" />
                    Sitio web disponible
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              {store.phone && (
                <Button
                  onClick={() => window.open(`https://wa.me/${store.phone}`, "_blank")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contactar por WhatsApp
                </Button>
              )}
              <Badge variant="secondary" className="text-center">
                <Store className="h-3 w-3 mr-1" />
                Tienda Online
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nuestros Productos</h2>
          <p className="text-gray-600">Descubre nuestra selección de productos frescos y artesanales</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Próximamente productos disponibles</h3>
            <p className="text-gray-500">Estamos preparando nuestro catálogo para ti</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product: Product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={product.image_url || "/placeholder.svg?height=300&width=300&text=Producto"}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description || 'Producto disponible'}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-green-600">${product.price.toLocaleString()}</div>
                    <Button
                      onClick={() => handleWhatsAppOrder(product.name, product.price)}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Pedir por WhatsApp
                    </Button>
                  </div>
                  {product.category && (
                    <Badge variant="outline" className="mt-2">
                      {product.category}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Tienda digital creada con <span className="font-semibold text-blue-600">MiKioskoDigital</span>
            </p>
            <p className="text-gray-400 text-xs mt-2">Crea tu propia tienda digital en minutos</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
