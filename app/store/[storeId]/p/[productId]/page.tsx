"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ShoppingCart, ArrowLeft, Store as StoreIcon } from "lucide-react"
import { useCart } from "@/lib/store/useCart"
import { toast } from "sonner"
import Link from "next/link"
import { themes, Theme } from "@/lib/themes"
import { useTheme } from "next-themes"

// Lazy load CartDrawer
const CartDrawer = dynamic(() => import("@/components/store/CartDrawer").then(mod => ({ default: mod.CartDrawer })), {
  loading: () => null,
  ssr: false
})

export const dynamic = 'force-dynamic'

export default function ProductPage() {
    const params = useParams()
    const router = useRouter()
    const { storeId, productId } = params

    const [product, setProduct] = useState<any>(null)
    const [store, setStore] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [quantity, setQuantity] = useState(1)

    const { addItem } = useCart()
    const { theme: mode } = useTheme()

    const currentTheme = store ? themes[(store.theme as Theme) || 'modern'] : themes.modern

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

        addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            storeId: storeId as string // Usamos el parámetro de la URL para mantener la navegación consistente
        })

        toast.success(`¡${product.name} agregado al carrito!`)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!product || !store) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-950 p-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Producto no encontrado</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-6">El producto que buscas no existe o ha sido eliminado.</p>
                <Link href={`/store/${storeId}`}>
                    <Button>Volver a la tienda</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${currentTheme.background}`}>
            {/* Header de la tienda */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link
                        href={`/store/${storeId}`}
                        className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors group"
                    >
                        <div className={`p-2 rounded-full mr-3 transition-colors ${currentTheme.secondary} group-hover:bg-gray-200 dark:group-hover:bg-gray-800`}>
                            <ArrowLeft className={`h-4 w-4 ${currentTheme.accent}`} />
                        </div>
                        <span className="font-medium hidden sm:inline">Volver a {store.business_name || store.name}</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <CartDrawer />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden relative">
                    {/* Animated Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br from-gray-50/30 via-gray-100/20 to-gray-50/30 dark:from-gray-900/30 dark:via-gray-800/20 dark:to-gray-900/30 opacity-60`} />
                    <motion.div
                        className={`absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-${currentTheme.primary.split(' ')[0].split('-')[1]}-100/10 via-transparent to-transparent pointer-events-none`}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-0">
                        {/* Columna Izquierda: Imagen */}
                        <div className="p-6 md:p-10 lg:p-14 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-800 relative backdrop-blur-sm">
                            <div className="relative w-full max-w-lg aspect-square rounded-2xl overflow-hidden bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 group">
                                <img
                                    src={product.image_url || "/placeholder.svg?height=800&width=800"}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                {!product.is_available && (
                                    <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-10">
                                        <Badge variant="destructive" className="text-lg px-6 py-2 rounded-full shadow-lg">
                                            Agotado
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Columna Derecha: Detalles */}
                        <div className="p-6 md:p-10 lg:p-14 flex flex-col h-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
                                    <Link href={`/store/${storeId}`} className={`transition-colors flex items-center gap-1 hover:${currentTheme.accent.split(' ')[0]}`}>
                                        <StoreIcon className="h-3 w-3" />
                                        {store.business_name || store.name}
                                    </Link>
                                    <span>/</span>
                                    <span className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">{product.name}</span>
                                </div>

                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight leading-tight">
                                    {product.name}
                                </h1>

                                <div className="flex items-center gap-4 mb-6">
                                    <span className={`text-4xl font-bold ${currentTheme.text}`}>
                                        ${product.price.toLocaleString()}
                                    </span>
                                    {product.category && (
                                        <Badge variant="secondary" className={`text-sm px-3 py-1 ${currentTheme.secondary} ${currentTheme.accent} hover:opacity-80 border-transparent`}>
                                            {product.category}
                                        </Badge>
                                    )}
                                </div>

                                <div className="prose prose-gray dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                                    <p>{product.description || "Sin descripción disponible para este producto."}</p>
                                </div>
                            </div>

                            <div className="mt-auto space-y-6">
                                {/* Info Cards (Static for trust) */}
                                <div className="grid grid-cols-2 gap-4 py-6 border-t border-b border-gray-100 dark:border-gray-800">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${currentTheme.secondary} ${currentTheme.accent}`}>
                                            <Loader2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Envío Seguro</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Protección garantizada</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${currentTheme.secondary} ${currentTheme.accent}`}>
                                            <StoreIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Venta Directa</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Sin intermediarios</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <Button
                                        size="lg"
                                        className={`w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] ${!product.is_available
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 shadow-none cursor-not-allowed'
                                            : `${currentTheme.primary} hover:opacity-90 ${currentTheme.primaryForeground} ${currentTheme.primary.split(' ')[0].replace('bg-', 'hover:shadow-')}/25`
                                            }`}
                                        onClick={handleAddToCart}
                                        disabled={!product.is_available}
                                    >
                                        <ShoppingCart className="mr-2 h-6 w-6" />
                                        {product.is_available ? 'Agregar al Carrito' : 'No Disponible'}
                                    </Button>

                                    <p className="text-xs text-center text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        Pago procesado de forma segura por MercadoPago
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
