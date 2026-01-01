"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { Plus, Edit, Trash2, Eye, LogOut, Package, ShoppingBag, DollarSign, Menu, X, Settings, ClipboardList, BarChart3, Star, Boxes } from "lucide-react"
import { supabase, isAdmin } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

// Lazy load heavy components
const StoreSettingsForm = dynamic(() => import("@/components/StoreSettingsForm"), {
  loading: () => (
    <div className="border-2 border-border p-8 animate-pulse">
      <div className="h-8 w-64 bg-muted mb-4" />
      <div className="space-y-4">
        <div className="h-12 w-full bg-muted" />
        <div className="h-12 w-full bg-muted" />
        <div className="h-24 w-full bg-muted" />
      </div>
    </div>
  ),
  ssr: false
})

const OnboardingChecklist = dynamic(() => import("@/components/dashboard/OnboardingChecklist"), {
  loading: () => (
    <div className="border-2 border-primary p-6 animate-pulse">
      <div className="h-6 w-48 bg-muted mb-4" />
      <div className="h-16 w-full bg-muted" />
    </div>
  ),
  ssr: false
})

const AnalyticsDashboard = dynamic(() => import("@/components/dashboard/AnalyticsDashboard").then(mod => ({ default: mod.AnalyticsDashboard })), {
  loading: () => (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-muted border-2 border-border" />
        ))}
      </div>
      <div className="h-64 bg-muted border-2 border-border" />
    </div>
  ),
  ssr: false
})

const ReviewsManager = dynamic(() => import("@/components/dashboard/ReviewsManager").then(mod => ({ default: mod.ReviewsManager })), {
  loading: () => (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-40 bg-muted border-2 border-border" />
      ))}
    </div>
  ),
  ssr: false
})

const InventoryManager = dynamic(() => import("@/components/dashboard/InventoryManager").then(mod => ({ default: mod.InventoryManager })), {
  loading: () => (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-muted border-2 border-border" />
        ))}
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="h-20 bg-muted border-2 border-border" />
      ))}
    </div>
  ),
  ssr: false
})

const LowStockAlert = dynamic(() => import("@/components/dashboard/LowStockAlert").then(mod => ({ default: mod.LowStockAlert })), {
  loading: () => null,
  ssr: false
})

const TwoFactorSetup = dynamic(() => import("@/components/auth/TwoFactorSetup").then(mod => ({ default: mod.TwoFactorSetup })), {
  loading: () => (
    <div className="p-6 border-2 border-border animate-pulse">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-muted" />
        <div className="space-y-2">
          <div className="h-5 w-48 bg-muted" />
          <div className="h-4 w-64 bg-muted" />
        </div>
      </div>
      <div className="h-32 bg-muted" />
    </div>
  ),
  ssr: false
})

interface BusinessProfile {
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
  theme: string
  created_at: string
  updated_at: string
}

