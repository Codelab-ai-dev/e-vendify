"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { ArrowRight, Store, Users, Shield, Zap, Heart, Star, Moon, Sun, CheckCircle, Smartphone, BarChart3, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')
  const { scrollYProgress } = useScroll()

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    // In a real app, you'd use a theme provider context here
    document.documentElement.classList.toggle('dark')
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100
      }
    }
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-blue-500/30 ${isDarkMode
      ? 'bg-slate-950 text-slate-50'
      : 'bg-slate-50 text-slate-900'
      }`}>

      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-30 animate-pulse ${isDarkMode ? 'bg-blue-600' : 'bg-blue-400'
          }`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-30 animate-pulse delay-1000 ${isDarkMode ? 'bg-purple-600' : 'bg-purple-400'
          }`} />
      </div>

      {/* Navbar */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? isDarkMode ? 'bg-slate-950/80 backdrop-blur-lg border-b border-slate-800' : 'bg-white/80 backdrop-blur-lg border-b border-slate-200'
          : 'bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <img
                src="/e-vendify-tight-no-tagline.webp"
                alt="E-Vendify"
                className="h-12 w-auto"
              />
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-sm font-medium hover:text-blue-600 transition-colors">Características</Link>
              <Link href="#pricing" className="text-sm font-medium hover:text-blue-600 transition-colors">Precios</Link>
              <Link href="/about" className="text-sm font-medium hover:text-blue-600 transition-colors">Nosotros</Link>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
              >
                <AnimatePresence mode="wait">
                  {isDarkMode ? (
                    <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                      <Sun className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                      <Moon className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
              <div className="hidden sm:flex gap-3">
                <Link href="/login">
                  <Button variant="ghost" className="font-medium">Iniciar Sesión</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 border-0">
                    Registrarse
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="text-center lg:text-left z-10"
            >
              <motion.div variants={itemVariants}>
                <Badge variant="outline" className="mb-6 px-4 py-1.5 rounded-full border-blue-500/30 bg-blue-500/10 text-blue-600 backdrop-blur-sm">
                  <span className="mr-2">🚀</span> La revolución del comercio local
                </Badge>
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                Tu negocio, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient-x">
                  sin límites.
                </span>
              </motion.h1>

              <motion.p variants={itemVariants} className={`text-xl mb-8 max-w-2xl mx-auto lg:mx-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Transforma tu tienda física en una potencia digital. Gestiona inventario, conecta con clientes y vende 24/7 con la plataforma más intuitiva del mercado.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl shadow-blue-600/20 transition-all hover:scale-105">
                    Comenzar Gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-lg rounded-full border-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105">
                    Ver Demo
                  </Button>
                </Link>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-10 flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-500">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${isDarkMode ? 'border-slate-950 bg-slate-800' : 'border-white bg-slate-100'}`}>
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <p>+500 negocios confían en nosotros</p>
              </motion.div>
            </motion.div>

            <motion.div
              style={{ opacity, scale }}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative lg:h-[600px] flex items-center justify-center"
            >
              <div className="relative w-full max-w-lg aspect-square">
                {/* Abstract decorative elements */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />

                {/* Main Dashboard Preview Card */}
                <div className={`relative z-10 w-full h-full rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-sm ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'
                  }`}>
                  <div className="p-4 border-b flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="p-6 grid gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <div className="text-sm text-slate-500 mb-1">Ventas Totales</div>
                        <div className="text-2xl font-bold">$12,450</div>
                        <div className="text-xs text-green-500 mt-1">+15% vs mes anterior</div>
                      </div>
                      <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <div className="text-sm text-slate-500 mb-1">Pedidos Activos</div>
                        <div className="text-2xl font-bold">24</div>
                        <div className="text-xs text-blue-500 mt-1">8 pendientes de envío</div>
                      </div>
                    </div>
                    <div className={`h-32 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'} flex items-end p-4 gap-2`}>
                      {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                          className="flex-1 bg-blue-500 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className={`absolute -right-8 top-20 p-4 rounded-xl shadow-xl border backdrop-blur-md z-20 ${isDarkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-slate-100'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold">Nueva Venta!</div>
                      <div className="text-xs text-slate-500">Hace 2 minutos</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 20, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className={`absolute -left-8 bottom-20 p-4 rounded-xl shadow-xl border backdrop-blur-md z-20 ${isDarkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-slate-100'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold">+150 Clientes</div>
                      <div className="text-xs text-slate-500">Esta semana</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section (Bento Grid) */}
      <section id="features" className={`py-24 ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50/50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">Todo lo que necesitas</h2>
            <p className={`text-xl max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Herramientas potentes diseñadas para simplificar tu vida y potenciar tu negocio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Feature 1 - Large */}
            <motion.div
              whileHover={{ y: -5 }}
              className={`md:col-span-2 row-span-1 rounded-3xl p-8 relative overflow-hidden group ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                } border shadow-lg`}
            >
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 text-blue-500">
                  <Store className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Gestión Integral</h3>
                <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                  Control total de tu inventario, ventas y clientes desde un solo lugar. Sincronización en tiempo real.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 w-1/2 h-full bg-gradient-to-l from-blue-500/10 to-transparent group-hover:from-blue-500/20 transition-all duration-500" />
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              whileHover={{ y: -5 }}
              className={`rounded-3xl p-8 relative overflow-hidden group ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                } border shadow-lg`}
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4 text-purple-500">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Mobile First</h3>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Tu tienda se ve increíble en cualquier dispositivo.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              whileHover={{ y: -5 }}
              className={`rounded-3xl p-8 relative overflow-hidden group ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                } border shadow-lg`}
            >
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4 text-green-500">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Analytics</h3>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Decisiones basadas en datos reales y tendencias.
              </p>
            </motion.div>

            {/* Feature 4 - Large */}
            <motion.div
              whileHover={{ y: -5 }}
              className={`md:col-span-2 row-span-1 rounded-3xl p-8 relative overflow-hidden group ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                } border shadow-lg`}
            >
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-4 text-pink-500">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Vende en todas partes</h3>
                <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                  Comparte tu catálogo en redes sociales, WhatsApp y más con enlaces inteligentes.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 w-1/2 h-full bg-gradient-to-l from-pink-500/10 to-transparent group-hover:from-pink-500/20 transition-all duration-500" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">Planes Flexibles</h2>
            <p className={`text-xl ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mb-8`}>
              Elige el periodo que mejor se adapte a tu crecimiento.
            </p>

            {/* Billing Cycle Toggle */}
            <div className="flex justify-center items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-full w-fit mx-auto">
              {(['monthly', 'quarterly', 'yearly'] as const).map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => setBillingCycle(cycle)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === cycle
                    ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                    }`}
                >
                  {cycle === 'monthly' && 'Mensual'}
                  {cycle === 'quarterly' && 'Trimestral'}
                  {cycle === 'yearly' && 'Anual'}
                </button>
              ))}
            </div>
            {billingCycle !== 'monthly' && (
              <p className="text-sm text-green-500 font-medium mt-3 animate-pulse">
                {billingCycle === 'quarterly' ? '¡Ahorra un 10%!' : '¡Ahorra un 20% (2 meses gratis)!'}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Emprendedor",
                prices: { monthly: 299, quarterly: 800, yearly: 2990 },
                desc: "Para validar tu idea de negocio",
                features: ["10 Productos", "Dominio personalizado", "Pagos por WhatsApp", "Soporte por Email"],
                color: "blue"
              },
              {
                name: "Negocio Pro",
                prices: { monthly: 599, quarterly: 1600, yearly: 5990 },
                desc: "Para tiendas en crecimiento activo",
                features: ["Productos ilimitados", "Panel de Analytics", "Soporte Prioritario", "Gestión de Inventario", "Códigos de Descuento"],
                color: "purple",
                popular: true
              },
              {
                name: "Enterprise IA",
                prices: { monthly: 1499, quarterly: 4000, yearly: 14990 },
                desc: "Automatización total con IA",
                features: ["Todo lo de Pro", "Agentes de Ventas IA", "Respuestas Automáticas 24/7", "CRM Integrado", "Consultoría de Automatización"],
                color: "pink"
              }
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className={`relative rounded-3xl p-8 border flex flex-col ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
                  } ${plan.popular ? 'ring-2 ring-purple-500 shadow-2xl shadow-purple-500/20' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    Más Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${plan.prices[billingCycle].toLocaleString()}
                    </span>
                    <span className="text-sm text-slate-500">
                      /{billingCycle === 'monthly' ? 'mes' : billingCycle === 'quarterly' ? 'trimestre' : 'año'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">{plan.desc}</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm">
                      <CheckCircle className={`w-5 h-5 text-${plan.color}-500 shrink-0`} />
                      <span className={feature.includes("IA") || feature.includes("n8n") ? "font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500" : ""}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button className={`w-full rounded-xl py-6 ${plan.popular
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25'
                  : isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                  }`}>
                  Elegir Plan
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`} />
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring" }}
            className={`rounded-3xl p-12 ${isDarkMode
              ? 'bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700'
              : 'bg-white border border-slate-200'
              } shadow-2xl`}
          >
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              ¿Listo para el siguiente nivel?
            </h2>
            <p className={`text-xl mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Únete a la comunidad de emprendedores que están redefiniendo el comercio local.
            </p>
            <Link href="/register">
              <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/30 transition-all hover:scale-105">
                Crear mi tienda ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 border-t ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img
                  src="/e-vendify-tight-no-tagline.webp"
                  alt="E-Vendify"
                  className="h-10 w-auto"
                />
              </div>
              <p className={`max-w-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Empoderando negocios locales con tecnología de clase mundial.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Producto</h4>
              <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <li><Link href="#" className="hover:text-blue-500">Características</Link></li>
                <li><Link href="#" className="hover:text-blue-500">Precios</Link></li>
                <li><Link href="#" className="hover:text-blue-500">Guías</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <li><Link href="#" className="hover:text-blue-500">Privacidad</Link></li>
                <li><Link href="#" className="hover:text-blue-500">Términos</Link></li>
              </ul>
            </div>
          </div>
          <div className={`pt-8 border-t text-center text-sm ${isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
            &copy; 2025 E-Vendify. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
