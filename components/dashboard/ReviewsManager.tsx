"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Star,
  Check,
  X,
  MessageSquare,
  Eye,
  EyeOff,
  Trash2,
  Send,
  Loader2,
  Filter,
  ChevronDown
} from "lucide-react"
import { StarRating } from "../reviews/StarRating"
import { toast } from "sonner"

interface Review {
  id: string
  product_id: string
  customer_name: string
  customer_email: string
  rating: number
  title: string | null
  comment: string | null
  is_approved: boolean
  is_visible: boolean
  seller_response: string | null
  seller_response_at: string | null
  created_at: string
  product?: {
    id: string
    name: string
    image_url: string | null
  }
}

interface ReviewsManagerProps {
  storeId: string
}

type FilterType = 'all' | 'pending' | 'approved' | 'hidden'

export function ReviewsManager({ storeId }: ReviewsManagerProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const pending = filter === 'pending'
      const response = await fetch(`/api/reviews?storeId=${storeId}${pending ? '&pending=true' : ''}`)
      if (response.ok) {
        let data = await response.json()

        // Filtrar localmente según el filtro
        if (filter === 'approved') {
          data = data.filter((r: Review) => r.is_approved && r.is_visible)
        } else if (filter === 'hidden') {
          data = data.filter((r: Review) => !r.is_visible)
        }

        setReviews(data)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('Error al cargar reseñas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [storeId, filter])

  const handleApprove = async (reviewId: string) => {
    setActionLoading(reviewId)
    try {
      const response = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, action: 'approve' }),
      })

      if (!response.ok) throw new Error('Error approving review')

      toast.success('Reseña aprobada')
      fetchReviews()
    } catch (error) {
      toast.error('Error al aprobar la reseña')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleVisibility = async (reviewId: string, currentlyVisible: boolean) => {
    setActionLoading(reviewId)
    try {
      const response = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, is_visible: !currentlyVisible }),
      })

      if (!response.ok) throw new Error('Error updating visibility')

      toast.success(currentlyVisible ? 'Reseña oculta' : 'Reseña visible')
      fetchReviews()
    } catch (error) {
      toast.error('Error al actualizar visibilidad')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta reseña? Esta acción no se puede deshacer.')) {
      return
    }

    setActionLoading(reviewId)
    try {
      const response = await fetch(`/api/reviews?id=${reviewId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Error deleting review')

      toast.success('Reseña eliminada')
      fetchReviews()
    } catch (error) {
      toast.error('Error al eliminar la reseña')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) {
      toast.error('Escribe una respuesta')
      return
    }

    setActionLoading(reviewId)
    try {
      const response = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          seller_response: responseText.trim(),
          is_approved: true, // Auto-aprobar al responder
        }),
      })

      if (!response.ok) throw new Error('Error sending response')

      toast.success('Respuesta enviada')
      setRespondingTo(null)
      setResponseText("")
      fetchReviews()
    } catch (error) {
      toast.error('Error al enviar respuesta')
    } finally {
      setActionLoading(null)
    }
  }

  const pendingCount = reviews.filter(r => !r.is_approved).length

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
            Reseñas
          </h2>
          <p className="font-mono text-sm text-neutral-500">
            {reviews.length} reseñas {pendingCount > 0 && `(${pendingCount} pendientes)`}
          </p>
        </div>

        {/* Filter */}
        <div className="flex border-2 border-black dark:border-white">
          {(['all', 'pending', 'approved', 'hidden'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 font-mono text-xs uppercase transition-colors ${
                filter === f
                  ? 'bg-[#BFFF00] text-black'
                  : 'bg-transparent text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {f === 'all' && 'Todas'}
              {f === 'pending' && 'Pendientes'}
              {f === 'approved' && 'Aprobadas'}
              {f === 'hidden' && 'Ocultas'}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-neutral-200 dark:border-neutral-800">
          <Star className="w-12 h-12 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
          <p className="font-mono text-neutral-500">
            {filter === 'pending' && 'No hay reseñas pendientes'}
            {filter === 'approved' && 'No hay reseñas aprobadas'}
            {filter === 'hidden' && 'No hay reseñas ocultas'}
            {filter === 'all' && 'Aún no tienes reseñas'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-6 border-2 bg-white dark:bg-black ${
                !review.is_approved
                  ? 'border-yellow-500'
                  : !review.is_visible
                  ? 'border-neutral-300 dark:border-neutral-700 opacity-60'
                  : 'border-neutral-200 dark:border-neutral-800'
              }`}
            >
              {/* Status Badge */}
              {!review.is_approved && (
                <div className="inline-block px-2 py-1 bg-yellow-500 text-black font-mono text-xs uppercase mb-4">
                  Pendiente de aprobación
                </div>
              )}
              {review.is_approved && !review.is_visible && (
                <div className="inline-block px-2 py-1 bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono text-xs uppercase mb-4">
                  Oculta
                </div>
              )}

              {/* Product Info */}
              {review.product && (
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-100 dark:border-neutral-900">
                  {review.product.image_url ? (
                    <img
                      src={review.product.image_url}
                      alt={review.product.name}
                      className="w-12 h-12 object-cover border border-neutral-200 dark:border-neutral-800"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
                      <Star className="w-6 h-6 text-neutral-400" />
                    </div>
                  )}
                  <span className="font-mono text-sm text-neutral-500">
                    {review.product.name}
                  </span>
                </div>
              )}

              {/* Review Content */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-mono font-bold text-sm text-black dark:text-white">
                    {review.customer_name}
                  </p>
                  <p className="font-mono text-xs text-neutral-400">
                    {review.customer_email}
                  </p>
                  <p className="font-mono text-xs text-neutral-400">
                    {new Date(review.created_at).toLocaleDateString('es-MX')}
                  </p>
                </div>
                <StarRating rating={review.rating} size="sm" />
              </div>

              {review.title && (
                <h4 className="font-mono font-bold text-black dark:text-white mb-2">
                  {review.title}
                </h4>
              )}

              {review.comment && (
                <p className="font-mono text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  {review.comment}
                </p>
              )}

              {/* Seller Response */}
              {review.seller_response && (
                <div className="p-4 bg-neutral-50 dark:bg-neutral-900 border-l-4 border-[#BFFF00] mb-4">
                  <p className="font-mono text-xs text-neutral-500 mb-1">Tu respuesta</p>
                  <p className="font-mono text-sm text-neutral-600 dark:text-neutral-400">
                    {review.seller_response}
                  </p>
                </div>
              )}

              {/* Response Form */}
              <AnimatePresence>
                {respondingTo === review.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 overflow-hidden"
                  >
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Escribe tu respuesta..."
                      rows={3}
                      className="w-full px-4 py-3 bg-transparent border-2 border-neutral-200 dark:border-neutral-800 focus:border-[#BFFF00] font-mono text-sm resize-none text-black dark:text-white placeholder:text-neutral-400 focus:outline-none"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleRespond(review.id)}
                        disabled={actionLoading === review.id}
                        className="px-4 py-2 bg-[#BFFF00] text-black font-mono text-xs uppercase border-2 border-black hover:bg-[#a8e600] transition-colors flex items-center gap-2"
                      >
                        {actionLoading === review.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        Enviar
                      </button>
                      <button
                        onClick={() => {
                          setRespondingTo(null)
                          setResponseText("")
                        }}
                        className="px-4 py-2 bg-transparent text-black dark:text-white font-mono text-xs uppercase border-2 border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-900">
                {!review.is_approved && (
                  <button
                    onClick={() => handleApprove(review.id)}
                    disabled={actionLoading === review.id}
                    className="px-3 py-2 bg-green-500 text-white font-mono text-xs uppercase flex items-center gap-1 hover:bg-green-600 transition-colors"
                  >
                    {actionLoading === review.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    Aprobar
                  </button>
                )}

                {!review.seller_response && respondingTo !== review.id && (
                  <button
                    onClick={() => setRespondingTo(review.id)}
                    className="px-3 py-2 bg-transparent text-black dark:text-white font-mono text-xs uppercase border border-neutral-200 dark:border-neutral-800 flex items-center gap-1 hover:border-black dark:hover:border-white transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Responder
                  </button>
                )}

                <button
                  onClick={() => handleToggleVisibility(review.id, review.is_visible)}
                  disabled={actionLoading === review.id}
                  className="px-3 py-2 bg-transparent text-black dark:text-white font-mono text-xs uppercase border border-neutral-200 dark:border-neutral-800 flex items-center gap-1 hover:border-black dark:hover:border-white transition-colors"
                >
                  {review.is_visible ? (
                    <>
                      <EyeOff className="w-3 h-3" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      Mostrar
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={actionLoading === review.id}
                  className="px-3 py-2 bg-transparent text-red-500 font-mono text-xs uppercase border border-red-200 flex items-center gap-1 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Eliminar
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
