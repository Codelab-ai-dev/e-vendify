"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Loader2, Send } from "lucide-react"
import { StarRating } from "./StarRating"
import { toast } from "sonner"

interface ReviewFormProps {
  productId: string
  productName: string
  orderId?: string
  onSuccess: () => void
  onCancel: () => void
}

export function ReviewForm({ productId, productName, orderId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error("Por favor selecciona una calificación")
      return
    }

    if (!name.trim() || !email.trim()) {
      toast.error("Nombre y email son requeridos")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          order_id: orderId,
          customer_name: name.trim(),
          customer_email: email.trim(),
          rating,
          title: title.trim() || undefined,
          comment: comment.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details?.fieldErrors?.customer_email?.[0] || error.error)
      }

      toast.success("¡Gracias por tu reseña! Será publicada después de ser revisada.")
      onSuccess()
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error(error instanceof Error ? error.message : "Error al enviar la reseña")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onSubmit={handleSubmit}
      className="p-6 border-2 border-black dark:border-white bg-white dark:bg-black space-y-6"
    >
      <div>
        <h4 className="font-display font-black text-lg uppercase tracking-tight text-black dark:text-white mb-1">
          Tu opinión sobre
        </h4>
        <p className="font-mono text-sm text-neutral-500">{productName}</p>
      </div>

      {/* Rating */}
      <div className="space-y-2">
        <label className="font-mono text-sm font-bold text-black dark:text-white uppercase block">
          Calificación *
        </label>
        <StarRating
          rating={rating}
          size="lg"
          interactive
          onChange={setRating}
        />
        {rating > 0 && (
          <p className="font-mono text-xs text-neutral-500">
            {rating === 1 && "Muy malo"}
            {rating === 2 && "Malo"}
            {rating === 3 && "Regular"}
            {rating === 4 && "Bueno"}
            {rating === 5 && "Excelente"}
          </p>
        )}
      </div>

      {/* Name & Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="review-name" className="font-mono text-sm font-bold text-black dark:text-white uppercase block">
            Nombre *
          </label>
          <input
            id="review-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            placeholder="Tu nombre"
            required
            className={`w-full px-4 py-3 bg-transparent border-2 transition-colors font-mono text-sm
              ${focusedField === 'name' ? 'border-[#BFFF00]' : 'border-neutral-200 dark:border-neutral-800'}
              text-black dark:text-white placeholder:text-neutral-400 focus:outline-none`}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="review-email" className="font-mono text-sm font-bold text-black dark:text-white uppercase block">
            Email *
          </label>
          <input
            id="review-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            placeholder="tu@email.com"
            required
            className={`w-full px-4 py-3 bg-transparent border-2 transition-colors font-mono text-sm
              ${focusedField === 'email' ? 'border-[#BFFF00]' : 'border-neutral-200 dark:border-neutral-800'}
              text-black dark:text-white placeholder:text-neutral-400 focus:outline-none`}
          />
          <p className="font-mono text-xs text-neutral-400">No se mostrará públicamente</p>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <label htmlFor="review-title" className="font-mono text-sm font-bold text-black dark:text-white uppercase block">
          Título (opcional)
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setFocusedField('title')}
          onBlur={() => setFocusedField(null)}
          placeholder="Resumen de tu experiencia"
          maxLength={100}
          className={`w-full px-4 py-3 bg-transparent border-2 transition-colors font-mono text-sm
            ${focusedField === 'title' ? 'border-[#BFFF00]' : 'border-neutral-200 dark:border-neutral-800'}
            text-black dark:text-white placeholder:text-neutral-400 focus:outline-none`}
        />
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <label htmlFor="review-comment" className="font-mono text-sm font-bold text-black dark:text-white uppercase block">
          Tu reseña (opcional)
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onFocus={() => setFocusedField('comment')}
          onBlur={() => setFocusedField(null)}
          placeholder="Cuéntanos tu experiencia con este producto..."
          rows={4}
          maxLength={1000}
          className={`w-full px-4 py-3 bg-transparent border-2 transition-colors font-mono text-sm resize-none
            ${focusedField === 'comment' ? 'border-[#BFFF00]' : 'border-neutral-200 dark:border-neutral-800'}
            text-black dark:text-white placeholder:text-neutral-400 focus:outline-none`}
        />
        <p className="font-mono text-xs text-neutral-400 text-right">
          {comment.length}/1000
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <motion.button
          type="submit"
          disabled={isSubmitting || rating === 0}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 py-4 bg-[#BFFF00] text-black font-mono font-bold text-sm uppercase tracking-wider border-2 border-black hover:bg-[#a8e600] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Enviar Reseña
            </>
          )}
        </motion.button>
        <motion.button
          type="button"
          onClick={onCancel}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-4 bg-transparent text-black dark:text-white font-mono font-bold text-sm uppercase tracking-wider border-2 border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white transition-colors"
        >
          Cancelar
        </motion.button>
      </div>

      <p className="font-mono text-xs text-neutral-400 text-center">
        Tu reseña será revisada antes de ser publicada
      </p>
    </motion.form>
  )
}
