"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Store, ShoppingCart, Star, MapPin, Clock, Phone, Search, ExternalLink, Package, ArrowLeft, MessageCircle, X, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

// Datos ficticios para la demo
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
    slug: "panaderia-artesanal",
    theme: "nature"
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
    slug: "techstore-digital",
    theme: "modern"
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
    slug: "moda-bella",
    theme: "elegant"
  }
]

const demoProducts = {
  "demo-1": [
    {
      id: "prod-1",
      name: "Pan Integral Artesanal",
      price: 45,
      description: "Pan integral hecho con masa madre natural, rico en fibra y nutrientes",
      category: "Panes",
      image_url: "/pan.png",
      is_available: true,
      store_id: "demo-1"
    },
    {
      id: "prod-2",
      name: "Croissant de Mantequilla",
      price: 25,
      description: "Croissant francés con mantequilla de primera calidad, hojaldrado perfecto",
      category: "Repostería",
      image_url: "/criossant.png",
      is_available: true,
      store_id: "demo-1"
    },
    {
      id: "prod-3",
      name: "Torta de Chocolate",
      price: 350,
      description: "Torta de chocolate húmeda con cobertura de ganache, ideal para celebraciones",
      category: "Tortas",
      image_url: "/choco.png",
      is_available: true,
      store_id: "demo-1"
    },
    {
      id: "prod-4",
      name: "Empanadas de Pollo",
      price: 18,
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
      price: 15999,
      description: "Último modelo con cámara de 108MP, 256GB de almacenamiento y 5G",
      category: "Smartphones",
      image_url: "/promax.png",
      is_available: true,
      store_id: "demo-2"
    },
    {
      id: "prod-6",
      name: "Laptop Gaming RGB",
      price: 25500,
      description: "Laptop para gaming con RTX 4060, 16GB RAM, SSD 1TB y teclado RGB",
      category: "Computadoras",
      image_url: "/rgb.png",
      is_available: true,
      store_id: "demo-2"
    },
    {
      id: "prod-7",
      name: "Audífonos Inalámbricos",
      price: 1299,
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
      price: 899,
      description: "Vestido elegante para ocasiones especiales, disponible en varios colores",
      category: "Vestidos",
      image_url: "/vestido.png",
      is_available: true,
      store_id: "demo-3"
    },
    {
      id: "prod-9",
      name: "Zapatos Casuales",
      price: 1250,
      description: "Zapatos casuales cómodos para uso diario, piel genuina",
      category: "Calzado",
      image_url: "/zapatos.png",
      is_available: true,
      store_id: "demo-3"
    },
    {
      id: "prod-10",
      name: "Bolsa de Mano",
      price: 650,
      description: "Bolsa de mano elegante, perfecta para complementar cualquier outfit",
      category: "Accesorios",
      image_url: "/bolsa.png",
      is_available: true,
      store_id: "demo-3"
    }
  ]
}

// Interfaces
interface DemoStore {
  id: string
  name: string
  business_name: string
  description: string
  address: string
  phone: string
  city: string
  category: string
  logo_url: string
  slug: string
  theme: string
}

interface DemoProduct {
  id: string
  name: string
  price: number
  description: string
  category: string
  image_url: string
  is_available: boolean
  store_id: string
}

