"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X, Package, ArrowRight } from "lucide-react"
import Link from "next/link"

interface LowStockProduct {
  id: string
  name: string
  stock_quantity: number
  low_stock_threshold: number
  image_url: string | null
}

interface LowStockAlertProps {
  storeId: string
  onNavigateToInventory?: () => void
}

export function LowStockAlert({ storeId, onNavigateToInventory }: LowStockAlertProps) {
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [outOfStockCount, setOutOfStockCount] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const [lowStockRes, statsRes] = await Promise.all([
          fetch(`/api/inventory?storeId=${storeId}&type=low_stock`),
          fetch(`/api/inventory?storeId=${storeId}&type=stats`)
        ])

        if (lowStockRes.ok) {
          const data = await lowStockRes.json()
          setLowStockProducts(data.slice(0, 5)) // Mostrar máximo 5
        }

        if (statsRes.ok) {
          const stats = await statsRes.json()
          setOutOfStockCount(stats.out_of_stock_count || 0)
        }
      } catch (error) {
        console.error('Error fetching low stock:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLowStock()
  }, [storeId])

  // No mostrar si no hay alertas o fue cerrado
  if (loading || dismissed || (lowStockProducts.length === 0 && outOfStockCount === 0)) {
    return null
  }

  const totalAlerts = lowStockProducts.length + outOfStockCount

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        className="mb-6 border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-yellow-500 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-sm text-yellow-800 dark:text-yellow-200 uppercase">
                  Alerta de inventario
                </h3>
                <p className="font-mono text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  {outOfStockCount > 0 && (
                    <span className="text-red-600 dark:text-red-400 font-bold">
                      {outOfStockCount} producto{outOfStockCount !== 1 ? 's' : ''} sin stock.{' '}
                    </span>
                  )}
                  {lowStockProducts.length > 0 && (
                    <span>
                      {lowStockProducts.length} producto{lowStockProducts.length !== 1 ? 's' : ''} con stock bajo.
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
            >
              <X className="w-4 h-4 text-yellow-700 dark:text-yellow-300" />
            </button>
          </div>

          {/* Low Stock Products Preview */}
          {lowStockProducts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-black border border-yellow-300 dark:border-yellow-700"
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-8 h-8 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
                      <Package className="w-4 h-4 text-neutral-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-mono text-xs font-bold text-black dark:text-white truncate max-w-[120px]">
                      {product.name}
                    </p>
                    <p className="font-mono text-xs text-yellow-600 dark:text-yellow-400">
                      {product.stock_quantity} unidades
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Button */}
          <div className="mt-4">
            <button
              onClick={onNavigateToInventory}
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black font-mono text-xs uppercase font-bold hover:bg-yellow-400 transition-colors"
            >
              Gestionar inventario
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
