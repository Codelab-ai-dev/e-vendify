"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Package, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function CheckoutSuccessPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const storeId = params.storeId as string
  const orderId = searchParams.get('order_id')

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando tu pago...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">
              Pago Exitoso
            </CardTitle>
            <CardDescription>
              Tu pedido ha sido procesado correctamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {orderId && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Numero de Orden</p>
                <p className="font-mono font-medium text-gray-900">
                  {orderId.slice(0, 8).toUpperCase()}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg text-left">
              <Package className="h-8 w-8 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900">Preparando tu pedido</p>
                <p className="text-sm text-blue-700">
                  Recibiras un email con los detalles de envio
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Link href={`/store/${storeId}`}>
                <Button className="w-full" variant="outline">
                  Volver a la tienda
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
