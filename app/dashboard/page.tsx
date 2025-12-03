"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2, Eye, Store, LogOut, Package, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { supabase, isAdmin } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import StoreSettingsForm from "@/components/StoreSettingsForm"
import { Skeleton } from "@/components/ui/skeleton"
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist"

// Tipos para TypeScript
interface BusinessProfile {
  id: string
  user_id: string | null
  name: string
  business_name: string | null
  owner: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  description: string | null
  website: string | null
  logo_url: string | null
  category: string | null
  registered_date: string
  status: 'active' | 'inactive'
  is_active: boolean
  products_count: number
  monthly_revenue: number
  last_login: string
  plan: 'basic' | 'premium'
  slug: string
  theme: string
  created_at: string
  updated_at: string
}

interface Product {
  id: string
  business_id: string
  name: string
  description?: string
  price: number
  image_url?: string
  category?: string
  is_available: boolean
  created_at: string
  updated_at: string
}

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()

  // Estados para datos de Supabase
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Función para cargar datos del usuario y sus productos
  const loadUserData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Verificar si el usuario es admin antes de cargar perfil de negocio
      console.log('Verificando si el usuario es admin:', user.id)
      const { isAdmin: userIsAdmin, error: adminError } = await isAdmin(user.id)

      if (adminError) {
        console.error('Error al verificar admin:', adminError)
      }

      if (userIsAdmin) {
        console.log('Usuario es admin, redirigiendo al dashboard de admin')
        toast.info('Redirigiendo al dashboard de administrador...')
        router.push('/admin/dashboard')
        return
      }

      // Cargar perfil de negocio del usuario desde la tabla stores (solo para usuarios regulares)
      console.log('Cargando perfil para usuario regular:', user.id)
      const { data: profileData, error: profileError } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .single()

      console.log('Resultado consulta perfil:', { profileData, profileError })

      if (profileError) {
        console.error('Error al cargar perfil:', profileError)

        // Si no existe el perfil, intentar crearlo automáticamente
        if (profileError.code === 'PGRST116') {
          console.log('Perfil no encontrado, intentando crear uno nuevo...')
          await createBusinessProfile()
          return
        } else {
          setError(`Error al cargar perfil: ${profileError.message}`)
          toast.error('Error al cargar el perfil de negocio')
        }
        return
      }

      setBusinessProfile(profileData)

      // Cargar productos del negocio
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', profileData.id)
        .order('created_at', { ascending: false })

      if (productsError) {
        console.error('Error al cargar productos:', productsError)
        toast.error('Error al cargar productos')
      } else {
        setProducts(productsData || [])
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error)
      setError('Error al cargar datos del usuario')
      toast.error('Error al cargar datos del usuario')
    } finally {
      setLoading(false)
    }
  }

  // Protección de ruta: redirigir si no está autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('Usuario no autenticado, redirigiendo al home')
      router.push('/')
      return
    }
  }, [user, authLoading, router])

  // Cargar datos del usuario y sus productos
  useEffect(() => {
    if (user && !authLoading) {
      loadUserData()
    }
  }, [user, authLoading])

  // Función para crear perfil de negocio automáticamente
  const createBusinessProfile = async () => {
    if (!user) return

    try {
      console.log('Creando perfil de negocio para usuario:', user.id)

      // Intentar obtener el nombre del negocio de los metadatos del usuario
      const businessName = user.user_metadata?.business_name || 'Mi Negocio Digital'

      const { data: newProfile, error: createError } = await supabase
        .from('business_profiles')
        .insert({
          user_id: user.id,
          business_name: businessName,
          email: user.email,
          description: 'Descripción de mi negocio digital',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Error al crear perfil:', createError)
        setError(`Error al crear perfil de negocio: ${createError.message}`)
        toast.error('No se pudo crear el perfil de negocio')
        return
      }

      console.log('Perfil creado exitosamente:', newProfile)
      setBusinessProfile(newProfile)
      toast.success('¡Perfil de negocio creado exitosamente!')

      // Cargar productos (que probablemente estará vacío para un perfil nuevo)
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', newProfile.id)
        .order('created_at', { ascending: false })

      setProducts(productsData || [])

    } catch (error) {
      console.error('Error inesperado al crear perfil:', error)
      setError('Error inesperado al crear el perfil de negocio')
      toast.error('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  // Función para eliminar producto
  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      // Actualizar contador de productos en la tienda
      if (businessProfile) {
        const { error: updateError } = await supabase
          .from('stores')
          .update({
            products_count: Math.max(0, (businessProfile.products_count || 1) - 1),
            updated_at: new Date().toISOString()
          })
          .eq('id', businessProfile.id)

        if (updateError) {
          console.error('Error al actualizar contador de productos:', updateError)
        } else {
          // Actualizar el estado local del businessProfile
          setBusinessProfile({
            ...businessProfile,
            products_count: Math.max(0, (businessProfile.products_count || 1) - 1)
          })
        }
      }

      // Actualizar la lista local
      setProducts(products.filter(p => p.id !== productId))
      toast.success('Producto eliminado exitosamente')
    } catch (error) {
      console.error('Error al eliminar producto:', error)
      toast.error('Error al eliminar el producto')
    }
  }

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login') // Redirigir a la página de login
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      toast.error('Error al cerrar sesión')
    }
  }

  // Mostrar loading mientras se cargan los datos de autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario autenticado, no mostrar nada (se redirigirá)
  if (!user) {
    return null
  }

  // Estados de carga de datos
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="border-b bg-white shadow-sm h-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </main>
      </div>
    )
  }

  if (error || !businessProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar datos</h2>
          <p className="text-gray-600 mb-4">{error || 'No se pudo cargar el perfil de negocio'}</p>
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Store className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{businessProfile.business_name}</h1>
                <p className="text-sm text-gray-500">Panel de administración</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href={`/store/${businessProfile.slug || businessProfile.id}`}>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver tienda
                </Button>
                <Button variant="outline" size="icon" className="sm:hidden">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="rounded-full p-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {(businessProfile.business_name || businessProfile.name || 'T').charAt(0).toUpperCase()}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <OnboardingChecklist profile={businessProfile} productsCount={products.length} />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground">productos en tu catálogo</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Precio Promedio</CardTitle>
              <span className="text-lg">$</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${products.length > 0 ? Math.round(products.reduce((acc: number, p: Product) => acc + p.price, 0) / products.length).toLocaleString() : '0'}
              </div>
              <p className="text-xs text-muted-foreground">precio promedio de productos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado</CardTitle>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Activa</div>
              <p className="text-xs text-muted-foreground">tu tienda está online</p>
            </CardContent>
          </Card>
        </div>

        {/* Store Settings Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Configuración de Tienda</CardTitle>
                <CardDescription>Edita la información de tu tienda</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <StoreSettingsForm businessProfile={businessProfile} onUpdate={loadUserData} />
          </CardContent>
        </Card>

        {/* Products Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Productos</CardTitle>
                <CardDescription>Gestiona el catálogo de tu tienda digital</CardDescription>
              </div>
              {businessProfile.plan === 'basic' && products.length >= 10 ? (
                <div className="text-center w-full sm:w-auto">
                  <Button disabled className="bg-gray-400 cursor-not-allowed w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Límite alcanzado (10/10)
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">
                    Actualiza a plan premium para agregar más productos
                  </p>
                </div>
              ) : (
                <div className="text-center w-full sm:w-auto">
                  <Link href="/dashboard/products/new">
                    <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar producto
                    </Button>
                  </Link>
                  {businessProfile.plan === 'basic' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Plan Básico: {products.length}/10 productos
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes productos aún</h3>
                <p className="text-gray-500 mb-4">Comienza agregando tu primer producto a la tienda</p>
                {businessProfile.plan === 'basic' && products.length >= 10 ? (
                  <div>
                    <Button disabled className="bg-gray-400 cursor-not-allowed">
                      <Plus className="h-4 w-4 mr-2" />
                      Límite alcanzado (10/10)
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Actualiza a plan premium para agregar más productos
                    </p>
                  </div>
                ) : (
                  <div>
                    <Link href="/dashboard/products/new">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar primer producto
                      </Button>
                    </Link>
                    {businessProfile.plan === 'basic' && (
                      <p className="text-xs text-gray-500 mt-2">
                        Plan Básico: {products.length}/10 productos
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product: Product) => (
                  <div
                    key={product.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 gap-4 transition-colors"
                  >
                    <div className="flex items-start sm:items-center space-x-4 w-full">
                      <img
                        src={product.image_url || "/placeholder.svg?height=80&width=80&text=Producto"}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{product.description || 'Sin descripción'}</p>
                        <div className="flex flex-wrap items-center mt-1 gap-2">
                          <Badge variant="secondary" className="text-green-700 bg-green-100">
                            ${product.price.toLocaleString()}
                          </Badge>
                          {product.category && (
                            <Badge variant="outline">
                              {product.category}
                            </Badge>
                          )}
                          <Badge variant={product.is_available ? "default" : "secondary"}>
                            {product.is_available ? 'Disponible' : 'No disponible'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                      <Link href={`/dashboard/products/edit/${product.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
                            deleteProduct(product.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
