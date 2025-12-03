"use client"

import { ShoppingCart, Plus, Minus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet"
import { useCart } from "@/lib/store/useCart"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"

export function CartDrawer() {
    const { items, removeItem, updateQuantity, total, itemCount } = useCart()
    const [isMounted, setIsMounted] = useState(false)

    // Prevent hydration mismatch
    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) {
        return (
            <Button variant="outline" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
            </Button>
        )
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {itemCount() > 0 && (
                        <Badge
                            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-600 hover:bg-red-700"
                        >
                            {itemCount()}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col w-full sm:max-w-md bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
                <SheetHeader>
                    <SheetTitle className="text-gray-900 dark:text-white">Tu Carrito ({itemCount()} productos)</SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-hidden py-4">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full">
                                <ShoppingCart className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Tu carrito está vacío</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-1">
                                    ¡Agrega algunos productos increíbles de nuestras tiendas!
                                </p>
                            </div>
                            <SheetClose asChild>
                                <Button variant="outline" className="dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">Seguir comprando</Button>
                            </SheetClose>
                        </div>
                    ) : (
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="h-20 w-20 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                                            <img
                                                src={item.image_url || "/placeholder.svg?height=80&width=80"}
                                                alt={item.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-1 flex-col justify-between">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-medium text-sm line-clamp-2 text-gray-900 dark:text-white">{item.name}</h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        ${item.price.toLocaleString()}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-500"
                                                    onClick={() => removeItem(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-6 w-6 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="text-sm w-8 text-center text-gray-900 dark:text-white">{item.quantity}</span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-6 w-6 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                {items.length > 0 && (
                    <SheetFooter className="flex-col sm:flex-col gap-4 border-t border-gray-200 dark:border-gray-800 pt-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white">
                                <span>Total</span>
                                <span>${total().toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Impuestos y envío calculados al finalizar la compra.
                            </p>
                        </div>
                        <SheetClose asChild>
                            <Link href={`/store/${items[0]?.storeId}/checkout`}>
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                                    Proceder al Pago
                                </Button>
                            </Link>
                        </SheetClose>
                    </SheetFooter>
                )}
            </SheetContent>

        </Sheet>
    )
}
