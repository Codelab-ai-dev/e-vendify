"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ShoppingCart, MapPin, Clock, Search, Package, ArrowLeft, X, Plus, Minus, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Demo data
const demoStores = [
  {
    id: "demo-1",
    name: "Panaderia Artesanal",
    description: "Panaderia tradicional con mas de 20 años de experiencia en productos artesanales",
    city: "Ciudad de Mexico",
    category: "Alimentacion",
    logo_url: "/tienda_pan.png",
  },
  {
    id: "demo-2",
    name: "TechStore Digital",
    description: "Tu tienda de tecnologia de confianza con los mejores precios y garantia",
    city: "Guadalajara",
    category: "Tecnologia",
    logo_url: "/tech-store.png",
  },
  {
    id: "demo-3",
    name: "Moda Bella",
    description: "Ropa y accesorios de moda para toda la familia con estilo y calidad",
    city: "Monterrey",
    category: "Moda",
    logo_url: "/moda.png",
  }
]

const demoProducts: { [key: string]: Array<{
  id: string
  name: string
  price: number
  description: string
  category: string
  image_url: string
  is_available: boolean
}> } = {
  "demo-1": [
    { id: "prod-1", name: "Pan Integral Artesanal", price: 45, description: "Pan integral hecho con masa madre natural", category: "Panes", image_url: "/pan.png", is_available: true },
    { id: "prod-2", name: "Croissant de Mantequilla", price: 25, description: "Croissant frances con mantequilla de primera", category: "Reposteria", image_url: "/criossant.png", is_available: true },
    { id: "prod-3", name: "Torta de Chocolate", price: 350, description: "Torta humeda con cobertura de ganache", category: "Tortas", image_url: "/choco.png", is_available: true },
    { id: "prod-4", name: "Empanadas de Pollo", price: 18, description: "Empanadas caseras rellenas de pollo", category: "Salados", image_url: "/empanada.png", is_available: true }
  ],
  "demo-2": [
    { id: "prod-5", name: "Smartphone Pro Max", price: 15999, description: "Camara 108MP, 256GB, 5G", category: "Smartphones", image_url: "/promax.png", is_available: true },
    { id: "prod-6", name: "Laptop Gaming RGB", price: 25500, description: "RTX 4060, 16GB RAM, SSD 1TB", category: "Computadoras", image_url: "/rgb.png", is_available: true },
    { id: "prod-7", name: "Audifonos Inalambricos", price: 1299, description: "Bluetooth, cancelacion de ruido, 30h bateria", category: "Audio", image_url: "/audifonos.png", is_available: false }
  ],
  "demo-3": [
    { id: "prod-8", name: "Vestido Elegante", price: 899, description: "Para ocasiones especiales, varios colores", category: "Vestidos", image_url: "/vestido.png", is_available: true },
    { id: "prod-9", name: "Zapatos Casuales", price: 1250, description: "Comodos para uso diario, piel genuina", category: "Calzado", image_url: "/zapatos.png", is_available: true },
    { id: "prod-10", name: "Bolsa de Mano", price: 650, description: "Elegante, perfecta para cualquier outfit", category: "Accesorios", image_url: "/bolsa.png", is_available: true }
  ]
}

