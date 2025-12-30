"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { XCircle, RefreshCw, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function CheckoutFailurePage() {
  const params = useParams()
  const storeId = params.storeId as string

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-700">
              Pago Rechazado
            </CardTitle>
            <CardDescription>
              No pudimos procesar tu pago
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <p className="text-sm text-gray-600">
                Esto puede deberse a:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                <li>Fondos insuficientes</li>
                <li>Datos de tarjeta incorrectos</li>
                <li>Limite de compra excedido</li>
                <li>Tarjeta bloqueada o vencida</li>
              </ul>
            </div>

            <div className="space-y-3 pt-4">
              <Link href={`/store/${storeId}/checkout`}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Intentar de nuevo
                </Button>
              </Link>
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
