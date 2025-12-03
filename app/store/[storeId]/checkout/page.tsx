"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useCart } from "@/lib/store/useCart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, ArrowLeft, ShieldCheck, CreditCard } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'

export default function CheckoutPage() {
    const params = useParams()
    const router = useRouter()
    const { storeId } = params

    const { items, total, clearCart } = useCart()
    const [loading, setLoading] = useState(false)
    const [store, setStore] = useState<any>(null)

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
                let storeQuery = supabase.from('stores').select('*')
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId as string)

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
    }

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault()

        if (items.length === 0) {
            toast.error("Tu carrito está vacío")
            return
        }

        setLoading(true)

        try {
            // Simulación de proceso de pago con MercadoPago
            // Aquí iría la llamada real a tu API para crear la preferencia de pago

            await new Promise(resolve => setTimeout(resolve, 2000)) // Simular delay de red

            // En una implementación real, aquí redirigiríamos a MercadoPago
            // window.location.href = response.init_point

            // Por ahora, simulamos éxito y creamos la orden (si tuviéramos la tabla orders)
            console.log("Procesando orden:", {
                store_id: store?.id,
                customer: formData,
                items: items,
                total: total()
            })

            toast.success("¡Pedido realizado con éxito!")
            clearCart()

            // Redirigir a una página de éxito o volver a la tienda
            router.push(`/store/${storeId}?success=true`)

        } catch (error) {
            console.error("Error en pago:", error)
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Columna Izquierda: Formulario */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Finalizar Compra</h1>
                            <p className="text-gray-500">Completa tus datos para el envío</p>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Información de Contacto</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form id="checkout-form" onSubmit={handlePayment} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nombre Completo</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            required
                                            placeholder="Juan Pérez"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            placeholder="juan@ejemplo.com"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Teléfono / WhatsApp</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            required
                                            placeholder="+52 55 1234 5678"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Dirección de Entrega</Label>
                                        <Input
                                            id="address"
                                            name="address"
                                            required
                                            placeholder="Calle Principal #123, Col. Centro"
                                            value={formData.address}
                                            onChange={handleInputChange}
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
                                    Tus datos están protegidos. Procesamos pagos de forma segura a través de MercadoPago.
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
                                    {store?.business_name || "Tienda"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {items.length === 0 ? (
                                    <p className="text-center text-gray-500 py-4">Tu carrito está vacío</p>
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
                                        <span className="text-gray-600">Envío</span>
                                        <span className="text-green-600 font-medium">Gratis</span>
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>${total().toLocaleString()}</span>
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
