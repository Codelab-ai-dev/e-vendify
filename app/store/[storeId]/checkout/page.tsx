"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { ArrowLeft, ShieldCheck, CreditCard, AlertTriangle, Package, Truck, MapPin } from "lucide-react"
import { useCart } from "@/lib/store/useCart"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

// Load map component dynamically to avoid SSR issues
const AddressMap = dynamic(
  () => import("@/components/store/AddressMap").then(mod => ({ default: mod.AddressMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[250px] border-2 border-border bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-foreground border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
    )
  }
)

export const dynamic_config = 'force-dynamic'

export default function CheckoutPage() {
  const params = useParams()
  const storeId = params.storeId as string

  const { items, total, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [store, setStore] = useState<{ id: string; name: string; business_name?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('delivery')

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    lat: 0,
    lng: 0
  })

  useEffect(() => {
    const loadStore = async () => {
      try {
        let storeQuery = supabase.from('stores').select('id, name, business_name')
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId)

        if (isUuid) {
          storeQuery = storeQuery.eq('id', storeId)
        } else {
          storeQuery = storeQuery.eq('slug', storeId)
        }

        const { data, error } = await storeQuery.single()
        if (error) throw error
        setStore(data)
      } catch (error) {
        console.error('Error loading store:', error)
      }
    }

    if (storeId) loadStore()
  }, [storeId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError(null)
  }

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    setFormData({
      ...formData,
      address: location.address,
      lat: location.lat,
      lng: location.lng
    })
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (items.length === 0) {
      toast.error("Tu carrito esta vacio")
      return
    }

    if (!store?.id) {
      toast.error("Error: Tienda no encontrada")
      return
    }

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Por favor completa los campos obligatorios")
      return
    }

    if (deliveryMethod === 'delivery' && !formData.address.trim()) {
      toast.error("Por favor selecciona una direccion de entrega")
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          store_id: store.id,
          customer: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone || undefined,
            address: deliveryMethod === 'delivery' ? formData.address : 'Recoger en tienda',
            notes: formData.notes || undefined,
            delivery_location: deliveryMethod === 'delivery' && formData.lat ? {
              lat: formData.lat,
              lng: formData.lng
            } : undefined
          },
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          delivery_method: deliveryMethod
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el pago')
      }

      if (data.success && data.payment_url) {
        sessionStorage.setItem('pendingOrderId', data.order_id)
        clearCart()
        toast.success("Redirigiendo a MercadoPago...")
        window.location.href = data.payment_url
      } else {
        throw new Error('No se recibio URL de pago')
      }

    } catch (error) {
      console.error("Error en pago:", error)
      setError(error instanceof Error ? error.message : 'Error al procesar el pago')
      toast.error("Error al procesar el pago")
    } finally {
      setLoading(false)
    }
  }

  if (!store && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-foreground border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-mono text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b-2 border-border sticky top-0 z-50 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link
              href={`/store/${storeId}`}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm">Volver a la tienda</span>
            </Link>
            <span className="font-display font-bold">{store?.business_name || store?.name}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <span className="label-mono mb-2 block">Checkout</span>
          <h1 className="font-display font-bold text-3xl sm:text-4xl">Finalizar compra</h1>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-red-500 bg-red-500/10 p-4 mb-8 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column: Form */}
          <div className="lg:col-span-3 space-y-6">
            <form id="checkout-form" onSubmit={handlePayment} className="space-y-6">
              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="border-2 border-border p-6"
              >
                <h2 className="font-display font-bold text-xl mb-6">Informacion de contacto</h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium block">
                      Nombre completo *
                    </label>
                    <div className={`border-2 transition-colors ${focusedField === 'name' ? 'border-primary' : 'border-border'}`}>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        placeholder="Juan Perez"
                        value={formData.name}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        disabled={loading}
                        className="w-full px-4 py-3 bg-transparent focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium block">
                        Email *
                      </label>
                      <div className={`border-2 transition-colors ${focusedField === 'email' ? 'border-primary' : 'border-border'}`}>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          placeholder="juan@ejemplo.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField(null)}
                          disabled={loading}
                          className="w-full px-4 py-3 bg-transparent focus:outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium block">
                        Telefono / WhatsApp
                      </label>
                      <div className={`border-2 transition-colors ${focusedField === 'phone' ? 'border-primary' : 'border-border'}`}>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+52 55 1234 5678"
                          value={formData.phone}
                          onChange={handleInputChange}
                          onFocus={() => setFocusedField('phone')}
                          onBlur={() => setFocusedField(null)}
                          disabled={loading}
                          className="w-full px-4 py-3 bg-transparent focus:outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Delivery Method */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="border-2 border-border p-6"
              >
                <h2 className="font-display font-bold text-xl mb-6">Metodo de entrega</h2>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('delivery')}
                    className={`p-4 border-2 text-left transition-colors ${
                      deliveryMethod === 'delivery'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-foreground'
                    }`}
                  >
                    <Truck className={`w-6 h-6 mb-2 ${deliveryMethod === 'delivery' ? 'text-primary' : ''}`} />
                    <p className="font-display font-bold">Envio a domicilio</p>
                    <p className="text-sm text-muted-foreground">Recibe en tu ubicacion</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`p-4 border-2 text-left transition-colors ${
                      deliveryMethod === 'pickup'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-foreground'
                    }`}
                  >
                    <Package className={`w-6 h-6 mb-2 ${deliveryMethod === 'pickup' ? 'text-primary' : ''}`} />
                    <p className="font-display font-bold">Recoger en tienda</p>
                    <p className="text-sm text-muted-foreground">Pasa por tu pedido</p>
                  </button>
                </div>

                {deliveryMethod === 'delivery' && (
                  <div className="space-y-4">
                    <AddressMap onLocationSelect={handleLocationSelect} />

                    {formData.address && (
                      <div className="border-2 border-primary p-4 flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Direccion seleccionada</p>
                          <p className="text-sm text-muted-foreground">{formData.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Notes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="border-2 border-border p-6"
              >
                <h2 className="font-display font-bold text-xl mb-6">Notas adicionales</h2>

                <div className={`border-2 transition-colors ${focusedField === 'notes' ? 'border-primary' : 'border-border'}`}>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    placeholder="Instrucciones especiales para la entrega..."
                    value={formData.notes}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('notes')}
                    onBlur={() => setFocusedField(null)}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-transparent focus:outline-none resize-none disabled:opacity-50"
                  />
                </div>
              </motion.div>

              {/* Security Notice */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="border-2 border-primary p-4 flex items-start gap-3"
              >
                <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Pago seguro</p>
                  <p className="text-sm text-muted-foreground">
                    Tus datos estan protegidos. Procesamos pagos de forma segura a traves de MercadoPago.
                  </p>
                </div>
              </motion.div>
            </form>
          </div>

          {/* Right Column: Summary */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="border-2 border-border sticky top-24"
            >
              <div className="p-6 border-b-2 border-border">
                <h2 className="font-display font-bold text-xl">Resumen del pedido</h2>
                <p className="text-sm text-muted-foreground">{store?.business_name || store?.name}</p>
              </div>

              <div className="p-6 space-y-4">
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Tu carrito esta vacio</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {item.quantity} x ${item.price.toLocaleString()}
                          </p>
                        </div>
                        <span className="font-mono font-bold">
                          ${(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t-2 border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-mono">${total().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Envio</span>
                    <span className="text-primary font-medium">Gratis</span>
                  </div>
                </div>

                <div className="border-t-2 border-border pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-display font-bold text-lg">Total</span>
                    <span className="font-display font-bold text-2xl">${total().toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">MXN</p>
                </div>
              </div>

              <div className="p-6 border-t-2 border-border">
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={loading || items.length === 0}
                  className="btn-brutal w-full py-4 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      Pagar con MercadoPago
                      <CreditCard className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}
