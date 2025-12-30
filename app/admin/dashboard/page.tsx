"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  Store,
  DollarSign,
  TrendingUp,
  Eye,
  Search,
  Shield,
  LogOut,
  Package,
  Calendar,
  MapPin,
  Plus,
  Menu,
  X,
  ExternalLink,
  MoreHorizontal,
} from "lucide-react"
import { getAllStores, getDashboardStats, type Store as StoreType } from "@/lib/stores"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

export const dynamic = 'force-dynamic'

export default function AdminDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const [stores, setStores] = useState<StoreType[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [focusedSearch, setFocusedSearch] = useState(false)
  const [stats, setStats] = useState({
    totalStores: 0,
    activeStores: 0,
    totalRevenue: 0,
    totalProducts: 0
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        const { data: storesData, error: storesError } = await getAllStores()
        if (storesError) {
          console.error('Error loading stores:', storesError)
          return
        }

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

  const filteredStores = stores.filter(
    (store) =>
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (store.city && store.city.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/admin/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-foreground border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-mono text-sm">Verificando...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b-2 border-border sticky top-0 z-50 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <Link href="/">
                <Image
                  src={theme === 'dark' ? '/e-logo-oscuro.png' : '/logo-ev-claro.png'}
                  alt="e-vendify"
                  width={160}
                  height={45}
                  className={theme === 'dark' ? 'h-10 w-auto hidden sm:block' : 'h-8 w-auto hidden sm:block'}
                />
              </Link>
              <div className="hidden sm:block w-px h-8 bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-display font-bold text-lg">Admin</h1>
                  <p className="text-xs text-muted-foreground font-mono">Panel de control</p>
                </div>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/admin/stores/new"
                className="btn-brutal px-4 py-2 text-sm inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nueva tienda
              </Link>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-10 h-10 border-2 border-border flex items-center justify-center hover:border-foreground transition-colors"
              >
                {theme === 'dark' ? '○' : '●'}
              </button>
              <button
                onClick={handleLogout}
                className="w-10 h-10 border-2 border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 border-2 border-border flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t-2 border-border bg-background p-4 space-y-3"
          >
            <Link
              href="/admin/stores/new"
              className="btn-brutal w-full py-3 inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nueva tienda
            </Link>
            <div className="flex gap-3">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex-1 py-3 border-2 border-border flex items-center justify-center gap-2"
              >
                {theme === 'dark' ? '○ Claro' : '● Oscuro'}
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 border-2 border-border flex items-center justify-center gap-2 hover:border-primary hover:text-primary"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border-2 border-border p-6 hover:border-foreground transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="label-mono">Tiendas</span>
              <Store className="w-5 h-5 text-primary" />
            </div>
            {loading ? (
              <div className="h-10 w-20 bg-muted animate-pulse" />
            ) : (
              <>
                <div className="font-display font-bold text-4xl mb-1">{stats.totalStores}</div>
                <p className="text-sm text-muted-foreground">{stats.activeStores} activas</p>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border-2 border-border p-6 hover:border-foreground transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="label-mono">Activas</span>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            {loading ? (
              <div className="h-10 w-20 bg-muted animate-pulse" />
            ) : (
              <>
                <div className="font-display font-bold text-4xl mb-1">{stats.activeStores}</div>
                <p className="text-sm text-muted-foreground">
                  {stats.totalStores > 0 ? Math.round((stats.activeStores / stats.totalStores) * 100) : 0}% del total
                </p>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border-2 border-primary p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="label-mono">Ingresos</span>
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            {loading ? (
              <div className="h-10 w-24 bg-muted animate-pulse" />
            ) : (
              <>
                <div className="font-display font-bold text-4xl mb-1 text-primary">
                  ${(stats.totalRevenue / 1000000).toFixed(1)}M
                </div>
                <p className="text-sm text-muted-foreground">este mes</p>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="border-2 border-border p-6 hover:border-foreground transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="label-mono">Productos</span>
              <Package className="w-5 h-5 text-primary" />
            </div>
            {loading ? (
              <div className="h-10 w-20 bg-muted animate-pulse" />
            ) : (
              <>
                <div className="font-display font-bold text-4xl mb-1">{stats.totalProducts}</div>
                <p className="text-sm text-muted-foreground">en plataforma</p>
              </>
            )}
          </motion.div>
        </div>

        {/* Stores Section */}
        <div className="border-2 border-border">
          {/* Header */}
          <div className="border-b-2 border-border p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h2 className="font-display font-bold text-2xl">Tiendas registradas</h2>
                <p className="text-muted-foreground text-sm">Gestiona todas las tiendas de la plataforma</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                {/* Search */}
                <div className={`relative border-2 transition-colors ${focusedSearch ? 'border-primary' : 'border-border'}`}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar tiendas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setFocusedSearch(true)}
                    onBlur={() => setFocusedSearch(false)}
                    className="w-full sm:w-64 pl-10 pr-4 py-3 bg-transparent focus:outline-none"
                  />
                </div>
                <Link
                  href="/admin/stores/new"
                  className="btn-brutal px-4 py-3 inline-flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nueva tienda
                </Link>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-foreground border-t-transparent animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Cargando tiendas...</p>
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 border-2 border-border flex items-center justify-center mx-auto mb-6">
                <Store className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2">
                {searchTerm ? 'Sin resultados' : 'Sin tiendas'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm ? 'No se encontraron tiendas que coincidan' : 'No hay tiendas registradas'}
              </p>
              {!searchTerm && (
                <Link href="/admin/stores/new" className="btn-brutal px-6 py-3 inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Crear primera tienda
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <table className="w-full hidden lg:table">
                <thead className="border-b-2 border-border bg-muted/30">
                  <tr>
                    <th className="text-left p-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">Tienda</th>
                    <th className="text-left p-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">Propietario</th>
                    <th className="text-left p-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">Ubicacion</th>
                    <th className="text-left p-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">Plan</th>
                    <th className="text-left p-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">Estado</th>
                    <th className="text-left p-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">Productos</th>
                    <th className="text-left p-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">Ingresos</th>
                    <th className="text-left p-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStores.map((store, i) => (
                    <motion.tr
                      key={store.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border hover:bg-muted/20 transition-colors"
                    >
                      <td className="p-4">
                        <div>
                          <div className="font-display font-bold">{store.name}</div>
                          <div className="text-sm text-muted-foreground">{store.email}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{store.owner}</div>
                          <div className="text-sm text-muted-foreground">{store.phone || '-'}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {store.city || '-'}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 text-xs font-mono font-bold ${
                          store.plan === 'premium'
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-border'
                        }`}>
                          {store.plan === 'premium' ? 'PREMIUM' : 'BASICO'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 text-xs font-mono ${
                          store.status === 'active'
                            ? 'bg-foreground text-background'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {store.status === 'active' ? 'ACTIVA' : 'INACTIVA'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono">{store.products_count}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-bold text-primary">
                          ${store.monthly_revenue.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/stores/${store.id}`}
                            className="px-3 py-2 border-2 border-border hover:border-foreground transition-colors text-sm"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/store/${store.slug || store.id}`}
                            target="_blank"
                            className="px-3 py-2 border-2 border-border hover:border-primary hover:text-primary transition-colors text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Cards */}
              <div className="lg:hidden divide-y-2 divide-border">
                {filteredStores.map((store, i) => (
                  <motion.div
                    key={store.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-display font-bold text-lg">{store.name}</h3>
                        <p className="text-sm text-muted-foreground">{store.owner}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-mono ${
                        store.status === 'active'
                          ? 'bg-foreground text-background'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {store.status === 'active' ? 'ACTIVA' : 'INACTIVA'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 text-xs font-mono font-bold ${
                        store.plan === 'premium'
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-border'
                      }`}>
                        {store.plan === 'premium' ? 'PREMIUM' : 'BASICO'}
                      </span>
                      <span className="px-3 py-1 text-xs border border-border flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {store.city || '-'}
                      </span>
                      <span className="px-3 py-1 text-xs border border-border flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {store.products_count}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="font-mono font-bold text-primary text-lg">
                        ${store.monthly_revenue.toLocaleString()}/mes
                      </span>
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/stores/${store.id}`}
                          className="px-4 py-2 border-2 border-border hover:border-foreground transition-colors text-sm inline-flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </Link>
                        <Link
                          href={`/store/${store.slug || store.id}`}
                          target="_blank"
                          className="px-4 py-2 border-2 border-border hover:border-primary hover:text-primary transition-colors text-sm inline-flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <Link href="/">
              <Image
                src={theme === 'dark' ? '/e-logo-oscuro.png' : '/logo-ev-claro.png'}
                alt="e-vendify"
                width={120}
                height={35}
                className={theme === 'dark' ? 'h-8 w-auto opacity-60 hover:opacity-100 transition-opacity' : 'h-6 w-auto opacity-60 hover:opacity-100 transition-opacity'}
              />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary animate-pulse" />
              <span className="font-mono text-xs">Admin Panel</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
