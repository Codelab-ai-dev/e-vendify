"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Store, Users, Shield, Zap, Heart, Star, Moon, Sun, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      {/* Header */}
      <header className={`backdrop-blur-md border-b sticky top-0 z-50 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-900/80 border-gray-700' 
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <img 
                src={isDarkMode ? "vendify_dark.png" : "vendify_white.png"} 
                alt="Vendify Logo" 
                className="transition-opacity duration-300" 
                style={{ height: "200px", width: "auto" }}
              />
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className={`p-2 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Link href="/login">
                <Button  variant="ghost" className={ isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : ''}>Iniciar Sesión</Button>
              </Link>
              <Link href="/register">
                <Button className={isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : ''}>Registrarse</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className={`mb-4 transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' 
                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
            }`}>
              🚀 Plataforma Digital Innovadora
            </Badge>
            <h1 className={`text-4xl lg:text-6xl font-poppins font-bold mb-6 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Tu <span className="text-blue-600">Tienda Digital</span>
              <br />
              en la Palma de tu Mano
            </h1>
            <p className={`text-xl mb-8 font-inter max-w-3xl mx-auto transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Transforma tu negocio local en una experiencia digital moderna. 
              Conecta con tus clientes, gestiona tu inventario y haz crecer tu emprendimiento 
              con nuestra plataforma todo-en-uno.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                  Comenzar Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="px-8 py-3">
                  Ver Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-20 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl font-poppins lg:text-4xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              ¿Por qué elegir e-vendify?
            </h2>
            <p className={`text-xl font-inter max-w-2xl mx-auto transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Ofrecemos las herramientas que necesitas para digitalizar y hacer crecer tu negocio local
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
              isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'
            }`}>
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'bg-blue-900' : 'bg-blue-100'
                }`}>
                  <Store className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className={`text-xl transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Gestión de Tienda</CardTitle>
                <CardDescription className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Administra tu inventario, productos y ventas desde un panel intuitivo y fácil de usar.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
              isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'
            }`}>
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'bg-green-900' : 'bg-green-100'
                }`}>
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className={`text-xl transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Conexión con Clientes</CardTitle>
                <CardDescription className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Mantén una relación cercana con tus clientes a través de notificaciones y promociones personalizadas.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
              isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'
            }`}>
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'bg-purple-900' : 'bg-purple-100'
                }`}>
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className={`text-xl transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Rápido y Eficiente</CardTitle>
                <CardDescription className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Procesa pedidos y pagos de manera instantánea con nuestra tecnología optimizada.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
              isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'
            }`}>
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'bg-red-900' : 'bg-red-100'
                }`}>
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className={`text-xl transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Seguro y Confiable</CardTitle>
                <CardDescription className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Protegemos tus datos y transacciones con los más altos estándares de seguridad.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 5 */}
            <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
              isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'
            }`}>
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'bg-yellow-900' : 'bg-yellow-100'
                }`}>
                  <Heart className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle className={`text-xl transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Apoyo Local</CardTitle>
                <CardDescription className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Diseñado especialmente para emprendedores y pequeños negocios que quieren crecer.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 6 */}
            <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
              isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'
            }`}>
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'bg-indigo-900' : 'bg-indigo-100'
                }`}>
                  <Star className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle className={`text-xl transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Experiencia Premium</CardTitle>
                <CardDescription className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Interfaz moderna y atractiva que mejora la experiencia tanto para ti como para tus clientes.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className={`py-20 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl lg:text-4xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Planes que se Adaptan a tu Negocio
            </h2>
            <p className={`text-xl max-w-2xl mx-auto transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Desde emprendedores que inician hasta empresas en crecimiento, tenemos el plan perfecto para ti
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Plan Básico */}
            <Card className={`relative border-2 transition-all duration-300 hover:shadow-xl ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}>
              <CardHeader className="text-center pb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'bg-blue-900' : 'bg-blue-100'
                }`}>
                  <Store className={`h-8 w-8 transition-colors duration-300 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <CardTitle className={`text-2xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Básico</CardTitle>
                <div className={`mt-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <span className="text-4xl font-bold">$299</span>
                  <span className="text-lg">/mes</span>
                </div>
                <p className={`mt-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Perfecto para emprendedores</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className={`flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Hasta 10 productos</span>
                  </div>
                  <div className={`flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Dominio personalizado</span>
                  </div>
                  <div className={`flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Soporte por email</span>
                  </div>
                  <div className={`flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Analytics básicos</span>
                  </div>
                  <div className={`flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>SSL incluido</span>
                  </div>
                </div>
                <div className="pt-6">
                  <Link href="/register">
                    <Button className={`w-full transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}>
                      Comenzar Gratis
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Plan Pro */}
            <Card className={`relative border-2 transition-all duration-300 hover:shadow-xl ${
              isDarkMode 
                ? 'bg-gray-800 border-blue-500 hover:border-blue-400' 
                : 'bg-white border-blue-500 hover:border-blue-600'
            }`}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600 text-white px-4 py-1 text-sm font-medium">
                  Más Popular
                </Badge>
              </div>
              <CardHeader className="text-center pb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'bg-blue-600' : 'bg-blue-600'
                }`}>
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <CardTitle className={`text-2xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Pro</CardTitle>
                <div className={`mt-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <span className="text-4xl font-bold">$599</span>
                  <span className="text-lg">/mes</span>
                </div>
                <p className={`mt-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Para negocios en crecimiento</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className={`flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Hasta 100 productos</span>
                  </div>
                  <div className={`flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Dominio personalizado</span>
                  </div>
                  <div className={`flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Soporte prioritario</span>
                  </div>
                  <div className={`flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Analytics avanzados</span>
                  </div>
                  <div className={`flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Integraciones API</span>
                  </div>
                  <div className={`flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Marketing automation</span>
                  </div>
                </div>
                <div className="pt-6">
                  <Link href="/register">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      Empezar Prueba Gratis
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Plan Enterprise */}
            <Card className={`relative border-2 transition-all duration-300 hover:shadow-xl ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}>
              <CardHeader className="text-center pb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'bg-purple-900' : 'bg-purple-100'
                }`}>
                  <Star className={`h-8 w-8 transition-colors duration-300 ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                </div>
                <CardTitle className={`text-2xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Enterprise</CardTitle>
                <div className={`mt-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <span className="text-4xl font-bold">$1,299</span>
                  <span className="text-lg">/mes</span>
                </div>
                <p className={`mt-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Para empresas establecidas</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className={`flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Productos ilimitados</span>
                  </div>
                  <div className={`flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Múltiples dominios</span>
                  </div>
                  <div className={`flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Soporte 24/7</span>
                  </div>
                  <div className={`flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Analytics empresariales</span>
                  </div>
                  <div className={`flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>API completa</span>
                  </div>
                  <div className={`flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Gestor de cuenta dedicado</span>
                  </div>
                </div>
                <div className="pt-6">
                  <Link href="/contact">
                    <Button variant="outline" className={`w-full transition-colors duration-300 ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}>
                      Contactar Ventas
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Todos los planes incluyen prueba gratuita de 14 días • Sin compromiso • Cancela cuando quieras
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-20 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-gray-800 to-gray-900' 
          : 'bg-gradient-to-r from-blue-600 to-purple-600'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            ¿Listo para digitalizar tu negocio?
          </h2>
          <p className={`text-xl mb-8 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-blue-100'
          }`}>
            Únete a cientos de emprendedores que ya están creciendo con MiKiosko Digital
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3">
                Crear mi e-vendify Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 transition-colors duration-300 ${
        isDarkMode ? 'bg-black text-gray-300' : 'bg-gray-900 text-white'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div>
            <div className="flex items-center justify-center">
              <img
                src="/e-vendify-logo-tight.webp"
                alt="e-vendify"
                style={{ height: "80px", width: "auto", marginBottom: "30px" }}
              />
            </div>
            <p className={`mb-6 max-w-2xl mx-auto transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-400'
            }`}>
              Empoderando a los emprendedores locales con tecnología digital moderna 
              para hacer crecer sus negocios y conectar mejor con sus clientes.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/demo" className={`transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-white'
              }`}>Demo</Link>
              <Link href="/about" className={`transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-white'
              }`}>Acerca de</Link>
              <Link href="/contact" className={`transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-white'
              }`}>Contacto</Link>
            </div>
          </div>
          <div className={`mt-8 pt-8 text-center transition-colors duration-300 ${
            isDarkMode ? 'border-t border-gray-700 text-gray-500' : 'border-t border-gray-800 text-gray-400'
          }`}>
            <p>&copy; 2025 e-vendify. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