interface Product {
  id: string
  business_id: string
  name: string
  description?: string
  price: number
  image_url?: string
  category?: string
  is_available: boolean
  created_at: string
  updated_at: string
}

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'productos' | 'inventario' | 'analytics' | 'reviews' | 'configuracion'>('productos')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const loadUserData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const { isAdmin: userIsAdmin, error: adminError } = await isAdmin(user.id)

      if (adminError) {
        console.error('Error al verificar admin:', adminError)
      }

      if (userIsAdmin) {
        toast.info('Redirigiendo al dashboard de administrador...')
        router.push('/admin/dashboard')
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          await createBusinessProfile()
          return
        } else {
          setError(`Error al cargar perfil: ${profileError.message}`)
          toast.error('Error al cargar el perfil de negocio')
        }
        return
      }

      setBusinessProfile(profileData)

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', profileData.id)
        .order('created_at', { ascending: false })

      if (productsError) {
        console.error('Error al cargar productos:', productsError)
        toast.error('Error al cargar productos')
      } else {
        setProducts(productsData || [])
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error)
      setError('Error al cargar datos del usuario')
      toast.error('Error al cargar datos del usuario')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && !authLoading) {
      loadUserData()
    }
  }, [user, authLoading])

  const createBusinessProfile = async () => {
    if (!user) return

    try {
      const businessName = user.user_metadata?.business_name || 'Mi Negocio Digital'

      const { data: newProfile, error: createError } = await supabase
        .from('business_profiles')
        .insert({
          user_id: user.id,
          business_name: businessName,
          email: user.email,
          description: 'Descripcion de mi negocio digital',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        setError(`Error al crear perfil de negocio: ${createError.message}`)
        toast.error('No se pudo crear el perfil de negocio')
        return
      }

      setBusinessProfile(newProfile)
      toast.success('Perfil de negocio creado exitosamente')

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', newProfile.id)
        .order('created_at', { ascending: false })

      setProducts(productsData || [])
    } catch (error) {
      setError('Error inesperado al crear el perfil de negocio')
      toast.error('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      if (businessProfile) {
        const { error: updateError } = await supabase
          .from('stores')
          .update({
            products_count: Math.max(0, (businessProfile.products_count || 1) - 1),
            updated_at: new Date().toISOString()
          })
          .eq('id', businessProfile.id)

        if (!updateError) {
          setBusinessProfile({
            ...businessProfile,
            products_count: Math.max(0, (businessProfile.products_count || 1) - 1)
          })
        }
      }

      setProducts(products.filter(p => p.id !== productId))
      toast.success('Producto eliminado')
    } catch (error) {
      toast.error('Error al eliminar el producto')
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      toast.error('Error al cerrar sesion')
    }
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-foreground border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-mono text-sm">Verificando...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b-2 border-border h-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
            <div className="h-10 w-48 bg-muted animate-pulse" />
            <div className="h-10 w-24 bg-muted animate-pulse" />
          </div>
        </div>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="h-32 bg-muted animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-muted animate-pulse" />
            <div className="h-32 bg-muted animate-pulse" />
            <div className="h-32 bg-muted animate-pulse" />
          </div>
        </main>
      </div>
    )
  }

  if (error || !businessProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 border-2 border-border flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="font-display font-bold text-2xl mb-2">Error al cargar datos</h2>
          <p className="text-muted-foreground mb-6">{error || 'No se pudo cargar el perfil de negocio'}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-brutal px-6 py-3"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const avgPrice = products.length > 0
    ? Math.round(products.reduce((acc, p) => acc + p.price, 0) / products.length)
    : 0

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b-2 border-border sticky top-0 z-50 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo & Store Name */}
            <div className="flex items-center gap-4">
              <Link href="/">
                <Image
                  src={theme === 'dark' ? '/e-logo-oscuro.png' : '/logo-ev-claro.png'}
                  alt="e-vendify"
                  width={160}
                  height={45}
                  className={theme === 'dark' ? 'h-10 w-auto hidden sm:block' : 'h-8 w-auto hidden sm:block'}
                />
              </Link>
              <div className="hidden sm:block w-px h-8 bg-border" />
              <div>
                <h1 className="font-display font-bold text-lg sm:text-xl truncate max-w-[200px] sm:max-w-none">
                  {businessProfile.business_name || businessProfile.name}
                </h1>
                <p className="text-xs text-muted-foreground font-mono">Dashboard</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href={`/store/${businessProfile.slug || businessProfile.id}`}
                className="btn-brutal-outline px-4 py-2 text-sm inline-flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Ver tienda
              </Link>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-10 h-10 border-2 border-border flex items-center justify-center hover:border-foreground transition-colors"
              >
                {theme === 'dark' ? '○' : '●'}
              </button>
              <button
                onClick={handleLogout}
                className="w-10 h-10 border-2 border-border flex items-center justify-center hover:border-foreground hover:text-primary transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 border-2 border-border flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t-2 border-border bg-background p-4 space-y-3"
          >
            <Link
              href={`/store/${businessProfile.slug || businessProfile.id}`}
              className="btn-brutal-outline w-full py-3 inline-flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Ver tienda
            </Link>
            <div className="flex gap-3">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex-1 py-3 border-2 border-border flex items-center justify-center gap-2"
              >
                {theme === 'dark' ? '○ Claro' : '● Oscuro'}
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 border-2 border-border flex items-center justify-center gap-2 hover:border-primary hover:text-primary"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Onboarding */}
        <div className="mb-8">
          <OnboardingChecklist profile={businessProfile} productsCount={products.length} />
        </div>

        {/* Low Stock Alert */}
        <LowStockAlert
          storeId={businessProfile.id}
          onNavigateToInventory={() => setActiveTab('inventario')}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border-2 border-border p-6 hover:border-foreground transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="label-mono">Productos</span>
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div className="font-display font-bold text-4xl mb-1">{products.length}</div>
            <p className="text-sm text-muted-foreground">en tu catalogo</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border-2 border-border p-6 hover:border-foreground transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="label-mono">Precio promedio</span>
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div className="font-display font-bold text-4xl mb-1">${avgPrice.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">MXN por producto</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border-2 border-primary p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="label-mono">Estado</span>
              <div className="w-3 h-3 bg-primary animate-pulse" />
            </div>
            <div className="font-display font-bold text-4xl mb-1 text-primary">Activa</div>
            <p className="text-sm text-muted-foreground">tu tienda esta online</p>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b-2 border-border">
          <button
            onClick={() => setActiveTab('productos')}
            className={`px-6 py-4 font-medium text-sm transition-colors relative ${
              activeTab === 'productos'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Productos
            </span>
            {activeTab === 'productos' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
          <Link
            href="/dashboard/orders"
            className="px-6 py-4 font-medium text-sm transition-colors relative text-muted-foreground hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Pedidos
            </span>
          </Link>
          <button
            onClick={() => setActiveTab('inventario')}
            className={`px-6 py-4 font-medium text-sm transition-colors relative ${
              activeTab === 'inventario'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Boxes className="w-4 h-4" />
              Inventario
            </span>
            {activeTab === 'inventario' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-4 font-medium text-sm transition-colors relative ${
              activeTab === 'analytics'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </span>
            {activeTab === 'analytics' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-4 font-medium text-sm transition-colors relative ${
              activeTab === 'reviews'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Reseñas
            </span>
            {activeTab === 'reviews' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('configuracion')}
            className={`px-6 py-4 font-medium text-sm transition-colors relative ${
              activeTab === 'configuracion'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuracion
            </span>
            {activeTab === 'configuracion' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === 'productos' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="font-display font-bold text-2xl">Productos</h2>
                <p className="text-muted-foreground text-sm">Gestiona tu catalogo</p>
              </div>
              {businessProfile.plan === 'basic' && products.length >= 10 ? (
                <div className="text-right">
                  <button disabled className="btn-brutal opacity-50 cursor-not-allowed px-6 py-3">
                    <Plus className="w-4 h-4 mr-2 inline" />
                    Limite alcanzado
                  </button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Actualiza a premium para mas productos
                  </p>
                </div>
              ) : (
                <div className="text-right">
                  <Link href="/dashboard/products/new" className="btn-brutal px-6 py-3 inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Agregar producto
                  </Link>
                  {businessProfile.plan === 'basic' && (
                    <p className="text-xs text-muted-foreground mt-2 font-mono">
                      {products.length}/10 productos
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Products List */}
            {products.length === 0 ? (
              <div className="border-2 border-dashed border-border p-12 text-center">
                <div className="w-16 h-16 border-2 border-border flex items-center justify-center mx-auto mb-6">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">Sin productos</h3>
                <p className="text-muted-foreground mb-6">Agrega tu primer producto para comenzar</p>
                <Link href="/dashboard/products/new" className="btn-brutal px-6 py-3 inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Agregar primer producto
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-2 border-border p-4 hover:border-foreground transition-colors group"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {/* Image */}
                      <div className="w-20 h-20 bg-muted flex-shrink-0 overflow-hidden">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-lg truncate">{product.name}</h3>
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {product.description || 'Sin descripcion'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-primary text-primary-foreground text-sm font-mono font-bold">
                            ${product.price.toLocaleString()}
                          </span>
                          {product.category && (
                            <span className="px-3 py-1 border border-border text-sm">
                              {product.category}
                            </span>
                          )}
                          <span className={`px-3 py-1 text-sm ${
                            product.is_available
                              ? 'bg-foreground text-background'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {product.is_available ? 'Disponible' : 'No disponible'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Link
                          href={`/dashboard/products/edit/${product.id}`}
                          className="flex-1 sm:flex-none px-4 py-2 border-2 border-border hover:border-foreground transition-colors flex items-center justify-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="sm:hidden">Editar</span>
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm('¿Eliminar este producto?')) {
                              deleteProduct(product.id)
                            }
                          }}
                          className="flex-1 sm:flex-none px-4 py-2 border-2 border-border hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sm:hidden">Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventario' && businessProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <InventoryManager storeId={businessProfile.id} />
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && businessProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <AnalyticsDashboard storeId={businessProfile.id} />
          </motion.div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && businessProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ReviewsManager storeId={businessProfile.id} />
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'configuracion' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Store Settings */}
            <div>
              <div className="mb-6">
                <h2 className="font-display font-bold text-2xl">Configuracion de tienda</h2>
                <p className="text-muted-foreground text-sm">Edita la informacion de tu tienda</p>
              </div>
              <div className="border-2 border-border p-6 sm:p-8">
                <StoreSettingsForm businessProfile={businessProfile} onUpdate={loadUserData} />
              </div>
            </div>

            {/* WhatsApp Settings */}
            <div>
              <div className="mb-6">
                <h2 className="font-display font-bold text-2xl">WhatsApp</h2>
                <p className="text-muted-foreground text-sm">Conecta tu tienda con WhatsApp para atender clientes</p>
              </div>
              <div className="border-2 border-border p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Agente de WhatsApp</h3>
                      <p className="text-sm text-muted-foreground">Genera tu código QR para que los clientes se conecten</p>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/${businessProfile?.id}/whatsapp`}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Configurar WhatsApp
                  </Link>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div>
              <div className="mb-6">
                <h2 className="font-display font-bold text-2xl">Seguridad</h2>
                <p className="text-muted-foreground text-sm">Protege tu cuenta con verificacion en dos pasos</p>
              </div>
              <div className="border-2 border-border p-6 sm:p-8">
                <TwoFactorSetup />
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <Link href="/">
              <Image
                src={theme === 'dark' ? '/e-logo-oscuro.png' : '/logo-ev-claro.png'}
                alt="e-vendify"
                width={120}
                height={35}
                className={theme === 'dark' ? 'h-8 w-auto opacity-60 hover:opacity-100 transition-opacity' : 'h-6 w-auto opacity-60 hover:opacity-100 transition-opacity'}
              />
            </Link>
            <span className="font-mono text-xs">2025 e-vendify</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
