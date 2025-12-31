"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package,
  AlertTriangle,
  XCircle,
  Plus,
  Minus,
  Edit3,
  Check,
  X,
  Loader2,
  TrendingDown,
  TrendingUp,
  History,
  Search,
  Filter,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import type { ProductInventory, InventoryStats, InventoryMovement, MovementType } from "@/lib/types/inventory"
import { MOVEMENT_TYPE_LABELS } from "@/lib/types/inventory"

interface InventoryManagerProps {
  storeId: string
}

type ViewMode = 'all' | 'low_stock' | 'out_of_stock' | 'tracked'
type AdjustmentType = 'add' | 'remove'

export function InventoryManager({ storeId }: InventoryManagerProps) {
  const [products, setProducts] = useState<ProductInventory[]>([])
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showMovements, setShowMovements] = useState(false)

  // Estados para edición
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{
    stock_quantity: number
    low_stock_threshold: number
    track_inventory: boolean
    sku: string
  } | null>(null)

  // Estados para ajuste de stock
  const [adjustingProduct, setAdjustingProduct] = useState<string | null>(null)
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('add')
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(1)
  const [adjustmentReason, setAdjustmentReason] = useState<MovementType>('restock')
  const [adjustmentNotes, setAdjustmentNotes] = useState('')

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)

      const [inventoryRes, statsRes] = await Promise.all([
        fetch(`/api/inventory?storeId=${storeId}&type=inventory`),
        fetch(`/api/inventory?storeId=${storeId}&type=stats`)
      ])

      if (inventoryRes.ok) {
        const data = await inventoryRes.json()
        setProducts(data)
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast.error('Error al cargar inventario')
    } finally {
      setLoading(false)
    }
  }

  const fetchMovements = async () => {
    try {
      const res = await fetch(`/api/inventory?storeId=${storeId}&type=movements&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setMovements(data)
      }
    } catch (error) {
      console.error('Error fetching movements:', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [storeId])

  useEffect(() => {
    if (showMovements) {
      fetchMovements()
    }
  }, [showMovements, storeId])

  const handleStartEdit = (product: ProductInventory) => {
    setEditingProduct(product.id)
    setEditValues({
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold,
      track_inventory: product.track_inventory,
      sku: product.sku || ''
    })
  }

  const handleSaveEdit = async (productId: string) => {
    if (!editValues) return

    setActionLoading(productId)
    try {
      const response = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          ...editValues
        })
      })

      if (!response.ok) throw new Error('Error updating')

      toast.success('Inventario actualizado')
      setEditingProduct(null)
      setEditValues(null)
      fetchData()
    } catch (error) {
      toast.error('Error al actualizar inventario')
    } finally {
      setActionLoading(null)
    }
  }

  const handleAdjustStock = async (productId: string) => {
    const quantityChange = adjustmentType === 'add' ? adjustmentQuantity : -adjustmentQuantity

    setActionLoading(productId)
    try {
      const response = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust',
          product_id: productId,
          quantity_change: quantityChange,
          movement_type: adjustmentReason,
          notes: adjustmentNotes || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error adjusting stock')
      }

      toast.success(`Stock ${adjustmentType === 'add' ? 'agregado' : 'reducido'} correctamente`)
      setAdjustingProduct(null)
      setAdjustmentQuantity(1)
      setAdjustmentNotes('')
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al ajustar stock')
    } finally {
      setActionLoading(null)
    }
  }

  const handleQuickToggleTracking = async (product: ProductInventory) => {
    setActionLoading(product.id)
    try {
      const response = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          track_inventory: !product.track_inventory
        })
      })

      if (!response.ok) throw new Error('Error updating')

      toast.success(product.track_inventory ? 'Seguimiento desactivado' : 'Seguimiento activado')
      fetchData()
    } catch (error) {
      toast.error('Error al actualizar')
    } finally {
      setActionLoading(null)
    }
  }

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    // Filtro por búsqueda
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false
    }

    // Filtro por modo de vista
    switch (viewMode) {
      case 'tracked':
        return product.track_inventory
      case 'low_stock':
        return product.track_inventory && product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold
      case 'out_of_stock':
        return product.track_inventory && product.stock_quantity <= 0
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#BFFF00]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-xl font-black uppercase tracking-tight text-black dark:text-white">
            Inventario
          </h2>
          <p className="font-mono text-sm text-neutral-500">
            Gestiona el stock de tus productos
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMovements(!showMovements)}
            className={`px-4 py-2 font-mono text-xs uppercase border-2 transition-colors flex items-center gap-2 ${
              showMovements
                ? 'bg-[#BFFF00] text-black border-black'
                : 'bg-transparent text-black dark:text-white border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white'
            }`}
          >
            <History className="w-4 h-4" />
            Historial
          </button>
          <button
            onClick={fetchData}
            className="px-4 py-2 font-mono text-xs uppercase border-2 border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border-2 border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-neutral-500 uppercase">Total productos</span>
              <Package className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="font-display text-2xl font-black text-black dark:text-white">
              {stats.total_products}
            </div>
          </div>

          <div className="p-4 border-2 border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-neutral-500 uppercase">Con seguimiento</span>
              <Check className="w-4 h-4 text-[#BFFF00]" />
            </div>
            <div className="font-display text-2xl font-black text-black dark:text-white">
              {stats.tracked_products}
            </div>
          </div>

          <div className="p-4 border-2 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-yellow-600 uppercase">Stock bajo</span>
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="font-display text-2xl font-black text-yellow-600">
              {stats.low_stock_count}
            </div>
          </div>

          <div className="p-4 border-2 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-red-600 uppercase">Sin stock</span>
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
            <div className="font-display text-2xl font-black text-red-600">
              {stats.out_of_stock_count}
            </div>
          </div>
        </div>
      )}

      {/* Movements Panel */}
      <AnimatePresence>
        {showMovements && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-2 border-neutral-200 dark:border-neutral-800 overflow-hidden"
          >
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
              <h3 className="font-mono font-bold text-sm uppercase text-black dark:text-white">
                Últimos movimientos
              </h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {movements.length === 0 ? (
                <div className="p-6 text-center">
                  <History className="w-8 h-8 mx-auto mb-2 text-neutral-300 dark:text-neutral-700" />
                  <p className="font-mono text-sm text-neutral-500">Sin movimientos registrados</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
                  {movements.map((movement) => (
                    <div key={movement.id} className="p-4 flex items-center gap-4">
                      <div className={`w-8 h-8 flex items-center justify-center ${
                        movement.quantity_change > 0
                          ? 'bg-green-100 dark:bg-green-900'
                          : 'bg-red-100 dark:bg-red-900'
                      }`}>
                        {movement.quantity_change > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm font-bold text-black dark:text-white truncate">
                          {movement.product?.name || 'Producto'}
                        </p>
                        <p className="font-mono text-xs text-neutral-500">
                          {MOVEMENT_TYPE_LABELS[movement.movement_type]} • {new Date(movement.created_at).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`font-mono font-bold ${
                          movement.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}
                        </span>
                        <p className="font-mono text-xs text-neutral-400">
                          {movement.previous_quantity} → {movement.new_quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-transparent border-2 border-neutral-200 dark:border-neutral-800 focus:border-[#BFFF00] font-mono text-sm text-black dark:text-white placeholder:text-neutral-400 focus:outline-none"
          />
        </div>

        {/* View Mode Filter */}
        <div className="flex border-2 border-black dark:border-white">
          {(['all', 'tracked', 'low_stock', 'out_of_stock'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-2 font-mono text-xs uppercase transition-colors ${
                viewMode === mode
                  ? 'bg-[#BFFF00] text-black'
                  : 'bg-transparent text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {mode === 'all' && 'Todos'}
              {mode === 'tracked' && 'Rastreados'}
              {mode === 'low_stock' && 'Stock bajo'}
              {mode === 'out_of_stock' && 'Sin stock'}
            </button>
          ))}
        </div>
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-neutral-200 dark:border-neutral-800">
          <Package className="w-12 h-12 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
          <p className="font-mono text-neutral-500">
            {searchTerm ? 'No se encontraron productos' : 'No hay productos en esta categoría'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => {
            const isEditing = editingProduct === product.id
            const isAdjusting = adjustingProduct === product.id
            const isLowStock = product.track_inventory && product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold
            const isOutOfStock = product.track_inventory && product.stock_quantity <= 0

            return (
              <motion.div
                key={product.id}
                layout
                className={`p-4 border-2 bg-white dark:bg-black ${
                  isOutOfStock
                    ? 'border-red-500'
                    : isLowStock
                    ? 'border-yellow-500'
                    : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Product Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Image */}
                    <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-900 flex-shrink-0 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-neutral-400" />
                        </div>
                      )}
                    </div>

                    {/* Name & SKU */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-mono font-bold text-black dark:text-white truncate">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {product.sku && (
                          <span className="font-mono text-xs text-neutral-500">
                            SKU: {product.sku}
                          </span>
                        )}
                        {product.category && (
                          <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-900 font-mono text-xs text-neutral-500">
                            {product.category}
                          </span>
                        )}
                      </div>
                      {/* Status badges */}
                      <div className="flex gap-2 mt-2">
                        {!product.track_inventory && (
                          <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-mono text-xs">
                            Sin seguimiento
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="px-2 py-0.5 bg-red-500 text-white font-mono text-xs uppercase">
                            Sin stock
                          </span>
                        )}
                        {isLowStock && (
                          <span className="px-2 py-0.5 bg-yellow-500 text-black font-mono text-xs uppercase">
                            Stock bajo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stock Info & Actions */}
                  {isEditing && editValues ? (
                    <div className="flex flex-col gap-3 lg:w-80">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="font-mono text-xs text-neutral-500 uppercase block mb-1">
                            Stock
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={editValues.stock_quantity}
                            onChange={(e) => setEditValues({ ...editValues, stock_quantity: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border-2 border-neutral-200 dark:border-neutral-800 focus:border-[#BFFF00] font-mono text-sm bg-transparent text-black dark:text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="font-mono text-xs text-neutral-500 uppercase block mb-1">
                            Alerta
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={editValues.low_stock_threshold}
                            onChange={(e) => setEditValues({ ...editValues, low_stock_threshold: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border-2 border-neutral-200 dark:border-neutral-800 focus:border-[#BFFF00] font-mono text-sm bg-transparent text-black dark:text-white focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="font-mono text-xs text-neutral-500 uppercase block mb-1">
                          SKU (opcional)
                        </label>
                        <input
                          type="text"
                          value={editValues.sku}
                          onChange={(e) => setEditValues({ ...editValues, sku: e.target.value })}
                          placeholder="ABC-123"
                          className="w-full px-3 py-2 border-2 border-neutral-200 dark:border-neutral-800 focus:border-[#BFFF00] font-mono text-sm bg-transparent text-black dark:text-white placeholder:text-neutral-400 focus:outline-none"
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editValues.track_inventory}
                          onChange={(e) => setEditValues({ ...editValues, track_inventory: e.target.checked })}
                          className="w-4 h-4 accent-[#BFFF00]"
                        />
                        <span className="font-mono text-sm text-black dark:text-white">
                          Rastrear inventario
                        </span>
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(product.id)}
                          disabled={actionLoading === product.id}
                          className="flex-1 py-2 bg-[#BFFF00] text-black font-mono text-xs uppercase border-2 border-black hover:bg-[#a8e600] transition-colors flex items-center justify-center gap-1"
                        >
                          {actionLoading === product.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Guardar
                        </button>
                        <button
                          onClick={() => { setEditingProduct(null); setEditValues(null) }}
                          className="px-4 py-2 font-mono text-xs uppercase border-2 border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : isAdjusting ? (
                    <div className="flex flex-col gap-3 lg:w-80">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAdjustmentType('add')}
                          className={`flex-1 py-2 font-mono text-xs uppercase border-2 transition-colors flex items-center justify-center gap-1 ${
                            adjustmentType === 'add'
                              ? 'bg-green-500 text-white border-green-600'
                              : 'border-neutral-200 dark:border-neutral-800'
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                          Agregar
                        </button>
                        <button
                          onClick={() => setAdjustmentType('remove')}
                          className={`flex-1 py-2 font-mono text-xs uppercase border-2 transition-colors flex items-center justify-center gap-1 ${
                            adjustmentType === 'remove'
                              ? 'bg-red-500 text-white border-red-600'
                              : 'border-neutral-200 dark:border-neutral-800'
                          }`}
                        >
                          <Minus className="w-3 h-3" />
                          Retirar
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="font-mono text-xs text-neutral-500 uppercase block mb-1">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={adjustmentQuantity}
                            onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border-2 border-neutral-200 dark:border-neutral-800 focus:border-[#BFFF00] font-mono text-sm bg-transparent text-black dark:text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="font-mono text-xs text-neutral-500 uppercase block mb-1">
                            Razón
                          </label>
                          <select
                            value={adjustmentReason}
                            onChange={(e) => setAdjustmentReason(e.target.value as MovementType)}
                            className="w-full px-3 py-2 border-2 border-neutral-200 dark:border-neutral-800 focus:border-[#BFFF00] font-mono text-sm bg-transparent text-black dark:text-white focus:outline-none"
                          >
                            <option value="restock">Reabastecimiento</option>
                            <option value="return">Devolución</option>
                            <option value="damage">Daño/Pérdida</option>
                            <option value="manual_adjustment">Ajuste manual</option>
                            <option value="other">Otro</option>
                          </select>
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Notas (opcional)"
                        value={adjustmentNotes}
                        onChange={(e) => setAdjustmentNotes(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-neutral-200 dark:border-neutral-800 focus:border-[#BFFF00] font-mono text-sm bg-transparent text-black dark:text-white placeholder:text-neutral-400 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAdjustStock(product.id)}
                          disabled={actionLoading === product.id}
                          className={`flex-1 py-2 font-mono text-xs uppercase border-2 transition-colors flex items-center justify-center gap-1 ${
                            adjustmentType === 'add'
                              ? 'bg-green-500 text-white border-green-600 hover:bg-green-600'
                              : 'bg-red-500 text-white border-red-600 hover:bg-red-600'
                          }`}
                        >
                          {actionLoading === product.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Confirmar
                        </button>
                        <button
                          onClick={() => { setAdjustingProduct(null); setAdjustmentQuantity(1); setAdjustmentNotes('') }}
                          className="px-4 py-2 font-mono text-xs uppercase border-2 border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      {/* Stock Display */}
                      {product.track_inventory && (
                        <div className="text-center">
                          <div className={`font-display text-2xl font-black ${
                            isOutOfStock
                              ? 'text-red-500'
                              : isLowStock
                              ? 'text-yellow-600'
                              : 'text-black dark:text-white'
                          }`}>
                            {product.stock_quantity}
                          </div>
                          <p className="font-mono text-xs text-neutral-500">
                            unidades
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {product.track_inventory && (
                          <button
                            onClick={() => setAdjustingProduct(product.id)}
                            className="p-2 border-2 border-neutral-200 dark:border-neutral-800 hover:border-[#BFFF00] transition-colors"
                            title="Ajustar stock"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleStartEdit(product)}
                          className="p-2 border-2 border-neutral-200 dark:border-neutral-800 hover:border-[#BFFF00] transition-colors"
                          title="Editar inventario"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleQuickToggleTracking(product)}
                          disabled={actionLoading === product.id}
                          className={`p-2 border-2 transition-colors ${
                            product.track_inventory
                              ? 'bg-[#BFFF00] border-[#BFFF00] text-black'
                              : 'border-neutral-200 dark:border-neutral-800 hover:border-[#BFFF00]'
                          }`}
                          title={product.track_inventory ? 'Desactivar seguimiento' : 'Activar seguimiento'}
                        >
                          {actionLoading === product.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
