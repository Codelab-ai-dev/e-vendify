"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { motion } from "framer-motion"

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  interactive?: boolean
  onChange?: (rating: number) => void
  showValue?: boolean
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6"
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onChange,
  showValue = false
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)

  const displayRating = hoverRating || rating

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: maxRating }, (_, i) => {
          const starValue = i + 1
          const isFilled = starValue <= displayRating
          const isHalf = starValue - 0.5 === displayRating

          return (
            <motion.button
              key={i}
              type="button"
              disabled={!interactive}
              whileHover={interactive ? { scale: 1.1 } : undefined}
              whileTap={interactive ? { scale: 0.9 } : undefined}
              onClick={() => interactive && onChange?.(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={`${interactive ? 'cursor-pointer' : 'cursor-default'} focus:outline-none`}
            >
              <Star
                className={`${sizeClasses[size]} transition-colors ${
                  isFilled
                    ? 'fill-[#BFFF00] text-[#BFFF00]'
                    : 'fill-transparent text-neutral-300 dark:text-neutral-600'
                }`}
              />
            </motion.button>
          )
        })}
      </div>
      {showValue && (
        <span className="font-mono text-sm text-neutral-500 dark:text-neutral-400 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

// Componente para mostrar rating promedio con conteo
interface RatingSummaryProps {
  averageRating: number
  reviewsCount: number
  size?: "sm" | "md" | "lg"
}

export function RatingSummary({ averageRating, reviewsCount, size = "md" }: RatingSummaryProps) {
  return (
    <div className="flex items-center gap-2">
      <StarRating rating={averageRating} size={size} />
      <span className="font-mono text-sm text-neutral-500 dark:text-neutral-400">
        {averageRating.toFixed(1)} ({reviewsCount} {reviewsCount === 1 ? 'reseña' : 'reseñas'})
      </span>
    </div>
  )
}
