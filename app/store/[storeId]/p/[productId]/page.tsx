"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  Loader2,
  ShoppingCart,
  ArrowLeft,
  Store as StoreIcon,
  Minus,
  Plus,
  Share2,
  Check,
  Truck,
  Shield,
  Sun,
  Moon
} from "lucide-react"
import { useCart } from "@/lib/store/useCart"
import { toast } from "sonner"
import Link from "next/link"
import { useTheme } from "next-themes"
import Image from "next/image"

// Lazy load CartDrawer
const CartDrawer = dynamic(() => import("@/components/store/CartDrawer").then(mod => ({ default: mod.CartDrawer })), {
  loading: () => null,
  ssr: false
})

// Lazy load ProductReviews
const ProductReviews = dynamic(() => import("@/components/reviews/ProductReviews").then(mod => ({ default: mod.ProductReviews })), {
  loading: () => (
    <div className="animate-pulse space-y-4 py-12">
      <div className="h-8 w-32 bg-neutral-100 dark:bg-neutral-900" />
      <div className="h-40 bg-neutral-100 dark:bg-neutral-900" />
    </div>
  ),
  ssr: false
})

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { storeId, productId } = params
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const [product, setProduct] = useState<any>(null)
  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  const { addItem, items } = useCart()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // 1. Cargar datos de la tienda (por slug o id)
        let storeQuery = supabase.from('stores').select('*')

        // Determinar si storeId es un UUID o un slug
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId as string)

        if (isUuid) {
          storeQuery = storeQuery.eq('id', storeId)
        } else {
          storeQuery = storeQuery.eq('slug', storeId)
        }

        const { data: storeData, error: storeError } = await storeQuery.single()

        if (storeError) throw storeError
        setStore(storeData)

        // 2. Cargar producto
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single()

        if (productError) throw productError
        setProduct(productData)

      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Error al cargar el producto')
      } finally {
        setLoading(false)
      }
    }

    if (storeId && productId) {
      loadData()
    }
  }, [storeId, productId])

  const handleAddToCart = () => {
    if (!product || !store) return

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        storeId: storeId as string
      })
    }

    setAddedToCart(true)
    toast.success(`¡${quantity > 1 ? `${quantity}x ` : ''}${product.name} agregado al carrito!`)

    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: `Mira ${product?.name} en ${store?.business_name || store?.name}`,
          url: url
        })
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Enlace copiado')
    }
  }

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-8 w-8 text-[#BFFF00]" />
        </motion.div>
      </div>
    )
  }

  if (!product || !store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 border-2 border-black dark:border-white mx-auto mb-6 flex items-center justify-center">
            <StoreIcon className="w-10 h-10 text-black dark:text-white" />
          </div>
          <h1 className="font-display text-2xl font-black text-black dark:text-white mb-2 uppercase tracking-tight">
            Producto no encontrado
          </h1>
          <p className="font-mono text-sm text-neutral-500 dark:text-neutral-400 mb-8">
            El producto que buscas no existe o ha sido eliminado.
          </p>
          <Link href={`/store/${storeId}`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 bg-[#BFFF00] text-black font-mono font-bold text-sm uppercase tracking-wider border-2 border-black hover:bg-[#a8e600] transition-colors"
            >
              Volver a la tienda
            </motion.button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-black border-b-2 border-black dark:border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Back + Store */}
          <Link
            href={`/store/${storeId}`}
            className="flex items-center gap-3 group"
          >
            <motion.div
              whileHover={{ x: -4 }}
              className="w-10 h-10 border-2 border-black dark:border-white flex items-center justify-center group-hover:bg-[#BFFF00] group-hover:border-[#BFFF00] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-black dark:text-white group-hover:text-black" />
            </motion.div>
            <div className="hidden sm:block">
              {store.logo_url ? (
                <Image
                  src={store.logo_url}
                  alt={store.business_name || store.name}
                  width={120}
                  height={32}
                  className="h-8 w-auto object-contain dark:invert"
                />
              ) : (
                <span className="font-display font-black text-black dark:text-white uppercase tracking-tight">
                  {store.business_name || store.name}
                </span>
              )}
            </div>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            {mounted && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-10 h-10 border-2 border-black dark:border-white flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-white" />
                ) : (
                  <Moon className="w-5 h-5 text-black" />
                )}
              </motion.button>
            )}

            {/* Cart */}
            <CartDrawer />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Image Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative bg-neutral-50 dark:bg-neutral-950 border-b-2 lg:border-b-0 lg:border-r-2 border-black dark:border-white"
          >
            <div className="aspect-square relative">
              <img
                src={product.image_url || "/placeholder.svg?height=800&width=800"}
                alt={product.name}
                className="w-full h-full object-cover"
              />

              {/* Share Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                className="absolute top-4 right-4 w-12 h-12 bg-white dark:bg-black border-2 border-black dark:border-white flex items-center justify-center hover:bg-[#BFFF00] hover:border-[#BFFF00] transition-colors group"
              >
                <Share2 className="w-5 h-5 text-black dark:text-white group-hover:text-black" />
              </motion.button>

              {/* Out of Stock Overlay */}
              {!product.is_available && (
                <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center">
                  <div className="bg-black dark:bg-white px-6 py-3">
                    <span className="font-mono font-bold text-white dark:text-black uppercase tracking-wider">
                      Agotado
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Details Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-6 md:p-10 lg:p-14 flex flex-col"
          >
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6">
              {product.category && (
                <span className="font-mono text-xs uppercase tracking-wider px-3 py-1 bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800">
                  {product.category}
                </span>
              )}
            </div>

            {/* Product Name */}
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-black text-black dark:text-white uppercase tracking-tight leading-none mb-6">
              {product.name}
            </h1>

            {/* Price */}
            <div className="mb-8">
              <span className="font-display text-4xl md:text-5xl font-black text-[#BFFF00] dark:text-[#BFFF00]">
                ${product.price.toLocaleString()}
              </span>
              <span className="font-mono text-sm text-neutral-500 dark:text-neutral-400 ml-2">
                MXN
              </span>
            </div>

            {/* Description */}
            <div className="mb-10 pb-10 border-b-2 border-neutral-200 dark:border-neutral-800">
              <p className="font-mono text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {product.description || "Sin descripción disponible para este producto."}
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="p-4 border-2 border-neutral-200 dark:border-neutral-800 hover:border-[#BFFF00] transition-colors group">
                <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-3 group-hover:bg-[#BFFF00] transition-colors">
                  <Truck className="w-5 h-5 text-black dark:text-white group-hover:text-black" />
                </div>
                <h4 className="font-mono font-bold text-sm text-black dark:text-white uppercase mb-1">
                  Envío
                </h4>
                <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                  Entrega segura
                </p>
              </div>
              <div className="p-4 border-2 border-neutral-200 dark:border-neutral-800 hover:border-[#BFFF00] transition-colors group">
                <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-3 group-hover:bg-[#BFFF00] transition-colors">
                  <Shield className="w-5 h-5 text-black dark:text-white group-hover:text-black" />
                </div>
                <h4 className="font-mono font-bold text-sm text-black dark:text-white uppercase mb-1">
                  Pago Seguro
                </h4>
                <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                  MercadoPago
                </p>
              </div>
            </div>

            {/* Quantity + Add to Cart */}
            <div className="mt-auto space-y-4">
              {/* Quantity Selector */}
              {product.is_available && (
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-neutral-500 dark:text-neutral-400 uppercase">
                    Cantidad
                  </span>
                  <div className="flex items-center border-2 border-black dark:border-white">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-12 h-12 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors border-r-2 border-black dark:border-white"
                    >
                      <Minus className="w-4 h-4 text-black dark:text-white" />
                    </motion.button>
                    <span className="w-16 h-12 flex items-center justify-center font-mono font-bold text-lg text-black dark:text-white">
                      {quantity}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-12 h-12 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors border-l-2 border-black dark:border-white"
                    >
                      <Plus className="w-4 h-4 text-black dark:text-white" />
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <motion.button
                whileHover={{ scale: product.is_available ? 1.02 : 1 }}
                whileTap={{ scale: product.is_available ? 0.98 : 1 }}
                onClick={handleAddToCart}
                disabled={!product.is_available}
                className={`w-full h-16 font-mono font-bold text-base uppercase tracking-wider border-2 transition-all flex items-center justify-center gap-3 ${
                  !product.is_available
                    ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600 border-neutral-200 dark:border-neutral-800 cursor-not-allowed'
                    : addedToCart
                    ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                    : 'bg-[#BFFF00] text-black border-black hover:bg-[#a8e600]'
                }`}
              >
                <AnimatePresence mode="wait">
                  {addedToCart ? (
                    <motion.span
                      key="added"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      ¡Agregado!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="add"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {product.is_available ? 'Agregar al Carrito' : 'No Disponible'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Subtotal */}
              {product.is_available && quantity > 1 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-center"
                >
                  <span className="font-mono text-sm text-neutral-500 dark:text-neutral-400">
                    Subtotal:
                  </span>
                  <span className="font-mono text-sm font-bold text-black dark:text-white ml-2">
                    ${(product.price * quantity).toLocaleString()} MXN
                  </span>
                </motion.div>
              )}

              {/* Security Note */}
              <p className="font-mono text-xs text-center text-neutral-400 dark:text-neutral-500 flex items-center justify-center gap-2 pt-4">
                <span className="w-2 h-2 bg-[#BFFF00]"></span>
                Pago procesado de forma segura por MercadoPago
              </p>
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <div className="border-t-2 border-black dark:border-white">
          <div className="p-6 md:p-10 lg:p-14">
            <ProductReviews productId={product.id} productName={product.name} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-black dark:border-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href={`/store/${storeId}`} className="flex items-center gap-3 group">
              {store.logo_url ? (
                <Image
                  src={store.logo_url}
                  alt={store.business_name || store.name}
                  width={100}
                  height={28}
                  className="h-7 w-auto object-contain dark:invert opacity-60 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <span className="font-display font-black text-neutral-400 dark:text-neutral-600 group-hover:text-black dark:group-hover:text-white uppercase tracking-tight transition-colors">
                  {store.business_name || store.name}
                </span>
              )}
            </Link>
            <p className="font-mono text-xs text-neutral-400 dark:text-neutral-500">
              Powered by e-vendify
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