export default function DemoPage() {
  const [selectedStore, setSelectedStore] = useState(demoStores[0])
  const [cart, setCart] = useState<{ [key: string]: number }>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [focusedSearch, setFocusedSearch] = useState(false)

  const currentProducts = demoProducts[selectedStore.id] || []
  const categories = Array.from(new Set(currentProducts.map(p => p.category)))

  const filteredProducts = currentProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true
    return matchesSearch && matchesCategory
  })

  const handleStoreChange = (storeId: string) => {
    const store = demoStores.find(s => s.id === storeId)
    if (store) {
      setSelectedStore(store)
      setCart({})
      setSearchTerm("")
      setSelectedCategory(null)
    }
  }

  const addToCart = (productId: string) => {
    setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }))
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      const newQty = (prev[productId] || 0) + delta
      if (newQty <= 0) {
        const { [productId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [productId]: newQty }
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const { [productId]: _, ...rest } = prev
      return rest
    })
  }

  const cartItems = Object.entries(cart)
  const cartTotal = cartItems.reduce((total, [id, qty]) => {
    const product = currentProducts.find(p => p.id === id)
    return total + (product ? product.price * qty : 0)
  }, 0)
  const cartCount = cartItems.reduce((total, [_, qty]) => total + qty, 0)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Demo bar */}
      <div className="bg-foreground text-background px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-mono font-bold">
            DEMO
          </span>
          <span className="text-sm text-background/60 hidden sm:inline">
            Simulacion interactiva de tienda
          </span>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedStore.id}
            onChange={(e) => handleStoreChange(e.target.value)}
            className="bg-background/10 border-0 text-background text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {demoStores.map(s => (
              <option key={s.id} value={s.id} className="bg-foreground">{s.name}</option>
            ))}
          </select>
          <Link href="/" className="text-sm text-background/60 hover:text-background transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </Link>
        </div>
      </div>

      {/* Store header */}
      <header className="border-b border-border bg-background sticky top-12 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-muted border-2 border-border flex items-center justify-center overflow-hidden">
              {selectedStore.logo_url ? (
                <img src={selectedStore.logo_url} alt={selectedStore.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display font-bold text-lg">{selectedStore.name[0]}</span>
              )}
            </div>
            <div>
              <h1 className="font-display font-bold text-lg">{selectedStore.name}</h1>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                En linea
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-3 border-2 border-border hover:border-foreground transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Store info */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <span className="label-mono mb-4 block">{selectedStore.category}</span>
              <h2 className="heading-lg text-4xl sm:text-5xl mb-6">{selectedStore.name}</h2>
              <p className="text-muted-foreground text-lg max-w-xl mb-8">
                {selectedStore.description}
              </p>
              <Link href="/register" className="btn-brutal inline-flex items-center gap-2">
                Crear mi tienda
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              <div className="p-4 border-2 border-border flex items-center gap-4">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Ubicacion</p>
                  <p className="font-medium">{selectedStore.city}</p>
                </div>
              </div>
              <div className="p-4 border-2 border-border flex items-center gap-4">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Horario</p>
                  <p className="font-medium">Abierto 24/7</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Filters */}
        <section className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className={`relative w-full sm:w-80 border-2 transition-colors ${focusedSearch ? 'border-primary' : 'border-border'}`}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setFocusedSearch(true)}
              onBlur={() => setFocusedSearch(false)}
              className="w-full pl-11 pr-4 py-3 bg-transparent focus:outline-none"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-2 transition-colors ${
                selectedCategory === null
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-transparent border-border hover:border-foreground'
              }`}
            >
              Todo
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-2 transition-colors ${
                  selectedCategory === cat
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-transparent border-border hover:border-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Products */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <Package className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold text-xl">Catalogo</h3>
            <span className="text-sm text-muted-foreground">({filteredProducts.length})</span>
          </div>

          <AnimatePresence mode="popLayout">
            {filteredProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border-2 border-dashed border-border p-12 text-center"
              >
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-display font-bold text-lg mb-2">No se encontraron productos</p>
                <p className="text-muted-foreground mb-6">Intenta ajustar tu busqueda o filtros</p>
                <button
                  onClick={() => { setSearchTerm(""); setSelectedCategory(null) }}
                  className="btn-brutal-outline px-6 py-2"
                >
                  Limpiar filtros
                </button>
              </motion.div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-2 border-border p-6 group bg-background"
                  >
                    <div className="aspect-square bg-muted mb-4 overflow-hidden relative">
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {!product.is_available && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <span className="px-3 py-1 bg-foreground text-background text-xs font-bold">AGOTADO</span>
                        </div>
                      )}
                    </div>

                    <span className="label-mono text-primary block mb-2">{product.category}</span>
                    <h4 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div>
                        <span className="text-xs text-muted-foreground block">Precio</span>
                        <span className="font-display font-bold text-xl">${product.price.toLocaleString()}</span>
                      </div>
                      <button
                        onClick={() => addToCart(product.id)}
                        disabled={!product.is_available}
                        className={`p-3 border-2 transition-colors ${
                          product.is_available
                            ? 'border-foreground hover:bg-foreground hover:text-background'
                            : 'border-border text-muted-foreground cursor-not-allowed'
                        }`}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Cart drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-foreground/50 z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-background z-50 flex flex-col border-l-2 border-border"
            >
              {/* Cart header */}
              <div className="p-6 border-b-2 border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5" />
                  <h3 className="font-display font-bold text-xl">Tu Carrito</h3>
                  <span className="px-2 py-0.5 bg-muted text-xs font-mono">{cartCount}</span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart items */}
              <div className="flex-1 overflow-y-auto p-6">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-muted flex items-center justify-center mb-4">
                      <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="font-display font-bold mb-2">Carrito vacio</p>
                    <p className="text-sm text-muted-foreground">Agrega algunos productos</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map(([productId, quantity]) => {
                      const product = currentProducts.find(p => p.id === productId)
                      if (!product) return null
                      return (
                        <div key={productId} className="flex gap-4 p-4 border-2 border-border">
                          <div className="w-20 h-20 bg-muted shrink-0">
                            <img
                              src={product.image_url || "/placeholder.svg"}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-display font-bold truncate">{product.name}</h4>
                            <p className="text-primary font-bold">${product.price.toLocaleString()}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => updateQuantity(productId, -1)}
                                className="w-8 h-8 border-2 border-border flex items-center justify-center hover:border-foreground transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center font-mono">{quantity}</span>
                              <button
                                onClick={() => updateQuantity(productId, 1)}
                                className="w-8 h-8 border-2 border-border flex items-center justify-center hover:border-foreground transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => removeFromCart(productId)}
                                className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
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
              </div>

              {/* Cart footer */}
              {cartItems.length > 0 && (
                <div className="p-6 border-t-2 border-border space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${cartTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Envio</span>
                      <span className="text-primary">Gratis</span>
                    </div>
                    <div className="h-px bg-border my-2" />
                    <div className="flex justify-between">
                      <span className="font-display font-bold">Total</span>
                      <span className="font-display font-bold text-xl">${cartTotal.toLocaleString()}</span>
                    </div>
                  </div>
                  <button className="btn-brutal w-full py-4 bg-primary text-primary-foreground hover:bg-primary/90">
                    Proceder al pago
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
