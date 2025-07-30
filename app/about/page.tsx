"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Store, Users, Shield, Zap, Heart, Star, Moon, Sun, Target, Award, Globe, Lightbulb, CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AboutPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const values = [
    {
      icon: Target,
      title: "Misión",
      description: "Democratizar el comercio electrónico para que cualquier emprendedor pueda crear y gestionar su tienda digital de manera fácil y profesional."
    },
    {
      icon: Lightbulb,
      title: "Visión",
      description: "Ser la plataforma líder en Latinoamérica para el comercio digital local, conectando emprendedores con sus comunidades."
    },
    {
      icon: Heart,
      title: "Valores",
      description: "Innovación, simplicidad, accesibilidad y compromiso con el crecimiento de los pequeños y medianos negocios."
    }
  ]

  const stats = [
    { number: "10,000+", label: "Tiendas Creadas" },
    { number: "500,000+", label: "Productos Vendidos" },
    { number: "50+", label: "Ciudades" },
    { number: "99.9%", label: "Uptime" }
  ]

  const team = [
    {
      name: "María González",
      role: "CEO & Fundadora",
      description: "15 años de experiencia en e-commerce y tecnología. Ex-directora de producto en Amazon México.",
      image: "/team-ceo.jpg"
    },
    {
      name: "Carlos Rodríguez",
      role: "CTO",
      description: "Ingeniero en sistemas con especialización en arquitecturas escalables y seguridad web.",
      image: "/team-cto.jpg"
    },
    {
      name: "Ana Martínez",
      role: "Head of Design",
      description: "Diseñadora UX/UI con pasión por crear experiencias digitales intuitivas y accesibles.",
      image: "/team-design.jpg"
    },
    {
      name: "Luis Hernández",
      role: "Head of Growth",
      description: "Especialista en marketing digital y growth hacking para startups tecnológicas.",
      image: "/team-growth.jpg"
    }
  ]

  const milestones = [
    {
      year: "2023",
      title: "Fundación",
      description: "Nace e-vendify con la visión de democratizar el comercio electrónico en México."
    },
    {
      year: "2024",
      title: "Primeras 1,000 tiendas",
      description: "Alcanzamos nuestro primer gran hito con más de 1,000 tiendas activas en la plataforma."
    },
    {
      year: "2024",
      title: "Expansión regional",
      description: "Expandimos nuestros servicios a 5 países de Latinoamérica."
    },
    {
      year: "2025",
      title: "Inteligencia Artificial",
      description: "Lanzamos nuestro asistente de IA para optimizar ventas y atención al cliente."
    }
  ]

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
              <Link href="/" className="flex items-center">
                <img 
                  src={isDarkMode ? "/vendify_dark.png" : "/vendify_white.png"} 
                  alt="Vendify Logo" 
                  className="transition-opacity duration-300" 
                  style={{ height: "200px", width: "auto" }}
                />
              </Link>
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
                <Button variant="ghost" className={isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : ''}>
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/register">
                <Button className={isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : ''}>
                  Registrarse
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className={`mb-4 transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' 
                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
            }`}>
              🚀 Nuestra Historia
            </Badge>
            <h1 className={`text-4xl lg:text-6xl font-bold mb-6 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Construyendo el Futuro del
              <br />
              <span className="text-blue-600">Comercio Digital</span>
            </h1>
            <p className={`text-xl mb-8 max-w-3xl mx-auto transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Somos un equipo apasionado por democratizar el comercio electrónico, 
              haciendo que cualquier emprendedor pueda crear y gestionar su tienda digital 
              de manera profesional y accesible.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-3xl lg:text-4xl font-bold mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {stat.number}
                </div>
                <div className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className={`py-20 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl lg:text-4xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Nuestros Pilares
            </h2>
            <p className={`text-xl transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Los valores que guían cada decisión que tomamos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className={`text-center transition-all duration-300 hover:shadow-lg ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' 
                  : 'bg-white border-gray-200 hover:shadow-xl'
              }`}>
                <CardHeader>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300 ${
                    isDarkMode ? 'bg-blue-900' : 'bg-blue-100'
                  }`}>
                    <value.icon className={`h-8 w-8 transition-colors duration-300 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                  <CardTitle className={`text-2xl transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {value.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl lg:text-4xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Nuestro Camino
            </h2>
            <p className={`text-xl transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Los hitos más importantes en nuestra historia
            </p>
          </div>

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-start">
                <div className={`flex-shrink-0 w-24 text-right mr-8 transition-colors duration-300 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  <div className="text-lg font-bold">{milestone.year}</div>
                </div>
                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-600 mt-2 mr-8"></div>
                <div className="flex-1">
                  <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {milestone.title}
                  </h3>
                  <p className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {milestone.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className={`py-20 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl lg:text-4xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Nuestro Equipo
            </h2>
            <p className={`text-xl transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Las personas que hacen posible e-vendify
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className={`text-center transition-all duration-300 hover:shadow-lg ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' 
                  : 'bg-white border-gray-200 hover:shadow-xl'
              }`}>
                <CardContent className="p-6">
                  <div className="w-24 h-24 rounded-full bg-gray-300 mx-auto mb-4 flex items-center justify-center">
                    <Users className={`h-12 w-12 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                  </div>
                  <h3 className={`text-xl font-semibold mb-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {member.name}
                  </h3>
                  <p className={`text-sm font-medium mb-3 transition-colors duration-300 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {member.role}
                  </p>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {member.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-3xl lg:text-4xl font-bold mb-6 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            ¿Quieres Ser Parte de Nuestra Historia?
          </h2>
          <p className={`text-xl mb-8 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Únete a miles de emprendedores que ya están transformando sus negocios con e-vendify
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                Comenzar mi Tienda
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className={`px-8 py-3 transition-colors duration-300 ${
                isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}>
                Contáctanos
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
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-blue-400 mr-3" />
              <span className={`text-2xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-gray-100' : 'text-white'
              }`}>e-vendify</span>
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
