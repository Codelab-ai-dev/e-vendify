"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useCart } from "@/lib/store/useCart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, ShieldCheck, CreditCard, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'

export default function CheckoutPage() {
    const params = useParams()
    const storeId = params.storeId as string

    const { items, total, clearCart } = useCart()
    const [loading, setLoading] = useState(false)
    const [store, setStore] = useState<{ id: string; name: string; business_name?: string } | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: ""
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
        setError(null)
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

        setLoading(true)

        try {
            // Llamar al API de checkout
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
                        address: formData.address || undefined,
                    },
                    items: items.map(item => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                    })),
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error al procesar el pago')
            }

            if (data.success && data.payment_url) {
                // Guardar orderId en sessionStorage para la pagina de exito
                sessionStorage.setItem('pendingOrderId', data.order_id)

                // Limpiar carrito antes de redirigir
                clearCart()

                toast.success("Redirigiendo a MercadoPago...")

                // Redirigir a MercadoPago
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
        return <div className="p-8 text-center">Cargando tienda...</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link
                    href={`/store/${storeId}`}
                    className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver a la tienda
                </Link>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Columna Izquierda: Formulario */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Finalizar Compra</h1>
                            <p className="text-gray-500">Completa tus datos para el envio</p>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Informacion de Contacto</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form id="checkout-form" onSubmit={handlePayment} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nombre Completo *</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            required
                                            placeholder="Juan Perez"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            placeholder="juan@ejemplo.com"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Telefono / WhatsApp</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            placeholder="+52 55 1234 5678"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Direccion de Entrega</Label>
                                        <Input
                                            id="address"
                                            name="address"
                                            placeholder="Calle Principal #123, Col. Centro"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        />
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                            <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-blue-900">Pago Seguro</h4>
                                <p className="text-sm text-blue-700">
                                    Tus datos estan protegidos. Procesamos pagos de forma segura a traves de MercadoPago.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Resumen */}
                    <div>
                        <Card className="sticky top-8">
                            <CardHeader>
                                <CardTitle>Resumen del Pedido</CardTitle>
                                <CardDescription>
                                    {store?.business_name || store?.name || "Tienda"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {items.length === 0 ? (
                                    <p className="text-center text-gray-500 py-4">Tu carrito esta vacio</p>
                                ) : (
                                    <div className="space-y-3">
                                        {items.map((item) => (
                                            <div key={item.id} className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                    {item.quantity}x {item.name}
                                                </span>
                                                <span className="font-medium">
                                                    ${(item.price * item.quantity).toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <Separator />

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span>${total().toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Envio</span>
                                        <span className="text-green-600 font-medium">Gratis</span>
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>${total().toLocaleString()} MXN</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
                                    type="submit"
                                    form="checkout-form"
                                    disabled={loading || items.length === 0}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            Pagar con MercadoPago
                                            <CreditCard className="ml-2 h-5 w-5" />
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
