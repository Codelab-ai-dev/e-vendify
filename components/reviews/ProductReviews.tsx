"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, User, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { StarRating, RatingSummary } from "./StarRating"
import { ReviewForm } from "./ReviewForm"
import type { Review } from "@/lib/types/reviews"

interface ProductReviewsProps {
  productId: string
  productName: string
}

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reviews?productId=${productId}`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [productId])

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0
      ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100
      : 0
  }))

  const toggleExpand = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews)
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId)
    } else {
      newExpanded.add(reviewId)
    }
    setExpandedReviews(newExpanded)
  }

  const handleReviewSubmitted = () => {
    setShowForm(false)
    fetchReviews()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#BFFF00]" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-display text-xl font-black uppercase tracking-tight text-black dark:text-white">
            Reseñas
          </h3>
          {reviews.length > 0 && (
            <RatingSummary averageRating={averageRating} reviewsCount={reviews.length} />
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-[#BFFF00] text-black font-mono font-bold text-sm uppercase tracking-wider border-2 border-black hover:bg-[#a8e600] transition-colors"
        >
          {showForm ? 'Cancelar' : 'Escribir Reseña'}
        </motion.button>
      </div>

      {/* Review Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <ReviewForm
              productId={productId}
              productName={productName}
              onSuccess={handleReviewSubmitted}
              onCancel={() => setShowForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rating Distribution */}
      {reviews.length > 0 && (
        <div className="p-6 border-2 border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Average */}
            <div className="text-center md:text-left">
              <div className="font-display text-5xl font-black text-[#BFFF00] mb-2">
                {averageRating.toFixed(1)}
              </div>
              <StarRating rating={averageRating} size="lg" />
              <p className="font-mono text-sm text-neutral-500 mt-2">
                Basado en {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}
              </p>
            </div>

            {/* Distribution */}
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="font-mono text-sm text-neutral-500 w-8">{rating}★</span>
                  <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className="h-full bg-[#BFFF00]"
                    />
                  </div>
                  <span className="font-mono text-xs text-neutral-400 w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
          <p className="font-mono text-neutral-500">
            Aún no hay reseñas para este producto
          </p>
          <p className="font-mono text-sm text-neutral-400 mt-1">
            ¡Sé el primero en dejar una reseña!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => {
            const isExpanded = expandedReviews.has(review.id)
            const hasLongComment = review.comment && review.comment.length > 200

            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
                      <User className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-sm text-black dark:text-white">
                        {review.customer_name}
                      </p>
                      <p className="font-mono text-xs text-neutral-400">
                        {new Date(review.created_at).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>

                {/* Title */}
                {review.title && (
                  <h4 className="font-mono font-bold text-black dark:text-white mb-2">
                    {review.title}
                  </h4>
                )}

                {/* Comment */}
                {review.comment && (
                  <div>
                    <p className={`font-mono text-sm text-neutral-600 dark:text-neutral-400 ${
                      !isExpanded && hasLongComment ? 'line-clamp-3' : ''
                    }`}>
                      {review.comment}
                    </p>
                    {hasLongComment && (
                      <button
                        onClick={() => toggleExpand(review.id)}
                        className="font-mono text-xs text-[#BFFF00] hover:underline mt-2 flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>Ver menos <ChevronUp className="w-3 h-3" /></>
                        ) : (
                          <>Ver más <ChevronDown className="w-3 h-3" /></>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Seller Response */}
                {review.seller_response && (
                  <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-900 border-l-4 border-[#BFFF00]">
                    <p className="font-mono text-xs text-neutral-500 mb-1">
                      Respuesta del vendedor
                    </p>
                    <p className="font-mono text-sm text-neutral-600 dark:text-neutral-400">
                      {review.seller_response}
                    </p>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
