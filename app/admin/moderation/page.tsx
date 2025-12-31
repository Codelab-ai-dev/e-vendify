"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Eye,
  Store,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"

interface PendingProduct {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string | null
  moderation_status: string
  flagged_words: string[] | null
  created_at: string
  store: {
    id: string
    name: string
    slug: string
  }
}

export default function ModerationPage() {
  const router = useRouter()
  const [products, setProducts] = useState<PendingProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'flagged' | 'rejected'>('pending')

  const loadProducts = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          image_url,
          category,
          moderation_status,
          flagged_words,
          created_at,
          store:stores(id, name, slug)
        `)
        .order('created_at', { ascending: true })

      if (activeTab === 'pending') {
        query = query.eq('moderation_status', 'pending')
      } else if (activeTab === 'flagged') {
        query = query.eq('moderation_status', 'flagged')
      } else {
        query = query.eq('moderation_status', 'rejected')
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading products:', error)
        toast.error('Error al cargar productos')
        return
      }

      setProducts(data as unknown as PendingProduct[] || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [activeTab])

  const handleApprove = async (productId: string) => {
    setProcessing(productId)
    try {
      const { error } = await supabase
        .from('products')
        .update({
          moderation_status: 'approved',
          moderated_at: new Date().toISOString(),
        })
        .eq('id', productId)

      if (error) {
        toast.error('Error al aprobar producto')
        return
      }

      toast.success('Producto aprobado')
      setProducts(products.filter(p => p.id !== productId))
    } catch (error) {
      toast.error('Error inesperado')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (productId: string, reason: string = 'Contenido no permitido') => {
    setProcessing(productId)
    try {
      const { error } = await supabase
        .from('products')
        .update({
          moderation_status: 'rejected',
          rejection_reason: reason,
          moderated_at: new Date().toISOString(),
        })
        .eq('id', productId)

      if (error) {
        toast.error('Error al rechazar producto')
        return
      }

      toast.success('Producto rechazado')
      setProducts(products.filter(p => p.id !== productId))
    } catch (error) {
      toast.error('Error inesperado')
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>
      case 'flagged':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Marcado</Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-red-600"><XCircle className="w-3 h-3 mr-1" /> Rechazado</Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Aprobado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <h1 className="text-xl font-semibold">Moderacion de Productos</h1>
            </div>
            <Button variant="outline" size="sm" onClick={loadProducts}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              Pendientes
            </TabsTrigger>
            <TabsTrigger value="flagged" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              Marcados
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="w-4 h-4" />
              Rechazados
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 animate-spin rounded-full" />
              </div>
            ) : products.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No hay productos para revisar</h3>
                  <p className="text-gray-500 mt-1">
                    {activeTab === 'pending' && 'Todos los productos han sido revisados.'}
                    {activeTab === 'flagged' && 'No hay productos marcados para revision.'}
                    {activeTab === 'rejected' && 'No hay productos rechazados.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {products.map((product) => (
                  <Card key={product.id} className={product.moderation_status === 'flagged' ? 'border-orange-300 bg-orange-50' : ''}>
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        {/* Image */}
                        <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              Sin imagen
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold">{product.name}</h3>
                                {getStatusBadge(product.moderation_status)}
                              </div>
                              <p className="text-2xl font-bold text-green-600">
                                ${product.price.toLocaleString()} MXN
                              </p>
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Store className="w-4 h-4" />
                                {product.store?.name || 'Tienda desconocida'}
                              </div>
                              <div className="mt-1">
                                {new Date(product.created_at).toLocaleDateString('es-MX')}
                              </div>
                            </div>
                          </div>

                          {product.description && (
                            <p className="text-gray-600 mt-2 line-clamp-2">{product.description}</p>
                          )}

                          {product.category && (
                            <Badge variant="outline" className="mt-2">{product.category}</Badge>
                          )}

                          {/* Flagged Words Warning */}
                          {product.flagged_words && product.flagged_words.length > 0 && (
                            <div className="mt-3 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                              <div className="flex items-center gap-2 text-orange-800 font-medium">
                                <AlertTriangle className="w-4 h-4" />
                                Palabras detectadas:
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {product.flagged_words.map((word, i) => (
                                  <Badge key={i} variant="destructive" className="text-xs">
                                    {word}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-3 mt-4">
                            {activeTab !== 'rejected' && (
                              <>
                                <Button
                                  onClick={() => handleApprove(product.id)}
                                  disabled={processing === product.id}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Aprobar
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleReject(product.id)}
                                  disabled={processing === product.id}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Rechazar
                                </Button>
                              </>
                            )}
                            {activeTab === 'rejected' && (
                              <Button
                                onClick={() => handleApprove(product.id)}
                                disabled={processing === product.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Revertir a Aprobado
                              </Button>
                            )}
                            <Link href={`/store/${product.store?.slug || product.store?.id}/p/${product.id}`} target="_blank">
                              <Button variant="outline">
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Producto
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
