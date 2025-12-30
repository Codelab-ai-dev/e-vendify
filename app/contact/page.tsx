"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, useInView } from "framer-motion"
import { ArrowLeft, ArrowRight, Mail, MessageCircle, Send, MapPin, Clock } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default function ContactPage() {
  const { theme, setTheme } = useTheme()
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1500))

    toast.success("Mensaje enviado. Te contactaremos pronto.")
    setFormData({ name: '', email: '', subject: '', message: '' })
    setIsSubmitting(false)
  }

  const contactMethods = [
    {
      icon: Mail,
      label: "Email",
      value: "hola@e-vendify.com",
      href: "mailto:hola@e-vendify.com",
      response: "2-4 horas"
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: "+52 55 9876 5432",
      href: "https://wa.me/525598765432",
      response: "Inmediato"
    },
    {
      icon: MapPin,
      label: "Ubicacion",
      value: "Ciudad de Mexico",
      href: null,
      response: null
    },
    {
      icon: Clock,
      label: "Horario",
      value: "Lun-Vie 9:00-18:00",
      href: null,
      response: null
    }
  ]

  const faqs = [
    {
      question: "¿Cuanto tiempo toma configurar mi tienda?",
      answer: "Menos de 30 minutos con nuestro proceso guiado."
    },
    {
      question: "¿Que soporte tecnico ofrecen?",
      answer: "Soporte 24/7 por chat, email y WhatsApp."
    },
    {
      question: "¿Puedo personalizar mi tienda?",
      answer: "Si, multiples plantillas y personalizacion completa."
    },
    {
      question: "¿Que metodos de pago aceptan?",
      answer: "Tarjetas, transferencias, PayPal y mas."
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border sticky top-0 z-50 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm">Inicio</span>
            </Link>
            <Link href="/">
              <Image
                src={theme === 'dark' ? '/e-logo-oscuro.png' : '/logo-ev-claro.png'}
                alt="e-vendify"
                width={140}
                height={40}
                className={theme === 'dark' ? 'h-8 w-auto' : 'h-6 w-auto'}
              />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {theme === 'dark' ? '○' : '●'}
            </button>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Ingresar
            </Link>
            <Link href="/register" className="btn-brutal text-sm px-5 py-2">
              Crear tienda
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="label-mono mb-6 block">Contacto</span>
            <h1 className="heading-xl text-5xl sm:text-6xl lg:text-7xl mb-8">
              Hablemos de tu
              <br />
              <span className="text-primary">proyecto.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
              Estamos aqui para resolver tus dudas y ayudarte a comenzar tu negocio digital.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-8 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {contactMethods.map((method, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="py-4">
                  <div className="flex items-center gap-3 mb-2">
                    <method.icon className="w-4 h-4 text-primary" />
                    <span className="label-mono">{method.label}</span>
                  </div>
                  {method.href ? (
                    <a
                      href={method.href}
                      target={method.href.startsWith('http') ? '_blank' : undefined}
                      rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {method.value}
                    </a>
                  ) : (
                    <span className="font-medium">{method.value}</span>
                  )}
                  {method.response && (
                    <p className="text-xs text-muted-foreground mt-1">Respuesta: {method.response}</p>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-20">
            {/* Form */}
            <div className="lg:col-span-3">
              <Reveal>
                <div className="mb-10">
                  <span className="label-mono mb-4 block">Formulario</span>
                  <h2 className="heading-lg text-3xl md:text-4xl">
                    Envianos un mensaje.
                  </h2>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium block">
                        Nombre *
                      </label>
                      <div className={`border-2 transition-colors ${focusedField === 'name' ? 'border-primary' : 'border-border'}`}>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          onFocus={() => setFocusedField('name')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Tu nombre"
                          className="w-full px-4 py-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium block">
                        Email *
                      </label>
                      <div className={`border-2 transition-colors ${focusedField === 'email' ? 'border-primary' : 'border-border'}`}>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="tu@email.com"
                          className="w-full px-4 py-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium block">
                      Asunto *
                    </label>
                    <div className={`border-2 transition-colors ${focusedField === 'subject' ? 'border-primary' : 'border-border'}`}>
                      <input
                        id="subject"
                        name="subject"
                        type="text"
                        required
                        value={formData.subject}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField('subject')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="¿En que podemos ayudarte?"
                        className="w-full px-4 py-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium block">
                      Mensaje *
                    </label>
                    <div className={`border-2 transition-colors ${focusedField === 'message' ? 'border-primary' : 'border-border'}`}>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        value={formData.message}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField('message')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Cuentanos mas sobre tu proyecto..."
                        className="w-full px-4 py-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-brutal w-full sm:w-auto px-10 py-4 inline-flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        Enviar mensaje
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </Reveal>
            </div>

            {/* FAQ Sidebar */}
            <div className="lg:col-span-2">
              <Reveal>
                <div className="mb-10">
                  <span className="label-mono mb-4 block">FAQ</span>
                  <h2 className="heading-lg text-3xl md:text-4xl">
                    Preguntas frecuentes.
                  </h2>
                </div>
              </Reveal>

              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <Reveal key={i} delay={i * 0.1}>
                    <div className="border-2 border-border p-6 hover:border-foreground transition-colors">
                      <h3 className="font-display font-bold text-lg mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {faq.answer}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* Quick Actions */}
              <Reveal delay={0.4}>
                <div className="mt-8 border-2 border-primary p-6">
                  <h3 className="font-display font-bold text-lg mb-4">
                    ¿Necesitas ayuda inmediata?
                  </h3>
                  <div className="space-y-3">
                    <a
                      href="https://wa.me/525598765432"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-brutal-outline w-full py-3 inline-flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat WhatsApp
                    </a>
                    <a
                      href="mailto:hola@e-vendify.com"
                      className="border-2 border-border w-full py-3 inline-flex items-center justify-center gap-2 hover:border-foreground transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Enviar email
                    </a>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-foreground text-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Reveal>
            <h2 className="heading-xl text-4xl md:text-5xl lg:text-6xl mb-6">
              ¿Listo para
              <br />
              <span className="text-primary">comenzar?</span>
            </h2>
            <p className="text-xl text-background/60 mb-10 max-w-xl mx-auto">
              No esperes mas. Crea tu tienda digital hoy mismo y comienza a vender online.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="bg-primary text-primary-foreground px-8 py-4 font-medium inline-flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
                Crear mi tienda gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/demo" className="border-2 border-background/20 text-background px-8 py-4 font-medium inline-flex items-center justify-center hover:border-background transition-colors">
                Ver demo
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
              <Link href="/">
                <Image
                  src={theme === 'dark' ? '/e-logo-oscuro.png' : '/logo-ev-claro.png'}
                  alt="e-vendify"
                  width={140}
                  height={40}
                  className={theme === 'dark' ? 'h-8 w-auto' : 'h-6 w-auto'}
                />
              </Link>
              <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
                <Link href="/demo" className="hover:text-foreground transition-colors">Demo</Link>
                <Link href="/about" className="hover:text-foreground transition-colors">Nosotros</Link>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>2025 e-vendify</span>
              <span className="font-mono text-xs">Hecho en Mexico</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