export default function DemoPage() {
  const [selectedStore, setSelectedStore] = useState<DemoStore>(demoStores[0])
  const [cart, setCart] = useState<{ [key: string]: number }>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  const currentProducts = demoProducts[selectedStore.id as keyof typeof demoProducts] || []

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Reset state when store changes
  const handleStoreChange = (store: DemoStore) => {
    setSelectedStore(store)
    setCart({})
    setSearchTerm("")
    setSelectedCategory(null)
  }

  // Filter products
  const filteredProducts = currentProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(currentProducts.map(p => p.category)))

  // Cart functions
  const addToCart = (product: DemoProduct) => {
    setCart(prev => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1
    }))
    setIsCartOpen(true)
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev }
      delete newCart[productId]
      return newCart
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      const newQuantity = (prev[productId] || 0) + delta
      if (newQuantity <= 0) {
        const newCart = { ...prev }
        delete newCart[productId]
        return newCart
      }
      return { ...prev, [productId]: newQuantity }
    })
  }

  const cartTotal = Object.entries(cart).reduce((total, [productId, quantity]) => {
    const product = currentProducts.find(p => p.id === productId)
    return total + (product ? product.price * quantity : 0)
  }, 0)

  const cartItemsCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0)

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Demo Navigation Bar */}
      <div className="bg-blue-600 text-white px-4 py-2 text-sm flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-0">
            🎭 MODO DEMO
          </Badge>
          <span className="hidden sm:inline">Estás viendo una simulación interactiva.</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-80">Cambiar tienda:</span>
            <select
              className="bg-blue-700 border-blue-500 rounded text-xs p-1"
              value={selectedStore.id}
              onChange={(e) => {
                const store = demoStores.find(s => s.id === e.target.value)
                if (store) handleStoreChange(store)
              }}
            >
              {demoStores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <Link href="/" className="hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Salir
          </Link>
        </div>
      </div>

      {/* Store Navbar */}
      <motion.header
        className={`sticky top-9 left-0 right-0 z-40 transition-all duration-300 ${scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm py-3'
          : 'bg-white border-b border-gray-200 py-4'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-gray-100">
              {selectedStore.logo_url ? (
                <img
                  src={selectedStore.logo_url}
                  alt={selectedStore.business_name}
                  className="w-10 h-10 object-cover"
                />
              ) : (
                <Store className="w-10 h-10 p-2 text-gray-400" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 leading-tight">
                {selectedStore.business_name}
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                En línea
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative rounded-xl h-10 w-10 border-gray-200">
                  <ShoppingCart className="h-5 w-5 text-gray-600" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow-sm">
                      {cartItemsCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md flex flex-col p-0 bg-gray-50">
                <SheetHeader className="px-6 py-4 bg-white border-b border-gray-100">
                  <SheetTitle className="flex items-center gap-2 text-gray-900">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                    Tu Carrito
                    <Badge variant="secondary" className="ml-auto bg-blue-50 text-blue-700">
                      {cartItemsCount} items
                    </Badge>
                  </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 px-6 py-4">
                  {Object.keys(cart).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <ShoppingCart className="h-8 w-8 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">Tu carrito está vacío</p>
                        <p className="text-sm text-gray-500 mt-1">¡Agrega algunos productos deliciosos!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(cart).map(([productId, quantity]) => {
                        const product = currentProducts.find(p => p.id === productId)
                        if (!product) return null
                        return (
                          <div key={productId} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex gap-3">
                            <div className="h-16 w-16 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                              <img
                                src={product.image_url || "/placeholder.svg"}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900 text-sm truncate">{product.name}</h4>
                                <p className="text-blue-600 font-bold text-sm">${product.price.toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-0.5">
                                  <button
                                    onClick={() => updateQuantity(productId, -1)}
                                    className="w-6 h-6 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-600 hover:text-red-500 disabled:opacity-50"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-6 text-center text-xs font-medium text-gray-900">{quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(productId, 1)}
                                    className="w-6 h-6 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-600 hover:text-green-500"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => removeFromCart(productId)}
                                  className="text-xs text-red-500 hover:text-red-600 font-medium ml-auto"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>

                {Object.keys(cart).length > 0 && (
                  <div className="p-6 bg-white border-t border-gray-100 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-medium text-gray-900">${cartTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Envío</span>
                        <span className="text-green-600 font-medium">Gratis</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-gray-900">Total</span>
                        <span className="text-blue-600">${cartTotal.toLocaleString()}</span>
                      </div>
                    </div>
                    <Button className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 font-semibold text-base">
                      Proceder al Pago
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.header>

      <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50 to-transparent opacity-50 pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="bg-white/50 backdrop-blur-sm border-blue-200 text-blue-700 px-3 py-1">
                  <Star className="w-3 h-3 mr-1 fill-blue-700" />
                  Tienda Destacada
                </Badge>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
                {selectedStore.business_name}
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {selectedStore.description}
              </p>

              <div className="flex flex-wrap gap-3">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 h-11 shadow-lg shadow-blue-900/20">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
                <Button variant="outline" className="rounded-xl px-6 h-11 border-gray-200 bg-white hover:bg-gray-50 text-gray-700">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Sitio Web
                </Button>
              </div>
            </div>

            <div className="hidden md:flex flex-col gap-3 min-w-[240px]">
              <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-3 border border-gray-100">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-medium">Ubicación</span>
                  <span className="text-sm text-gray-900 font-semibold truncate max-w-[180px]">{selectedStore.city}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-3 border border-gray-100">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-medium">Horario</span>
                  <span className="text-sm text-gray-900 font-semibold">Abierto 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Toolbar */}
        <div className="sticky top-24 z-30 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center gap-2 justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar producto..."
              className="pl-9 h-10 bg-gray-50 border-transparent focus:bg-white focus:border-gray-200 transition-all rounded-xl text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-1 overflow-x-auto w-full md:w-auto no-scrollbar pb-1 md:pb-0">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${selectedCategory === null
                ? 'bg-blue-600 text-white border-transparent shadow-md shadow-blue-600/20'
                : 'bg-white text-gray-600 border-gray-100 hover:border-gray-300 hover:text-gray-900'
                }`}
            >
              Todo
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${selectedCategory === cat
                  ? 'bg-blue-600 text-white border-transparent shadow-md shadow-blue-600/20'
                  : 'bg-white text-gray-600 border-gray-100 hover:border-gray-300 hover:text-gray-900'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="w-full">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Catálogo
              <span className="text-sm font-normal text-gray-500 ml-2">({filteredProducts.length} productos)</span>
            </h2>
          </div>

          <AnimatePresence mode="popLayout">
            {filteredProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-3xl p-12 text-center border border-gray-200 border-dashed"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No se encontraron productos</h3>
                <p className="text-gray-500 mb-6">Intenta ajustar tu búsqueda o los filtros seleccionados.</p>
                <Button
                  variant="outline"
                  onClick={() => { setSearchTerm(""); setSelectedCategory(null) }}
                  className="rounded-xl"
                >
                  Limpiar filtros
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    layoutId={product.id}
                  >
                    <Card className="group h-full border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden bg-white">
                      <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
                        <img
                          src={product.image_url || "/placeholder.svg?height=400&width=400&text=Producto"}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        {!product.is_available && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                            <Badge variant="destructive" className="font-bold text-sm px-3 py-1">
                              Agotado
                            </Badge>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-5">
                        <div className="mb-3">
                          <span className="text-xs font-semibold uppercase tracking-wider mb-1 block text-blue-600">
                            {product.category}
                          </span>
                          <h3 className="font-bold text-lg text-gray-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                            {product.name}
                          </h3>
                        </div>

                        <p className="text-gray-500 text-sm mb-5 line-clamp-2 h-10">
                          {product.description}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400 font-medium">Precio</span>
                            <span className="text-xl font-bold text-gray-900">
                              ${product.price.toLocaleString()}
                            </span>
                          </div>
                          <Button
                            onClick={() => addToCart(product)}
                            disabled={!product.is_available}
                            size="sm"
                            className={`rounded-xl px-5 h-10 font-medium shadow-md transition-all active:scale-95 border-0 ${!product.is_available
                                ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Agregar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
