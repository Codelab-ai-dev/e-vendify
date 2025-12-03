"use client"

import { useState } from "react"
import Link from "next/link"
import { Store, Moon, Sun, Mail, MessageCircle, Send, ArrowRight, Phone, Clock, HelpCircle, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function ContactPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  })

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Formulario enviado:', formData)
    alert('¡Gracias por tu mensaje! Te contactaremos pronto.')
    setFormData({
      name: '',
      email: '',
      company: '',
      subject: '',
      message: ''
    })
  }

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Directo",
      description: "Respuesta en 2-4 horas",
      contact: "hola@e-vendify.com",
      action: "mailto:hola@e-vendify.com",
      color: "bg-blue-500"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      description: "Chat inmediato",
      contact: "+52 55 9876 5432",
      action: "https://wa.me/525598765432",
      color: "bg-green-500"
    }
  ]

  const faqs = [
    {
      question: "¿Cuánto tiempo toma configurar mi tienda?",
      answer: "Puedes tener tu tienda funcionando en menos de 30 minutos con nuestro proceso guiado."
    },
    {
      question: "¿Qué soporte técnico ofrecen?",
      answer: "Soporte 24/7 por chat, email y WhatsApp, más documentación completa."
    },
    {
      question: "¿Puedo personalizar mi tienda?",
      answer: "Sí, múltiples plantillas y personalización completa en planes superiores."
    },
    {
      question: "¿Qué métodos de pago aceptan?",
      answer: "Tarjetas, transferencias, PayPal, billeteras digitales y más."
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
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className={`mb-6 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' 
              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
          }`}>
            💬 Contacta con Nosotros
          </Badge>
          <h1 className={`text-4xl lg:text-5xl font-bold mb-6 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            ¿Tienes Preguntas?
            <br />
            <span className="text-blue-600">Estamos Aquí para Ayudarte</span>
          </h1>
          <p className={`text-lg mb-8 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Nuestro equipo está listo para resolver tus dudas y ayudarte a comenzar tu transformación digital.
          </p>
          
          {/* Quick Contact Options */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => window.open('https://wa.me/525598765432', '_blank')}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Chat WhatsApp
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className={`transition-colors duration-300 ${
                isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => window.location.href = 'mailto:hola@e-vendify.com'}
            >
              <Mail className="h-5 w-5 mr-2" />
              Enviar Email
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Methods Grid */}
      <section className={`py-16 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Múltiples Formas de Contactarnos
            </h2>
            <p className={`text-lg transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Elige el método que prefieras para comunicarte con nosotros
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {contactMethods.map((method, index) => (
              <Card key={index} className={`text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-white border-gray-200'
              }`}>
                <CardContent className="p-8">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${method.color}`}>
                    <method.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className={`text-xl font-semibold mb-3 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {method.title}
                  </h3>
                  <p className={`text-sm mb-4 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {method.description}
                  </p>
                  <a 
                    href={method.action}
                    className={`inline-flex items-center text-sm font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    {method.contact}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content: Form and FAQ */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Form - Takes 2/3 of space */}
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h2 className={`text-3xl font-bold mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Envíanos un Mensaje
                </h2>
                <p className={`text-lg transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Completa el formulario y te responderemos en menos de 24 horas
                </p>
              </div>
              
              <Card className={`transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name" className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          Nombre Completo *
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`transition-colors duration-300 ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                          }`}
                          placeholder="Tu nombre completo"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          Correo Electrónico *
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`transition-colors duration-300 ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                          }`}
                          placeholder="tu@email.com"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="company" className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          Empresa (Opcional)
                        </Label>
                        <Input
                          id="company"
                          name="company"
                          type="text"
                          value={formData.company}
                          onChange={handleInputChange}
                          className={`transition-colors duration-300 ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                          }`}
                          placeholder="Nombre de tu empresa"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subject" className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          Asunto *
                        </Label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          required
                          value={formData.subject}
                          onChange={handleInputChange}
                          className={`transition-colors duration-300 ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                          }`}
                          placeholder="¿En qué podemos ayudarte?"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="message" className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                        Mensaje *
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={handleInputChange}
                        className={`transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                        }`}
                        placeholder="Cuéntanos más detalles sobre tu proyecto, pregunta o cómo podemos ayudarte..."
                      />
                    </div>

                    <Button 
                      type="submit" 
                      size="lg"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    >
                      <Send className="h-5 w-5 mr-2" />
                      Enviar Mensaje
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Sidebar - Takes 1/3 of space */}
            <div>
              <div className="mb-8">
                <h2 className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Preguntas Frecuentes
                </h2>
              </div>
              
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <div key={index} className={`p-6 rounded-lg transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-start mb-3">
                      <HelpCircle className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                      <h3 className={`text-sm font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {faq.question}
                      </h3>
                    </div>
                    <p className={`text-sm ml-8 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className={`mt-8 p-6 rounded-lg transition-colors duration-300 ${
                isDarkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  ¿Necesitas Ayuda Inmediata?
                </h3>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={`w-full justify-start transition-colors duration-300 ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => window.open('https://wa.me/525598765432', '_blank')}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat WhatsApp
                  </Button>
                  <Link href="/support" className="block">
                    <Button variant="outline" size="sm" className={`w-full justify-start transition-colors duration-300 ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}>
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Centro de Soporte
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-3xl lg:text-4xl font-bold mb-6 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            ¿Listo para Comenzar?
          </h2>
          <p className={`text-xl mb-8 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            No esperes más. Crea tu tienda digital hoy mismo y comienza a vender online.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                Crear mi Tienda Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline" className={`px-8 py-3 transition-colors duration-300 ${
                isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}>
                Ver Características
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
