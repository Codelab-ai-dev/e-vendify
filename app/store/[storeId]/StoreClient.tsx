"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import dynamic from "next/dynamic"
import { Store, MessageCircle, MapPin, Clock, Loader2, ShoppingCart, ExternalLink, Search, Filter, Star, ChevronRight, TrendingUp, Package, Palette, X, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Link from "next/link"
import { useCart } from "@/lib/store/useCart"
import { motion, AnimatePresence } from "framer-motion"
import { themes, Theme } from "@/lib/themes"
import { useTheme } from "next-themes"

// Lazy load CartDrawer - solo se carga cuando el usuario lo necesita
const CartDrawer = dynamic(() => import("@/components/store/CartDrawer").then(mod => ({ default: mod.CartDrawer })), {
  loading: () => null, // No mostrar loader, el drawer aparece instantáneamente
  ssr: false // No renderizar en servidor
})

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

    const [store, setStore] = useState<Store | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [scrolled, setScrolled] = useState(false)
    const [previewTheme, setPreviewTheme] = useState<Theme | null>(null)
    const [showThemeSwitcher, setShowThemeSwitcher] = useState(false)

    const { addItem } = useCart()
    const { theme: mode, setTheme: setMode } = useTheme()

    const currentTheme = previewTheme ? themes[previewTheme] : (store ? themes[(store.theme as Theme) || 'modern'] : themes.modern)

    // Scroll detection
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

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

    // Filtrado de productos
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
        toast.success(`¡${product.name} agregado!`)
    }

    const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[]

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center"
                >
                    <div className="relative">
                        <div className="h-16 w-16 rounded-xl bg-blue-600 animate-pulse"></div>
                        <div className="absolute inset-0 h-16 w-16 rounded-xl bg-blue-400 blur-xl opacity-50 animate-pulse"></div>
                    </div>
                    <p className="mt-6 text-gray-600 font-medium tracking-wide">Cargando tienda...</p>
                </motion.div>
            </div>
        )
    }

    if (error || !store) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                    <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Tienda no disponible</h2>
                    <p className="text-gray-500 mb-6">Lo sentimos, la tienda que buscas no está disponible en este momento.</p>
                    <Button onClick={() => window.location.href = '/'} className="w-full rounded-xl h-12">
                        Volver al inicio
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 ${currentTheme.background}`}>
            {/* Navbar Estructurada */}
            <motion.header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                    ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm py-3'
                    : 'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    <Link href={`/store/${storeSlug}`} className="flex items-center gap-3 group">
                        <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <img
                                src={store.logo_url || "/placeholder.svg?height=48&width=48&text=S"}
                                alt={store.business_name || "Store"}
                                className="w-10 h-10 object-cover"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-white leading-tight">
                                {store.business_name}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                En línea
                            </span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-3">
                        <CartDrawer />
                    </div>
                </div>
            </motion.header>

            <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-4">
                {/* Hero Card - Full Width */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden relative"
                >
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50 dark:from-blue-900/20 to-transparent opacity-50 pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-2 mb-4">
                                <Badge variant="outline" className={`bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-2 px-3 py-1 ${currentTheme.accent.replace('text-', 'border-')} ${currentTheme.accent}`}>
                                    <Star className={`w-3 h-3 mr-1 ${currentTheme.accent.replace('text-', 'fill-')}`} />
                                    Tienda Destacada
                                </Badge>
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
                                {store.business_name}
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                                {store.description || 'Bienvenido a nuestra tienda digital. Calidad y servicio garantizados en cada pedido.'}
                            </p>

                            <div className="flex flex-wrap gap-3">
                                {store.phone && (
                                    <Button
                                        onClick={() => window.open(`https://wa.me/${store.phone}`, "_blank")}
                                        className={`${currentTheme.primary} hover:opacity-90 ${currentTheme.primaryForeground} rounded-xl px-6 h-11 shadow-lg shadow-gray-900/20 transition-transform active:scale-95`}
                                    >
                                        <MessageCircle className="mr-2 h-4 w-4" />
                                        WhatsApp
                                    </Button>
                                )}
                                {store.website && (
                                    <Button
                                        variant="outline"
                                        className="rounded-xl px-6 h-11 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                                        onClick={() => window.open(store.website!, "_blank")}
                                    >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Sitio Web
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Info Cards Side */}
                        <div className="hidden md:flex flex-col gap-3 min-w-[240px]">
                            {store.address && (
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl flex items-center gap-3 border border-gray-100 dark:border-gray-700">
                                    <div className="bg-white dark:bg-gray-700 p-2 rounded-lg shadow-sm">
                                        <MapPin className={`h-4 w-4 ${currentTheme.accent}`} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Ubicación</span>
                                        <span className="text-sm text-gray-900 dark:text-white font-semibold truncate max-w-[180px]">{store.address}</span>
                                    </div>
                                </div>
                            )}
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl flex items-center gap-3 border border-gray-100 dark:border-gray-700">
                                <div className="bg-white dark:bg-gray-700 p-2 rounded-lg shadow-sm">
                                    <Clock className={`h-4 w-4 ${currentTheme.accent}`} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Horario</span>
                                    <span className="text-sm text-gray-900 dark:text-white font-semibold">Abierto 24/7</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Barra de Herramientas Horizontal (Fina y Alargada) */}
                <div className="sticky top-20 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center gap-2 justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar producto..."
                            className="pl-9 h-10 bg-gray-50 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-900 focus:border-gray-200 dark:focus:border-gray-700 transition-all rounded-xl text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {categories.length > 0 && (
                        <div className="flex gap-1 overflow-x-auto w-full md:w-auto no-scrollbar pb-1 md:pb-0">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${selectedCategory === null
                                    ? `${currentTheme.primary} ${currentTheme.primaryForeground} border-transparent`
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                Todo
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${selectedCategory === cat
                                        ? `${currentTheme.primary} ${currentTheme.primaryForeground} border-transparent`
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Grid de Productos */}
                <div className="w-full">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Package className={`w-5 h-5 ${currentTheme.accent}`} />
                            Catálogo
                            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">({filteredProducts.length} productos)</span>
                        </h2>
                    </div>

                    <AnimatePresence mode="popLayout">
                        {filteredProducts.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-200 dark:border-gray-800 border-dashed"
                            >
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-800 mb-4">
                                    <Search className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No se encontraron productos</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">Intenta ajustar tu búsqueda o los filtros seleccionados.</p>
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
                                        <Card className="group h-full border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
                                            <Link href={`/store/${storeSlug}/p/${product.id}`}>
                                                <div className="aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                                                    <img
                                                        src={product.image_url || "/placeholder.svg?height=400&width=400&text=Producto"}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                    {!product.is_available && (
                                                        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center">
                                                            <Badge variant="destructive" className="font-bold text-sm px-3 py-1">
                                                                Agotado
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>

                                            <CardContent className="p-5">
                                                <div className="mb-3">
                                                    {product.category && (
                                                        <span className={`text-xs font-semibold uppercase tracking-wider mb-1 block ${currentTheme.accent}`}>
                                                            {product.category}
                                                        </span>
                                                    )}
                                                    <Link href={`/store/${storeSlug}/p/${product.id}`}>
                                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                                                            {product.name}
                                                        </h3>
                                                    </Link>
                                                </div>

                                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-5 line-clamp-2 h-10">
                                                    {product.description || 'Sin descripción disponible.'}
                                                </p>

                                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-gray-400 font-medium">Precio</span>
                                                        <span className={`text-xl font-bold ${currentTheme.text}`}>
                                                            ${product.price.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        onClick={() => handleAddToCart(product)}
                                                        disabled={!product.is_available}
                                                        size="sm"
                                                        className={`rounded-xl px-5 h-10 font-medium shadow-md transition-all active:scale-95 border-0 ${!product.is_available
                                                            ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400'
                                                            : `${currentTheme.primary} hover:opacity-90 ${currentTheme.primaryForeground}`
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

            {/* Floating Theme Switcher */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
                <AnimatePresence>
                    {showThemeSwitcher && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white p-4 rounded-2xl shadow-2xl border border-gray-200 mb-2 w-64"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-gray-900 text-sm">Personalizar Tema</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowThemeSwitcher(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {(Object.keys(themes) as Theme[]).map((themeKey) => (
                                    <button
                                        key={themeKey}
                                        onClick={() => setPreviewTheme(themeKey)}
                                        className={`
                      flex items-center gap-2 p-2 rounded-lg border transition-all text-left
                      ${(previewTheme || store?.theme || 'modern') === themeKey
                                                ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                    `}
                                    >
                                        <div className={`w-4 h-4 rounded-full ${themes[themeKey].primary}`} />
                                        <span className="text-xs font-medium text-gray-700 capitalize">{themeKey}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Modo Oscuro</span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-full"
                                        onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
                                    >
                                        {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            {previewTheme && previewTheme !== store?.theme && (
                                <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                                    <p className="text-xs text-gray-500 mb-2">Vista previa activada</p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full h-8 text-xs"
                                        onClick={() => setPreviewTheme(null)}
                                    >
                                        Restaurar original
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <Button
                    onClick={() => setShowThemeSwitcher(!showThemeSwitcher)}
                    className="h-12 w-12 rounded-full shadow-xl bg-gray-900 text-white hover:bg-gray-800 hover:scale-105 transition-all"
                >
                    <Palette className="h-5 w-5" />
                </Button>
            </div>

            {/* Footer */}
            <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-12 py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className={`p-2 ${currentTheme.accent.replace('text-', 'bg-')}/10 rounded-lg`}>
                            <Store className={`h-5 w-5 ${currentTheme.accent}`} />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white text-lg">{store.business_name}</span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        &copy; {new Date().getFullYear()} Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    )
}
