"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Clock,
  BarChart3,
  Loader2
} from "lucide-react"

interface StoreAnalytics {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  averageOrderValue: number
  revenueChange: number
  ordersChange: number
  revenueByDay: Array<{ date: string; revenue: number; orders: number }>
  topProducts: Array<{ id: string; name: string; totalSold: number; revenue: number }>
  ordersByStatus: Record<string, number>
  deliveryMethods: Record<string, number>
}

interface AnalyticsDashboardProps {
  storeId: string
}

export function AnalyticsDashboard({ storeId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<StoreAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/analytics?storeId=${storeId}&period=${period}`)
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [storeId, period])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#BFFF00]" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-20">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
        <p className="font-mono text-neutral-500">No hay datos disponibles</p>
      </div>
    )
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pendientes',
    paid: 'Pagadas',
    shipped: 'Enviadas',
    delivered: 'Entregadas',
    cancelled: 'Canceladas'
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    paid: 'bg-blue-500',
    shipped: 'bg-purple-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-red-500'
  }

  // Calcular máximo para el gráfico
  const maxRevenue = Math.max(...analytics.revenueByDay.map(d => d.revenue), 1)

  return (
    <div className="space-y-8">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-black uppercase tracking-tight text-black dark:text-white">
          Analytics
        </h2>
        <div className="flex border-2 border-black dark:border-white">
          {(['week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 font-mono text-sm uppercase transition-colors ${
                period === p
                  ? 'bg-[#BFFF00] text-black'
                  : 'bg-transparent text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {p === 'week' ? '7 días' : p === 'month' ? '30 días' : 'Año'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 border-2 border-black dark:border-white bg-white dark:bg-black"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-[#BFFF00] flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-black" />
            </div>
            {analytics.revenueChange !== 0 && (
              <div className={`flex items-center gap-1 text-sm font-mono ${
                analytics.revenueChange > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {analytics.revenueChange > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {Math.abs(analytics.revenueChange).toFixed(0)}%
              </div>
            )}
          </div>
          <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400 uppercase mb-1">
            Ingresos
          </p>
          <p className="font-display text-2xl font-black text-black dark:text-white">
            ${analytics.totalRevenue.toLocaleString()}
          </p>
        </motion.div>

        {/* Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 border-2 border-black dark:border-white bg-white dark:bg-black"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-black dark:bg-white flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white dark:text-black" />
            </div>
            {analytics.ordersChange !== 0 && (
              <div className={`flex items-center gap-1 text-sm font-mono ${
                analytics.ordersChange > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {analytics.ordersChange > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {Math.abs(analytics.ordersChange).toFixed(0)}%
              </div>
            )}
          </div>
          <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400 uppercase mb-1">
            Órdenes
          </p>
          <p className="font-display text-2xl font-black text-black dark:text-white">
            {analytics.totalOrders}
          </p>
        </motion.div>

        {/* Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 border-2 border-black dark:border-white bg-white dark:bg-black"
        >
          <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-4">
            <Package className="w-5 h-5 text-black dark:text-white" />
          </div>
          <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400 uppercase mb-1">
            Productos
          </p>
          <p className="font-display text-2xl font-black text-black dark:text-white">
            {analytics.totalProducts}
          </p>
        </motion.div>

        {/* Avg Order */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 border-2 border-black dark:border-white bg-white dark:bg-black"
        >
          <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-4">
            <Clock className="w-5 h-5 text-black dark:text-white" />
          </div>
          <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400 uppercase mb-1">
            Ticket Promedio
          </p>
          <p className="font-display text-2xl font-black text-black dark:text-white">
            ${analytics.averageOrderValue.toFixed(0)}
          </p>
        </motion.div>
      </div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 border-2 border-black dark:border-white bg-white dark:bg-black"
      >
        <h3 className="font-mono text-sm font-bold uppercase mb-6 text-black dark:text-white">
          Ingresos por Día
        </h3>
        <div className="h-48 flex items-end gap-1">
          {analytics.revenueByDay.slice(-14).map((day, i) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-[#BFFF00] transition-all hover:bg-[#a8e600] relative group"
                style={{
                  height: `${(day.revenue / maxRevenue) * 100}%`,
                  minHeight: day.revenue > 0 ? '4px' : '0'
                }}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-black text-white px-2 py-1 text-xs font-mono whitespace-nowrap">
                    ${day.revenue.toLocaleString()}
                  </div>
                </div>
              </div>
              <span className="font-mono text-[10px] text-neutral-400 -rotate-45 origin-center">
                {new Date(day.date).getDate()}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 border-2 border-black dark:border-white bg-white dark:bg-black"
        >
          <h3 className="font-mono text-sm font-bold uppercase mb-6 text-black dark:text-white">
            Top Productos
          </h3>
          {analytics.topProducts.length > 0 ? (
            <div className="space-y-4">
              {analytics.topProducts.map((product, i) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center font-mono text-xs font-bold text-black dark:text-white">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-mono text-sm text-black dark:text-white truncate max-w-[150px]">
                        {product.name}
                      </p>
                      <p className="font-mono text-xs text-neutral-500">
                        {product.totalSold} vendidos
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-[#BFFF00]">
                    ${product.revenue.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-mono text-sm text-neutral-500 text-center py-8">
              Sin ventas en este período
            </p>
          )}
        </motion.div>

        {/* Orders by Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-6 border-2 border-black dark:border-white bg-white dark:bg-black"
        >
          <h3 className="font-mono text-sm font-bold uppercase mb-6 text-black dark:text-white">
            Estado de Órdenes
          </h3>
          <div className="space-y-4">
            {Object.entries(analytics.ordersByStatus).map(([status, count]) => {
              const total = Object.values(analytics.ordersByStatus).reduce((a, b) => a + b, 0)
              const percentage = total > 0 ? (count / total) * 100 : 0

              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm text-black dark:text-white">
                      {statusLabels[status] || status}
                    </span>
                    <span className="font-mono text-sm text-neutral-500">
                      {count}
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-100 dark:bg-neutral-900">
                    <div
                      className={`h-full ${statusColors[status] || 'bg-neutral-400'} transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
