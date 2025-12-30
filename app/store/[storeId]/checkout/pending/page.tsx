"use client"

import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Clock, Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function CheckoutPendingPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const storeId = params.storeId as string
  const orderId = searchParams.get('order_id')

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-10 w-10 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl text-yellow-700">
              Pago Pendiente
            </CardTitle>
            <CardDescription>
              Tu pago esta siendo procesado
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

            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg text-left">
              <Mail className="h-8 w-8 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-900">
                  Te notificaremos por email
                </p>
                <p className="text-sm text-yellow-700">
                  Recibiras una confirmacion cuando el pago sea acreditado
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              Los pagos con OXXO, SPEI o transferencia pueden tardar hasta 72 horas en acreditarse.
            </p>

            <div className="space-y-3 pt-4">
              <Link href={`/store/${storeId}`}>
                <Button className="w-full" variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
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
