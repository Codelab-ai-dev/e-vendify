"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Store, ShoppingCart, Star, MapPin, Clock, Phone, Heart, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// Datos ficticios para la demo (protege la privacidad de clientes reales)
const demoStores = [
  {
    id: "demo-1",
    name: "Panadería Artesanal",
    business_name: "Panadería Artesanal",
    description: "Panadería tradicional con más de 20 años de experiencia en productos artesanales",
    address: "Calle Principal 123, Centro",
    phone: "+52 55 1234 5678",
    city: "Ciudad de México",
    category: "Alimentación y Bebidas",
    logo_url: "/tienda_pan.png",
    slug: "panaderia-artesanal"
  },
  {
    id: "demo-2",
    name: "TechStore Digital",
    business_name: "TechStore Digital",
    description: "Tu tienda de tecnología de confianza con los mejores precios y garantía",
    address: "Av. Tecnológica 456, Zona Norte",
    phone: "+52 55 9876 5432",
    city: "Guadalajara",
    category: "Tecnología y Electrónicos",
    logo_url: "/tech-store.png",
    slug: "techstore-digital"
  },
  {
    id: "demo-3",
    name: "Moda Bella",
    business_name: "Moda Bella",
    description: "Ropa y accesorios de moda para toda la familia con estilo y calidad",
    address: "Plaza Fashion 789, Centro Comercial",
    phone: "+52 55 5555 1234",
    city: "Monterrey",
    category: "Moda y Accesorios",
    logo_url: "/moda.png",
    slug: "moda-bella"
  }
]

const demoProducts = {
  "demo-1": [
    {
      id: "prod-1",
      name: "Pan Integral Artesanal",
      price: "45",
      description: "Pan integral hecho con masa madre natural, rico en fibra y nutrientes",
      category: "Panes",
      image_url: "/pan.png",
      is_available: true,
      store_id: "demo-1"
    },
    {
      id: "prod-2",
      name: "Croissant de Mantequilla",
      price: "25",
      description: "Croissant francés con mantequilla de primera calidad, hojaldrado perfecto",
      category: "Repostería",
      image_url: "/criossant.png",
      is_available: true,
      store_id: "demo-1"
    },
    {
      id: "prod-3",
      name: "Torta de Chocolate",
      price: "350",
      description: "Torta de chocolate húmeda con cobertura de ganache, ideal para celebraciones",
      category: "Tortas",
      image_url: "/choco.png",
      is_available: true,
      store_id: "demo-1"
    },
    {
      id: "prod-4",
      name: "Empanadas de Pollo",
      price: "18",
      description: "Empanadas caseras rellenas de pollo desmenuzado con verduras",
      category: "Salados",
      image_url: "/empanada.png",
      is_available: true,
      store_id: "demo-1"
    }
  ],
  "demo-2": [
    {
      id: "prod-5",
      name: "Smartphone Pro Max",
      price: "15,999",
      description: "Último modelo con cámara de 108MP, 256GB de almacenamiento y 5G",
      category: "Smartphones",
      image_url: "/promax.png",
      is_available: true,
      store_id: "demo-2"
    },
    {
      id: "prod-6",
      name: "Laptop Gaming RGB",
      price: "25,500",
      description: "Laptop para gaming con RTX 4060, 16GB RAM, SSD 1TB y teclado RGB",
      category: "Computadoras",
      image_url: "/rgb.png",
      is_available: true,
      store_id: "demo-2"
    },
    {
      id: "prod-7",
      name: "Audífonos Inalámbricos",
      price: "1,299",
      description: "Audífonos Bluetooth con cancelación de ruido y 30h de batería",
      category: "Audio",
      image_url: "/audifonos.png",
      is_available: false,
      store_id: "demo-2"
    }
  ],
  "demo-3": [
    {
      id: "prod-8",
      name: "Vestido Elegante",
      price: "899",
      description: "Vestido elegante para ocasiones especiales, disponible en varios colores",
      category: "Vestidos",
      image_url: "/vestido.png",
      is_available: true,
      store_id: "demo-3"
    },
    {
      id: "prod-9",
      name: "Zapatos Casuales",
      price: "1,250",
      description: "Zapatos casuales cómodos para uso diario, piel genuina",
      category: "Calzado",
      image_url: "/zapatos.png",
      is_available: true,
      store_id: "demo-3"
    },
    {
      id: "prod-10",
      name: "Bolsa de Mano",
      price: "650",
      description: "Bolsa de mano elegante, perfecta para complementar cualquier outfit",
      category: "Accesorios",
      image_url: "/bolsa.png",
      is_available: true,
      store_id: "demo-3"
    }
  ]
}

// Interfaces para TypeScript
interface DemoStore {
  id: string
  name: string
  business_name: string | null
  description: string | null
  address: string | null
  phone: string | null
  city: string | null
  category: string | null
  logo_url: string | null
  slug: string
}

interface DemoProduct {
  id: string
  name: string
  price: string
  description: string | null
  category: string | null
  image_url: string | null
  is_available: boolean
  store_id: string
}

