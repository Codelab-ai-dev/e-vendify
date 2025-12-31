"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle, Package, Loader2, FileText, ArrowLeft, Mail } from "lucide-react"
import { toast } from "sonner"

export default function CheckoutSuccessPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const storeId = params.storeId as string
  const orderId = searchParams.get('order_id')

  const [loading, setLoading] = useState(true)
  const [downloadingInvoice, setDownloadingInvoice] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  const downloadInvoice = async () => {
    if (!orderId) return

    setDownloadingInvoice(true)
    try {
      const response = await fetch(`/api/invoices/${orderId}`)

      if (!response.ok) {
        throw new Error('Error al descargar factura')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `factura-${orderId.slice(0, 8).toUpperCase()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Factura descargada')
    } catch (error) {
      console.error('Error downloading invoice:', error)
      toast.error('Error al descargar la factura')
    } finally {
      setDownloadingInvoice(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-[#BFFF00] mx-auto mb-4" />
          <p className="font-mono text-neutral-500">Verificando tu pago...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black py-12">
      <div className="max-w-lg mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="border-2 border-black dark:border-white"
        >
          {/* Header */}
          <div className="p-8 text-center border-b-2 border-black dark:border-white bg-[#BFFF00]">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-black mx-auto mb-4 flex items-center justify-center"
            >
              <CheckCircle className="h-10 w-10 text-[#BFFF00]" />
            </motion.div>
            <h1 className="font-display text-2xl font-black text-black uppercase tracking-tight">
              Pago Exitoso
            </h1>
            <p className="font-mono text-sm text-black/70 mt-1">
              Tu pedido ha sido procesado correctamente
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Order Number */}
            {orderId && (
              <div className="p-4 border-2 border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
                <p className="font-mono text-xs text-neutral-500 uppercase mb-1">Numero de Orden</p>
                <p className="font-mono font-bold text-lg text-black dark:text-white">
                  #{orderId.slice(0, 8).toUpperCase()}
                </p>
              </div>
            )}

            {/* Status Info */}
            <div className="flex items-start gap-4 p-4 border-2 border-[#BFFF00] bg-[#BFFF00]/10">
              <div className="w-12 h-12 bg-[#BFFF00] flex items-center justify-center flex-shrink-0">
                <Package className="h-6 w-6 text-black" />
              </div>
              <div>
                <p className="font-mono font-bold text-black dark:text-white">
                  Preparando tu pedido
                </p>
                <p className="font-mono text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Recibiras un email con los detalles de envio
                </p>
              </div>
            </div>

            {/* Email Info */}
            <div className="flex items-center gap-3 p-3 border border-neutral-200 dark:border-neutral-800">
              <Mail className="w-4 h-4 text-neutral-400" />
              <p className="font-mono text-xs text-neutral-500">
                Revisa tu bandeja de entrada para el recibo
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              {/* Download Invoice */}
              {orderId && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={downloadInvoice}
                  disabled={downloadingInvoice}
                  className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-mono font-bold text-sm uppercase tracking-wider border-2 border-black dark:border-white hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {downloadingInvoice ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Descargar Factura PDF
                    </>
                  )}
                </motion.button>
              )}

              {/* Back to Store */}
              <Link href={`/store/${storeId}`} className="block">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-transparent text-black dark:text-white font-mono font-bold text-sm uppercase tracking-wider border-2 border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver a la tienda
                </motion.button>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
            <p className="font-mono text-xs text-center text-neutral-400">
              Gracias por tu compra
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
