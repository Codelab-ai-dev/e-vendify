"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Package,
  DollarSign,
  Eye,
  ExternalLink,
  Shield,
  AlertTriangle,
  Store,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Globe,
  Tag,
  ShoppingCart,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useTheme } from "next-themes"
import { toast } from "sonner"

interface StoreData {
  id: string
  name: string
  business_name: string | null
  slug: string | null
  owner: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  category: string | null
  description: string | null
  logo_url: string | null
  status: string
  plan: string
  theme: string | null
  created_at: string
  updated_at: string
  products_count?: number
  monthly_revenue?: number
}

interface Product {
  id: string
  name: string
  price: number
  image_url: string | null
  is_available: boolean
  moderation_status: string
  category: string | null
  created_at: string
}

interface Order {
  id: string
  customer_name: string
  customer_email: string
  total_amount: number
  status: string
  created_at: string
}

export default function StoreDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { theme, setTheme } = useTheme()
  const storeId = params.storeId as string

  const [store, setStore] = useState<StoreData | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'products' | 'orders'>('info')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const loadStoreData = async () => {
      if (!storeId) return

      try {
        setLoading(true)

        // Cargar tienda
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', storeId)
          .single()

        if (storeError) throw storeError
        setStore(storeData)

        // Cargar productos
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, price, image_url, is_available, moderation_status, category, created_at')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })

        if (!productsError && productsData) {
          setProducts(productsData)
        }

        // Cargar ordenes
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, customer_name, customer_email, total_amount, status, created_at')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })
          .limit(20)

        if (!ordersError && ordersData) {
          setOrders(ordersData)
        }

      } catch (error) {
        console.error('Error loading store:', error)
        toast.error('Error al cargar la tienda')
      } finally {
        setLoading(false)
      }
    }

    loadStoreData()
  }, [storeId])

  const handleToggleStatus = async () => {
    if (!store) return

    const newStatus = store.status === 'active' ? 'inactive' : 'active'

    const { error } = await supabase
      .from('stores')
      .update({ status: newStatus })
      .eq('id', store.id)

    if (error) {
      toast.error('Error al cambiar estado')
      return
    }

    setStore({ ...store, status: newStatus })
    toast.success(`Tienda ${newStatus === 'active' ? 'activada' : 'desactivada'}`)
  }

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <span className="px-3 py-1 text-xs font-mono font-bold bg-foreground text-background">
        ACTIVA
      </span>
    ) : (
      <span className="px-3 py-1 text-xs font-mono font-bold bg-muted text-muted-foreground">
        INACTIVA
      </span>
    )
  }

  const getPlanBadge = (plan: string) => {
    return plan === 'premium' ? (
      <span className="px-3 py-1 text-xs font-mono font-bold bg-primary text-primary-foreground">
        PREMIUM
      </span>
    ) : (
      <span className="px-3 py-1 text-xs font-mono font-bold border border-border">
        BASICO
      </span>
    )
  }

  const getModerationBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-0.5 text-xs font-mono bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">Aprobado</span>
      case 'pending':
        return <span className="px-2 py-0.5 text-xs font-mono bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">Pendiente</span>
      case 'flagged':
        return <span className="px-2 py-0.5 text-xs font-mono bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">Marcado</span>
      case 'rejected':
        return <span className="px-2 py-0.5 text-xs font-mono bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">Rechazado</span>
      default:
        return <span className="px-2 py-0.5 text-xs font-mono bg-muted">{status}</span>
    }
  }

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-0.5 text-xs font-mono bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Pagado</span>
      case 'pending':
        return <span className="px-2 py-0.5 text-xs font-mono bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 flex items-center gap-1"><Clock className="w-3 h-3" /> Pendiente</span>
      case 'cancelled':
        return <span className="px-2 py-0.5 text-xs font-mono bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancelado</span>
      default:
        return <span className="px-2 py-0.5 text-xs font-mono bg-muted">{status}</span>
    }
  }

  // Calcular estadisticas
  const totalRevenue = orders
    .filter(o => o.status === 'paid')
    .reduce((sum, o) => sum + o.total_amount, 0)

  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const paidOrders = orders.filter(o => o.status === 'paid').length

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground font-mono text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Store className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="font-display font-bold text-xl mb-2">Tienda no encontrada</h2>
          <Link href="/admin/dashboard" className="btn-brutal px-6 py-2 inline-block mt-4">
            Volver al dashboard
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
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline font-mono text-sm">Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-lg hidden sm:block">Detalles de Tienda</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-10 h-10 border-2 border-border flex items-center justify-center hover:border-foreground transition-colors"
              >
                {theme === 'dark' ? '○' : '●'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Store Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-2 border-border mb-8"
        >
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo */}
              <div className="w-24 h-24 md:w-32 md:h-32 border-2 border-border flex-shrink-0 flex items-center justify-center bg-muted overflow-hidden">
                {store.logo_url ? (
                  <Image
                    src={store.logo_url}
                    alt={store.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="w-12 h-12 text-muted-foreground" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="font-display font-bold text-2xl md:text-3xl mb-2">
                      {store.business_name || store.name}
                    </h1>
                    {store.description && (
                      <p className="text-muted-foreground mb-4 max-w-xl">{store.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {getStatusBadge(store.status)}
                      {getPlanBadge(store.plan)}
                      {store.category && (
                        <span className="px-3 py-1 text-xs font-mono border border-border flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {store.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/store/${store.slug || store.id}`}
                      target="_blank"
                      className="px-4 py-2 border-2 border-border hover:border-foreground transition-colors text-sm font-mono inline-flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver tienda
                    </Link>
                    <button
                      onClick={handleToggleStatus}
                      className={`px-4 py-2 border-2 text-sm font-mono inline-flex items-center gap-2 transition-colors ${
                        store.status === 'active'
                          ? 'border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950'
                          : 'border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950'
                      }`}
                    >
                      {store.status === 'active' ? (
                        <>
                          <AlertTriangle className="w-4 h-4" />
                          Suspender
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Activar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border-2 border-border p-6 hover:border-foreground transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="label-mono text-xs uppercase tracking-wider text-muted-foreground">Productos</span>
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div className="font-display font-bold text-3xl">{products.length}</div>
            <p className="text-sm text-muted-foreground">en catalogo</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border-2 border-border p-6 hover:border-foreground transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="label-mono text-xs uppercase tracking-wider text-muted-foreground">Ordenes</span>
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div className="font-display font-bold text-3xl">{orders.length}</div>
            <p className="text-sm text-muted-foreground">{pendingOrders} pendientes</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border-2 border-primary p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="label-mono text-xs uppercase tracking-wider text-muted-foreground">Ingresos</span>
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div className="font-display font-bold text-3xl text-primary">
              ${totalRevenue.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">{paidOrders} ordenes pagadas</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="border-2 border-border p-6 hover:border-foreground transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="label-mono text-xs uppercase tracking-wider text-muted-foreground">Registro</span>
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="font-display font-bold text-lg">
              {new Date(store.created_at).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </div>
            <p className="text-sm text-muted-foreground">fecha de alta</p>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="border-2 border-border">
          {/* Tab Headers */}
          <div className="border-b-2 border-border flex">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-4 font-mono text-sm uppercase tracking-wider transition-colors ${
                activeTab === 'info'
                  ? 'bg-foreground text-background'
                  : 'hover:bg-muted'
              }`}
            >
              Informacion
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-4 font-mono text-sm uppercase tracking-wider transition-colors ${
                activeTab === 'products'
                  ? 'bg-foreground text-background'
                  : 'hover:bg-muted'
              }`}
            >
              Productos ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-4 font-mono text-sm uppercase tracking-wider transition-colors ${
                activeTab === 'orders'
                  ? 'bg-foreground text-background'
                  : 'hover:bg-muted'
              }`}
            >
              Ordenes ({orders.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Info Tab */}
            {activeTab === 'info' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Propietario */}
                <div className="border-2 border-border p-6">
                  <h3 className="font-display font-bold text-lg mb-4">Propietario</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{store.owner}</p>
                        <p className="text-sm text-muted-foreground">Nombre</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{store.email}</p>
                        <p className="text-sm text-muted-foreground">Email</p>
                      </div>
                    </div>
                    {store.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{store.phone}</p>
                          <p className="text-sm text-muted-foreground">Telefono</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tienda */}
                <div className="border-2 border-border p-6">
                  <h3 className="font-display font-bold text-lg mb-4">Tienda</h3>
                  <div className="space-y-4">
                    {store.slug && (
                      <div className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium font-mono">/store/{store.slug}</p>
                          <p className="text-sm text-muted-foreground">URL</p>
                        </div>
                      </div>
                    )}
                    {store.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{store.address}</p>
                          <p className="text-sm text-muted-foreground">Direccion</p>
                        </div>
                      </div>
                    )}
                    {store.city && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{store.city}</p>
                          <p className="text-sm text-muted-foreground">Ciudad</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">
                          {new Date(store.updated_at).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">Ultima actualizacion</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Esta tienda no tiene productos</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b-2 border-border">
                        <tr>
                          <th className="text-left p-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">Producto</th>
                          <th className="text-left p-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">Precio</th>
                          <th className="text-left p-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">Estado</th>
                          <th className="text-left p-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">Moderacion</th>
                          <th className="text-left p-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product, i) => (
                          <tr key={product.id} className="border-b border-border hover:bg-muted/20">
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 border border-border flex-shrink-0 overflow-hidden bg-muted">
                                  {product.image_url ? (
                                    <img
                                      src={product.image_url}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{product.name}</p>
                                  {product.category && (
                                    <p className="text-xs text-muted-foreground">{product.category}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="font-mono font-bold text-primary">
                                ${product.price.toLocaleString()}
                              </span>
                            </td>
                            <td className="p-3">
                              {product.is_available ? (
                                <span className="px-2 py-0.5 text-xs font-mono bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                                  Disponible
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-xs font-mono bg-muted text-muted-foreground">
                                  No disponible
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              {getModerationBadge(product.moderation_status || 'approved')}
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {new Date(product.created_at).toLocaleDateString('es-MX')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Esta tienda no tiene ordenes</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b-2 border-border">
                        <tr>
                          <th className="text-left p-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">ID</th>
                          <th className="text-left p-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">Cliente</th>
                          <th className="text-left p-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">Total</th>
                          <th className="text-left p-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">Estado</th>
                          <th className="text-left p-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-b border-border hover:bg-muted/20">
                            <td className="p-3">
                              <span className="font-mono text-sm">
                                {order.id.slice(0, 8)}...
                              </span>
                            </td>
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{order.customer_name}</p>
                                <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="font-mono font-bold text-primary">
                                ${order.total_amount.toLocaleString()}
                              </span>
                            </td>
                            <td className="p-3">
                              {getOrderStatusBadge(order.status)}
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString('es-MX', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
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
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary animate-pulse" />
              <span className="font-mono text-xs">Admin Panel</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
