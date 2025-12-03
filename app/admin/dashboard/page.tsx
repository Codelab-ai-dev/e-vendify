"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Store,
  DollarSign,
  TrendingUp,
  Eye,
  MoreHorizontal,
  Search,
  Filter,
  Download,
  Shield,
  LogOut,
  Package,
  Calendar,
  MapPin,
  Plus,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAllStores, getDashboardStats, type Store as StoreType } from "@/lib/stores"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export const dynamic = 'force-dynamic'

export default function AdminDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [stores, setStores] = useState<StoreType[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStores: 0,
    activeStores: 0,
    totalRevenue: 0,
    totalProducts: 0
  })

  // Protección de ruta: redirigir si no está autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('Usuario no autenticado, redirigiendo al home')
      router.push('/')
      return
    }
  }, [user, authLoading, router])

  // Cargar datos de Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Cargar tiendas
        const { data: storesData, error: storesError } = await getAllStores()
        if (storesError) {
          console.error('Error loading stores:', storesError)
          return
        }

        // Cargar estadísticas
        const { stats: dashboardStats, error: statsError } = await getDashboardStats()
        if (statsError) {
          console.error('Error loading stats:', statsError)
          return
        }

        if (storesData) {
          setStores(storesData)
        }

        if (dashboardStats) {
          setStats(dashboardStats)
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  // Filtrar tiendas por búsqueda
  const filteredStores = stores.filter(
    (store) =>
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (store.city && store.city.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-green-100 text-green-800">Activa</Badge>
    ) : (
      <Badge variant="secondary">Inactiva</Badge>
    )
  }

  const getPlanBadge = (plan: string) => {
    return plan === "premium" ? (
      <Badge className="bg-purple-100 text-purple-800">Premium</Badge>
    ) : (
      <Badge className="bg-blue-100 text-blue-800">Básico</Badge>
    )
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/admin/login') // Redirigir a la página de login del admin
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Panel de Administración</h1>
                <p className="text-sm text-gray-500">MiKioskoDigital</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar datos
              </Button>
              <Link href="/admin/stores/new">
                <Button className="bg-red-600 hover:bg-red-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear nueva tienda
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      A
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tiendas</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Cargando...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalStores}</div>
                  <p className="text-xs text-muted-foreground">{stats.activeStores} activas</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiendas Activas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Cargando...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.activeStores}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalStores > 0 ? Math.round((stats.activeStores / stats.totalStores) * 100) : 0}% del total
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Cargando...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">${(stats.totalRevenue / 1000000).toFixed(1)}M</div>
                  <p className="text-xs text-muted-foreground">este mes</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Cargando...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalProducts}</div>
                  <p className="text-xs text-muted-foreground">en todas las tiendas</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stores Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Tiendas Registradas</CardTitle>
                <CardDescription>Gestiona todas las tiendas de la plataforma</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Link href="/admin/stores/new">
                  <Button className="bg-red-600 hover:bg-red-700" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva tienda
                  </Button>
                </Link>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar tiendas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span className="text-lg">Cargando tiendas...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tienda</TableHead>
                      <TableHead>Propietario</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Productos</TableHead>
                      <TableHead>Ingresos/Mes</TableHead>
                      <TableHead>Último acceso</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                          {searchTerm ? 'No se encontraron tiendas que coincidan con la búsqueda' : 'No hay tiendas registradas'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStores.map((store) => (
                        <TableRow key={store.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{store.name}</div>
                              <div className="text-sm text-gray-500">{store.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{store.owner}</div>
                              <div className="text-sm text-gray-500">{store.phone || 'No especificado'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                              {store.city || 'No especificada'}
                            </div>
                          </TableCell>
                          <TableCell>{getPlanBadge(store.plan)}</TableCell>
                          <TableCell>{getStatusBadge(store.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Package className="h-4 w-4 mr-1 text-gray-400" />
                              {store.products_count}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-green-600">${store.monthly_revenue.toLocaleString()}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(store.last_login).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/stores/${store.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver detalles
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/store/${store.name.toLowerCase().replace(/\s+/g, "-")}`}>
                                    <Store className="h-4 w-4 mr-2" />
                                    Ver tienda pública
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">Suspender tienda</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