export default function DemoPage() {
  const [cart, setCart] = useState<{[key: string]: number}>({})
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [selectedStore, setSelectedStore] = useState<DemoStore>(demoStores[0])
  const [categories, setCategories] = useState<string[]>(["Todos"])

  // Obtener productos de la tienda seleccionada
  const currentProducts = demoProducts[selectedStore.id as keyof typeof demoProducts] || []
  
  // Actualizar categorías cuando cambie la tienda
  useEffect(() => {
    const uniqueCategories = ['Todos', ...new Set(
      currentProducts.map(p => p.category).filter(Boolean)
    )] as string[]
    setCategories(uniqueCategories)
  }, [selectedStore.id])

  // Función para cambiar de tienda
  const selectStore = (store: DemoStore) => {
    setSelectedStore(store)
    setCart({}) // Limpiar carrito al cambiar de tienda
    setSelectedCategory('Todos')
  }

  const addToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }))
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[productId] > 1) {
        newCart[productId]--
      } else {
        delete newCart[productId]
      }
      return newCart
    })
  }

  // Filtrar productos por categoría
  const filteredProducts = selectedCategory === "Todos" 
    ? currentProducts 
    : currentProducts.filter(product => product.category === selectedCategory)

  const cartTotal = Object.entries(cart).reduce((total, [productId, quantity]) => {
    const product = currentProducts.find(p => p.id === productId)
    return total + (product ? parseFloat(product.price.replace(',', '')) * quantity : 0)
  }, 0)

  const cartItemsCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 mr-6">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver al inicio
              </Link>
              <Badge className="bg-blue-100 text-blue-800">
                🎭 MODO DEMO
              </Badge>
            </div>
            <div className="flex items-center">
              <Button variant="outline" className="relative">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Carrito ({cartItemsCount})
                {cartItemsCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-8 text-white">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">
            🎭 Demo Interactivo - MiKiosko Digital
          </h1>
          <p className="text-blue-100 mb-4">
            Explora cómo funciona un kiosko digital real. Esta es una simulación de la "Panadería San José" 
            mostrando todas las funcionalidades de nuestra plataforma.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-white/20 text-white">✨ Catálogo interactivo</Badge>
            <Badge className="bg-white/20 text-white">🛒 Carrito de compras</Badge>
            <Badge className="bg-white/20 text-white">⭐ Sistema de calificaciones</Badge>
            <Badge className="bg-white/20 text-white">📱 Diseño responsive</Badge>
          </div>
        </div>

        {/* Store Selector */}
        {demoStores.length > 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Explorar Tiendas</CardTitle>
              <CardDescription>Selecciona una tienda para ver sus productos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {demoStores.map((store: DemoStore) => (
                  <Card 
                    key={store.id} 
                    className={`cursor-pointer transition-all ${
                      selectedStore.id === store.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => selectStore(store)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        {store.logo_url ? (
                          <img 
                            src={store.logo_url} 
                            alt={store.business_name || store.name}
                            className="w-12 h-12 object-contain rounded-lg bg-white border border-gray-200 p-1"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Store className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{store.business_name || store.name}</h3>
                          <p className="text-xs text-gray-500">{store.category || 'Tienda'}</p>
                          <p className="text-xs text-gray-400">{store.city}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Store Header */}
        {selectedStore && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-1/3">
                  {selectedStore.logo_url ? (
                    <img 
                      src={selectedStore.logo_url} 
                      alt={selectedStore.business_name || selectedStore.name}
                      className="w-full h-48 object-contain rounded-lg bg-white border border-gray-200 p-4"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Store className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedStore.business_name || selectedStore.name}
                      </h2>
                      <p className="text-gray-600 mb-3">
                        {selectedStore.description || 'Tienda digital con productos de calidad'}
                      </p>
                      {selectedStore.category && (
                        <Badge variant="secondary" className="mb-2">
                          {selectedStore.category}
                        </Badge>
                      )}
                    </div>
                    <Link href={`/store/${selectedStore.slug}`}>
                      <Button variant="outline" size="sm">
                        <Store className="h-4 w-4 mr-2" />
                        Ver Tienda
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {selectedStore.address && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {selectedStore.address}
                      </div>
                    )}
                    {selectedStore.city && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {selectedStore.city}
                      </div>
                    )}
                    {selectedStore.phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {selectedStore.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Categorías</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cart Summary */}
            {cartItemsCount > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Resumen del Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(cart).map(([productId, quantity]) => {
                      const product = currentProducts.find((p: DemoProduct) => p.id === productId)
                      if (!product) return null
                      return (
                        <div key={productId} className="flex justify-between items-center text-sm">
                          <span className="truncate">{product.name}</span>
                          <span>{quantity}x</span>
                        </div>
                      )
                    })}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>${cartTotal.toLocaleString()}</span>
                    </div>
                    <Button className="w-full">
                      Proceder al Pago
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content - Products */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">
                {selectedCategory === "Todos" ? "Todos los productos" : selectedCategory}
              </h3>
              <span className="text-gray-500">
                {filteredProducts.length} productos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product: DemoProduct) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img 
                      src={product.image_url || "/placeholder.svg?height=200&width=300&text=Producto"} 
                      alt={product.name}
                      className="w-full h-48 object-contain bg-white border-b border-gray-200 p-2"
                    />
                    {!product.is_available && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive">No disponible</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-lg">{product.name}</h4>
                      {product.category && (
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{product.description || 'Sin descripción'}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-blue-600">
                        ${parseFloat(product.price).toLocaleString()}
                      </span>
                      {product.is_available ? (
                        <div className="flex items-center gap-2">
                          {cart[product.id] ? (
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => removeFromCart(product.id)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="font-semibold">{cart[product.id]}</span>
                              <Button 
                                size="sm"
                                onClick={() => addToCart(product.id)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              size="sm"
                              onClick={() => addToCart(product.id)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button size="sm" disabled>
                          No disponible
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Demo Footer */}
        <div className="mt-12 bg-white rounded-lg p-6 border-2 border-dashed border-blue-200">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-3">¿Te gusta lo que ves?</h3>
            <p className="text-gray-600 mb-4">
              Esta es solo una muestra de lo que puedes crear con MiKiosko Digital. 
              Personaliza tu tienda, agrega tus productos y comienza a vender en línea.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Crear mi Kiosko Gratis
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline">
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
