"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShoppingBag,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  Package,
  ChevronDown,
  ChevronUp,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  MessageSquare,
  ExternalLink,
  Copy,
  Check
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useTheme } from "next-themes"

export const dynamic = 'force-dynamic'

interface Order {
  id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  customer_address?: string
  customer_notes?: string
  delivery_method?: string
  delivery_location?: { lat: number; lng: number }
  status: string
  total_amount: number
  created_at: string
  order_items: {
    id: string
    product_name: string
    quantity: number
    unit_price?: number
    price?: number
  }[]
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: 'Pendiente', icon: Clock, color: 'border-yellow-500 bg-yellow-500/10 text-yellow-600' },
  paid: { label: 'Pagado', icon: CheckCircle, color: 'border-green-500 bg-green-500/10 text-green-600' },
  shipped: { label: 'Enviado', icon: Truck, color: 'border-blue-500 bg-blue-500/10 text-blue-600' },
  delivered: { label: 'Entregado', icon: Package, color: 'border-primary bg-primary/10 text-primary' },
  cancelled: { label: 'Cancelado', icon: XCircle, color: 'border-red-500 bg-red-500/10 text-red-600' }
}

export default function OrdersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { theme } = useTheme()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return

      try {
        setLoading(true)

        const { data: store, error: storeError } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (storeError) throw storeError

        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .eq('store_id', store.id)
          .order('created_at', { ascending: false })

        if (ordersError) throw ordersError

        setOrders(ordersData || [])
      } catch (error) {
        console.error('Error loading orders:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadOrders()
    }
  }, [user, authLoading])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (error) throw error

      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      toast.success(`Estado actualizado a: ${statusConfig[newStatus]?.label || newStatus}`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Error al actualizar estado')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const openInMaps = (address: string, location?: { lat: number; lng: number }) => {
    if (location && location.lat && location.lng) {
      window.open(`https://www.google.com/maps?q=${location.lat},${location.lng}`, '_blank')
    } else {
      window.open(`https://www.google.com/maps/search/${encodeURIComponent(address)}`, '_blank')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-foreground border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-mono text-sm">Cargando pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b-2 border-border sticky top-0 z-50 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm">Dashboard</span>
              </Link>
              <div className="hidden sm:block w-px h-6 bg-border" />
              <Link href="/" className="hidden sm:block">
                <Image
                  src={theme === 'dark' ? '/e-logo-oscuro.png' : '/logo-ev-claro.png'}
                  alt="e-vendify"
                  width={120}
                  height={35}
                  className={theme === 'dark' ? 'h-8 w-auto' : 'h-6 w-auto'}
                />
              </Link>
            </div>
            <div className="px-3 py-1 border-2 border-border font-mono text-sm">
              {orders.length} pedidos
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <span className="label-mono mb-2 block">Ventas</span>
          <h1 className="font-display font-bold text-3xl sm:text-4xl">Pedidos</h1>
          <p className="text-muted-foreground mt-2">Gestiona las ventas de tu tienda</p>
        </motion.div>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-dashed border-border p-12 text-center"
          >
            <div className="w-20 h-20 border-2 border-border flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-display font-bold text-xl mb-2">No hay pedidos aun</h3>
            <p className="text-muted-foreground mb-6">Cuando recibas tu primera venta, aparecera aqui.</p>
            <Link href="/dashboard" className="btn-brutal px-6 py-3 inline-flex items-center gap-2">
              Volver al dashboard
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => {
              const status = statusConfig[order.status] || statusConfig.pending
              const StatusIcon = status.icon
              const isExpanded = expandedOrder === order.id

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-2 border-border"
                >
                  {/* Order Header */}
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="w-full p-4 sm:p-6 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 border-2 flex items-center justify-center flex-shrink-0 ${status.color}`}>
                          <StatusIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-display font-bold">{order.customer_name}</span>
                            <span className={`px-2 py-0.5 border-2 text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="font-mono text-xs">#{order.id.slice(0, 8)}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(order.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {order.order_items?.length || 0} productos
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-display font-bold text-xl">${order.total_amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">MXN</p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t-2 border-border p-4 sm:p-6 space-y-6">
                          {/* Customer Info */}
                          <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <h4 className="font-display font-bold flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" />
                                Informacion del cliente
                              </h4>

                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 border-2 border-border">
                                  <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">{order.customer_email}</span>
                                  </div>
                                  <button
                                    onClick={() => copyToClipboard(order.customer_email, `email-${order.id}`)}
                                    className="p-1 hover:bg-muted transition-colors"
                                  >
                                    {copiedId === `email-${order.id}` ? (
                                      <Check className="w-4 h-4 text-primary" />
                                    ) : (
                                      <Copy className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </button>
                                </div>

                                {order.customer_phone && (
                                  <div className="flex items-center justify-between p-3 border-2 border-border">
                                    <div className="flex items-center gap-3">
                                      <Phone className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm">{order.customer_phone}</span>
                                    </div>
                                    <a
                                      href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 hover:bg-muted transition-colors"
                                    >
                                      <MessageSquare className="w-4 h-4 text-primary" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h4 className="font-display font-bold flex items-center gap-2">
                                <Truck className="w-4 h-4 text-primary" />
                                Entrega
                                {order.delivery_method && (
                                  <span className="text-xs font-mono text-muted-foreground">
                                    ({order.delivery_method === 'pickup' ? 'Recoger' : 'Envio'})
                                  </span>
                                )}
                              </h4>

                              {order.customer_address && (
                                <div className="p-3 border-2 border-border">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                                      <span className="text-sm">{order.customer_address}</span>
                                    </div>
                                    <button
                                      onClick={() => openInMaps(order.customer_address!, order.delivery_location)}
                                      className="p-1 hover:bg-muted transition-colors flex-shrink-0"
                                    >
                                      <ExternalLink className="w-4 h-4 text-primary" />
                                    </button>
                                  </div>
                                </div>
                              )}

                              {order.customer_notes && (
                                <div className="p-3 border-2 border-border bg-muted/50">
                                  <p className="text-xs text-muted-foreground mb-1">Notas:</p>
                                  <p className="text-sm">{order.customer_notes}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Order Items */}
                          <div className="space-y-4">
                            <h4 className="font-display font-bold flex items-center gap-2">
                              <Package className="w-4 h-4 text-primary" />
                              Productos
                            </h4>

                            <div className="border-2 border-border divide-y-2 divide-border">
                              {order.order_items?.map((item) => {
                                const itemPrice = item.unit_price ?? item.price ?? 0
                                return (
                                  <div key={item.id} className="p-3 flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-sm">{item.product_name}</p>
                                      <p className="text-xs text-muted-foreground font-mono">
                                        {item.quantity} x ${itemPrice.toLocaleString()}
                                      </p>
                                    </div>
                                    <span className="font-mono font-bold">
                                      ${(item.quantity * itemPrice).toLocaleString()}
                                    </span>
                                  </div>
                                )
                              })}
                              <div className="p-3 flex items-center justify-between bg-muted/50">
                                <span className="font-display font-bold">Total</span>
                                <span className="font-display font-bold text-lg">
                                  ${order.total_amount.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Status Update */}
                          <div className="space-y-4">
                            <h4 className="font-display font-bold">Actualizar estado</h4>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(statusConfig).map(([key, config]) => {
                                const Icon = config.icon
                                const isActive = order.status === key
                                const isLoading = updatingStatus === order.id

                                return (
                                  <button
                                    key={key}
                                    onClick={() => !isActive && updateOrderStatus(order.id, key)}
                                    disabled={isActive || isLoading}
                                    className={`px-4 py-2 border-2 text-sm font-medium inline-flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                      isActive ? config.color : 'border-border hover:border-foreground'
                                    }`}
                                  >
                                    <Icon className="w-4 h-4" />
                                    {config.label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
