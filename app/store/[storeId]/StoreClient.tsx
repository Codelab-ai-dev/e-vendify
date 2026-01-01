"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import dynamic from "next/dynamic"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Store, MessageCircle, MapPin, Clock, ShoppingCart, ExternalLink, Search, Package, X, Moon, Sun, Bot } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useCart } from "@/lib/store/useCart"
import { useTheme } from "next-themes"

const CartDrawer = dynamic(() => import("@/components/store/CartDrawer").then(mod => ({ default: mod.CartDrawer })), {
  loading: () => null,
  ssr: false
})

// Numero de WhatsApp del agente (Twilio) - sin el +
const AGENT_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER?.replace('+', '') || '13854549920'

interface StoreData {
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
  theme: string
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
  whatsapp_code: string | null
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

export default function StoreClient() {
  const params = useParams()
  const storeSlug = params.storeId as string
  const { theme, setTheme } = useTheme()

  const [store, setStore] = useState<StoreData | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchFocused, setSearchFocused] = useState(false)

  const { addItem, items } = useCart()

  const cartItemCount = items.filter(item => item.storeId === storeSlug).reduce((acc, item) => acc + item.quantity, 0)

  useEffect(() => {
    const loadStoreData = async () => {
      try {
        setLoading(true)
        setError(null)

        let query = supabase
          .from('stores')
          .select('*')
          .eq('is_active', true)

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeSlug)

        if (isUuid) {
          query = query.eq('id', storeSlug)
        } else {
          query = query.eq('slug', storeSlug)
        }

        const { data: storeData, error: storeError } = await query.single()

        if (storeError) {
          console.error('Error al cargar tienda:', storeError)
          setError('Tienda no encontrada')
          return
        }

        setStore(storeData)

        if (storeData?.id) {
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', storeData.id)
            .eq('is_available', true)
            .order('created_at', { ascending: false })

          if (productsError) {
            console.error('Error al cargar productos:', productsError)
            toast.error('Error al cargar productos')
          } else {
            setProducts(productsData || [])
            setFilteredProducts(productsData || [])
          }
        }
      } catch (error) {
        console.error('Error al cargar datos:', error)
        setError('Error al cargar la tienda')
      } finally {
        setLoading(false)
      }
    }

    if (storeSlug) {
      loadStoreData()
    }
  }, [storeSlug])

  useEffect(() => {
    let result = products

    if (searchTerm) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory)
    }

    setFilteredProducts(result)
  }, [searchTerm, selectedCategory, products])

  const handleAddToCart = (product: Product) => {
    if (!store) return
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      storeId: storeSlug
    })
    toast.success(`${product.name} agregado al carrito`)
  }

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[]

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-foreground border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-mono text-sm">Cargando tienda...</p>
        </div>
      </div>
    )
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 border-2 border-border flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-display font-bold text-2xl mb-2">Tienda no disponible</h2>
          <p className="text-muted-foreground mb-8">La tienda que buscas no esta disponible en este momento.</p>
          <Link href="/" className="btn-brutal px-8 py-4 inline-flex items-center justify-center">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b-2 border-border sticky top-0 z-50 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Store info */}
            <Link href={`/store/${storeSlug}`} className="flex items-center gap-3 group">
              <div className="w-10 h-10 border-2 border-border overflow-hidden flex-shrink-0">
                {store.logo_url ? (
                  <img
                    src={store.logo_url}
                    alt={store.business_name || "Store"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center">
                    <span className="font-display font-bold text-primary-foreground">
                      {store.business_name?.charAt(0) || 'T'}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h1 className="font-display font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                  {store.business_name}
                </h1>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="w-1.5 h-1.5 bg-primary" />
                  <span>En linea</span>
                </div>
              </div>
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-10 h-10 border-2 border-border flex items-center justify-center hover:border-foreground transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <CartDrawer />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-2 border-border p-6 sm:p-10 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-8 justify-between">
            <div className="max-w-2xl">
              <span className="label-mono mb-4 block">Tienda</span>
              <h2 className="font-display font-bold text-4xl sm:text-5xl mb-4">
                {store.business_name}
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {store.description || 'Bienvenido a nuestra tienda digital. Calidad y servicio garantizados.'}
              </p>

              <div className="flex flex-wrap gap-3">
                {/* Boton para hablar con el agente IA */}
                {store.whatsapp_code && (
                  <a
                    href={`https://wa.me/${AGENT_WHATSAPP_NUMBER}?text=${store.whatsapp_code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-brutal px-6 py-3 inline-flex items-center gap-2"
                  >
                    <Bot className="w-4 h-4" />
                    Asistente IA
                  </a>
                )}
                {/* Boton para hablar directo con el vendedor */}
                {store.phone && (
                  <a
                    href={`https://wa.me/${store.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 border-2 border-border inline-flex items-center gap-2 hover:border-foreground transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contactar vendedor
                  </a>
                )}
                {store.website && (
                  <a
                    href={store.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 border-2 border-border inline-flex items-center gap-2 hover:border-foreground transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Sitio Web
                  </a>
                )}
              </div>
            </div>

            {/* Info cards */}
            <div className="flex flex-col gap-3 lg:min-w-[240px]">
              {store.address && (
                <div className="border-2 border-border p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-mono">Ubicacion</span>
                    <p className="font-medium text-sm">{store.address}</p>
                  </div>
                </div>
              )}
              <div className="border-2 border-border p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-muted flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-mono">Horario</span>
                  <p className="font-medium text-sm">Abierto 24/7</p>
                </div>
              </div>
              <div className="border-2 border-primary p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-mono">Productos</span>
                  <p className="font-display font-bold text-lg">{products.length}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Search & Filters */}
        <div className="sticky top-16 z-40 bg-background py-4 border-b-2 border-border mb-8 -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className={`flex-1 border-2 transition-colors flex items-center ${searchFocused ? 'border-primary' : 'border-border'}`}>
              <div className="px-4">
                <Search className="w-5 h-5 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="flex-1 py-3 pr-4 bg-transparent focus:outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-4 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-3 border-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === null
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-foreground'
                  }`}
                >
                  Todo
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-3 border-2 text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-foreground'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Products */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-2xl flex items-center gap-3">
              <Package className="w-6 h-6 text-primary" />
              Catalogo
            </h3>
            <span className="font-mono text-sm text-muted-foreground">
              {filteredProducts.length} productos
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            {filteredProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border-2 border-dashed border-border p-12 text-center"
              >
                <div className="w-16 h-16 border-2 border-border flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="font-display font-bold text-xl mb-2">No se encontraron productos</h4>
                <p className="text-muted-foreground mb-6">Intenta ajustar tu busqueda o los filtros.</p>
                <button
                  onClick={() => { setSearchTerm(''); setSelectedCategory(null) }}
                  className="btn-brutal-outline px-6 py-3"
                >
                  Limpiar filtros
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-2 border-border group hover:border-foreground transition-colors"
                  >
                    <Link href={`/store/${storeSlug}/p/${product.id}`}>
                      <div className="aspect-square overflow-hidden bg-muted relative">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                        {!product.is_available && (
                          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                            <span className="px-3 py-1 bg-foreground text-background text-sm font-bold">
                              Agotado
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="p-4">
                      {product.category && (
                        <span className="label-mono text-primary mb-2 block">
                          {product.category}
                        </span>
                      )}
                      <Link href={`/store/${storeSlug}/p/${product.id}`}>
                        <h4 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
                          {product.name}
                        </h4>
                      </Link>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 h-10">
                        {product.description || 'Sin descripcion disponible.'}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t-2 border-border">
                        <div>
                          <span className="text-xs text-muted-foreground font-mono">Precio</span>
                          <p className="font-display font-bold text-xl">
                            ${product.price.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={!product.is_available}
                          className={`px-4 py-2 border-2 inline-flex items-center gap-2 text-sm font-medium transition-colors ${
                            !product.is_available
                              ? 'border-muted text-muted-foreground cursor-not-allowed'
                              : 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                          }`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Agregar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border-2 border-border overflow-hidden">
                {store.logo_url ? (
                  <img
                    src={store.logo_url}
                    alt={store.business_name || "Store"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center">
                    <span className="font-display font-bold text-primary-foreground">
                      {store.business_name?.charAt(0) || 'T'}
                    </span>
                  </div>
                )}
              </div>
              <span className="font-display font-bold">{store.business_name}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-mono">{new Date().getFullYear()}</span>
              <span>Powered by</span>
              <Link href="/" className="font-medium text-foreground hover:text-primary transition-colors">
                e-vendify
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
