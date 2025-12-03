"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Package,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  MessageCircle,
  Shield,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Mock data para una tienda específica
const mockStoreDetail = {
  id: 1,
  name: "Panadería San José",
  owner: "María González",
  email: "maria@panaderiasanjose.com",
  phone: "573001234567",
  address: "Calle 123 #45-67, Bogotá",
  city: "Bogotá",
  registeredDate: "2024-01-15",
  status: "active",
  plan: "premium",
  lastLogin: "2024-01-20",
  description: "Panadería artesanal con más de 20 años de tradición familiar",
  logo: "/placeholder.svg?height=100&width=100&text=Logo",
  monthlyStats: {
    revenue: 2500000,
    orders: 156,
    products: 12,
    views: 1240,
  },
  products: [
    {
      id: 1,
      name: "Pan integral artesanal",
      price: 2500,
      image: "/placeholder.svg?height=60&width=60&text=Pan",
      status: "active",
      createdDate: "2024-01-16",
    },
    {
      id: 2,
      name: "Croissant de mantequilla",
      price: 1800,
      image: "/placeholder.svg?height=60&width=60&text=Croissant",
      status: "active",
      createdDate: "2024-01-17",
    },
    {
      id: 3,
      name: "Torta de chocolate",
      price: 15000,
      image: "/placeholder.svg?height=60&width=60&text=Torta",
      status: "inactive",
      createdDate: "2024-01-18",
    },
  ],
  recentActivity: [
    { date: "2024-01-20", action: "Producto agregado", detail: "Pan integral artesanal" },
    { date: "2024-01-19", action: "Inicio de sesión", detail: "Acceso desde móvil" },
    { date: "2024-01-18", action: "Producto editado", detail: "Torta de chocolate" },
    { date: "2024-01-17", action: "Pedido recibido", detail: "Croissant de mantequilla" },
  ],
}

export default function StoreDetailPage() {
  const params = useParams()
  const [store] = useState(mockStoreDetail)

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

  const getProductStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        Activo
      </Badge>
    ) : (
      <Badge variant="secondary">Inactivo</Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al panel
              </Button>
            </Link>
            <Shield className="h-6 w-6 text-red-600 mr-3" />
            <h1 className="text-xl font-semibold text-gray-900">Detalles de la tienda</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Store Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <img
                src={store.logo || "/placeholder.svg"}
                alt={`Logo de ${store.name}`}
                className="w-20 h-20 rounded-full object-cover border-4 border-gray-100"
              />
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{store.name}</h2>
                    <p className="text-gray-600 mb-4">{store.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {getStatusBadge(store.status)}
                      {getPlanBadge(store.plan)}
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
                    <Link href={`/store/${store.name.toLowerCase().replace(/\s+/g, "-")}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver tienda pública
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Suspender tienda
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${store.monthlyStats.revenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+12% vs mes anterior</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{store.monthlyStats.orders}</div>
              <p className="text-xs text-muted-foreground">este mes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{store.monthlyStats.products}</div>
              <p className="text-xs text-muted-foreground">en catálogo</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visualizaciones</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{store.monthlyStats.views}</div>
              <p className="text-xs text-muted-foreground">este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList>
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="activity">Actividad</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información del Propietario</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">{store.owner}</p>
                      <p className="text-sm text-gray-500">Propietario</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">{store.email}</p>
                      <p className="text-sm text-gray-500">Correo electrónico</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">{store.phone}</p>
                      <p className="text-sm text-gray-500">Teléfono</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Información de la Tienda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">{store.address}</p>
                      <p className="text-sm text-gray-500">Dirección</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">{new Date(store.registeredDate).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">Fecha de registro</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">{new Date(store.lastLogin).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">Último acceso</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Productos de la Tienda</CardTitle>
                <CardDescription>Lista completa de productos en el catálogo</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha de creación</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {store.products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <img
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                            <div>
                              <p className="font-medium">{product.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">${product.price.toLocaleString()}</span>
                        </TableCell>
                        <TableCell>{getProductStatusBadge(product.status)}</TableCell>
                        <TableCell>{new Date(product.createdDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Historial de acciones de la tienda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {store.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-gray-500">{activity.detail}</p>
                      </div>
                      <div className="text-sm text-gray-400">{new Date(activity.date).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
