"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, ShoppingBag, Calendar, User, MapPin } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export const dynamic = 'force-dynamic'

export default function OrdersPage() {
    const { user, loading: authLoading } = useAuth()
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadOrders = async () => {
            if (!user) return

            try {
                setLoading(true)

                // 1. Obtener la tienda del usuario
                const { data: store, error: storeError } = await supabase
                    .from('stores')
                    .select('id')
                    .eq('user_id', user.id)
                    .single()

                if (storeError) throw storeError

                // 2. Obtener pedidos de esa tienda
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
                // No mostramos error al usuario si es porque no existe la tabla (aún no ejecutaron el script)
                // toast.error('Error al cargar pedidos')
            } finally {
                setLoading(false)
            }
        }

        if (!authLoading) {
            loadOrders()
        }
    }, [user, authLoading])

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-green-100 text-green-800">Pagado</Badge>
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
            case 'shipped':
                return <Badge className="bg-blue-100 text-blue-800">Enviado</Badge>
            case 'delivered':
                return <Badge className="bg-gray-100 text-gray-800">Entregado</Badge>
            case 'cancelled':
                return <Badge variant="destructive">Cancelado</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
                <p className="text-gray-500">Gestiona las ventas de tu tienda</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Pedidos</CardTitle>
                    <CardDescription>
                        {orders.length} pedidos encontrados
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {orders.length === 0 ? (
                        <div className="text-center py-12">
                            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos aún</h3>
                            <p className="text-gray-500">
                                Cuando recibas tu primera venta, aparecerá aquí.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID Pedido</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Items</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-xs">
                                                {order.id.slice(0, 8)}...
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{order.customer_name}</span>
                                                    <span className="text-xs text-gray-500">{order.customer_email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    {format(new Date(order.created_at), "d MMM yyyy", { locale: es })}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                                            <TableCell className="font-bold">
                                                ${order.total_amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-gray-500">
                                                    {order.order_items?.length || 0} productos
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
