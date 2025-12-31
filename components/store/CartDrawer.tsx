"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingCart, Plus, Minus, Trash2, X, ArrowRight, Package } from "lucide-react"
import { useCart } from "@/lib/store/useCart"

export function CartDrawer() {
  const { items, removeItem, updateQuantity, total, itemCount } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isMounted) {
    return (
      <button className="w-10 h-10 border-2 border-border flex items-center justify-center relative">
        <ShoppingCart className="w-5 h-5" />
      </button>
    )
  }

  const count = itemCount()

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 border-2 border-border flex items-center justify-center relative hover:border-foreground transition-colors"
      >
        <ShoppingCart className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-background border-l-2 border-border z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b-2 border-border">
                <div>
                  <h2 className="font-display font-bold text-xl">Tu carrito</h2>
                  <p className="text-sm text-muted-foreground font-mono">{count} productos</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 border-2 border-border flex items-center justify-center hover:border-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 border-2 border-border flex items-center justify-center mb-6">
                      <ShoppingCart className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="font-display font-bold text-xl mb-2">Carrito vacio</h3>
                    <p className="text-muted-foreground mb-6 max-w-xs">
                      Agrega algunos productos para comenzar tu compra.
                    </p>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="btn-brutal-outline px-6 py-3"
                    >
                      Seguir comprando
                    </button>
                  </div>
                ) : (
                  <div className="p-6 space-y-4">
                    {items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-2 border-border p-4"
                      >
                        <div className="flex gap-4">
                          {/* Image */}
                          <div className="w-20 h-20 border-2 border-border overflow-hidden flex-shrink-0 bg-muted">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-display font-bold text-sm line-clamp-2">
                                {item.name}
                              </h4>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <p className="font-mono text-sm text-muted-foreground mt-1">
                              ${item.price.toLocaleString()} c/u
                            </p>

                            {/* Quantity controls */}
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center border-2 border-border">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-10 text-center font-mono text-sm">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <span className="font-display font-bold">
                                ${(item.price * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="border-t-2 border-border p-6 space-y-4">
                  {/* Subtotal */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-mono">${total().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-display font-bold text-lg">Total</span>
                      <span className="font-display font-bold text-2xl">${total().toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Impuestos y envio calculados al finalizar.
                    </p>
                  </div>

                  {/* Checkout button */}
                  <Link
                    href={`/store/${items[0]?.storeId}/checkout`}
                    onClick={() => setIsOpen(false)}
                    className="btn-brutal w-full py-4 inline-flex items-center justify-center gap-2"
                  >
                    Proceder al pago
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  {/* Continue shopping */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 border-2 border-border text-center font-medium hover:border-foreground transition-colors"
                  >
                    Seguir comprando
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
