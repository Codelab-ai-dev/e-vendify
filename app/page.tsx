"use client"

import { useRef, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { ArrowRight, ArrowUpRight, Check } from "lucide-react"
import { useTheme } from "next-themes"

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      let start = 0
      const end = value
      const duration = 1500
      const increment = end / (duration / 16)

      const timer = setInterval(() => {
        start += increment
        if (start >= end) {
          setCount(end)
          clearInterval(timer)
        } else {
          setCount(Math.floor(start))
        }
      }, 16)

      return () => clearInterval(timer)
    }
  }, [isInView, value])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

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

export default function HomePage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll()
  const lineWidth = useTransform(scrollYProgress, [0, 0.1], ["0%", "100%"])

  useEffect(() => {
    setMounted(true)
  }, [])

  const plans = [
    {
      name: "Emprendedor",
      price: "299",
      currency: "MXN",
      features: ["10 productos", "Dominio propio", "Soporte por email"],
    },
    {
      name: "Pro",
      price: "599",
      currency: "MXN",
      popular: true,
      features: ["Productos ilimitados", "Analytics", "Soporte prioritario", "Inventario", "Codigos de descuento"],
    },
    {
      name: "Enterprise",
      price: "1,499",
      currency: "MXN",
      features: ["Todo Pro", "IA integrada", "Acceso API", "Consultoria"],
    },
  ]

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground">
      {/* Progress line */}
      <motion.div
        style={{ width: lineWidth }}
        className="fixed top-0 left-0 h-0.5 bg-primary z-[100]"
      />

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Image
              src={theme === 'dark' ? '/e-logo-oscuro.png' : '/logo-ev-claro.png'}
              alt="e-vendify"
              width={140}
              height={40}
              className={theme === 'dark' ? 'h-8 w-auto' : 'h-6 w-auto'}
            />
          </Link>

          <div className="hidden md:flex items-center gap-12">
            <Link href="#caracteristicas" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Caracteristicas
            </Link>
            <Link href="#precios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Precios
            </Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Nosotros
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {mounted && (theme === 'dark' ? '○' : '●')}
            </button>
            <Link href="/login" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Ingresar
            </Link>
            <Link
              href="/register"
              className="btn-brutal text-sm px-6 py-2.5"
            >
              Crear tienda
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="min-h-screen flex flex-col justify-center pt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="max-w-5xl">
            {/* Label */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-8"
            >
              <span className="label-mono">Plataforma de comercio digital</span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="heading-xl text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-8"
            >
              Tu negocio.
              <br />
              <span className="text-primary">Sin limites.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-12 leading-relaxed"
            >
              Crea tu tienda digital en minutos. Sin conocimientos tecnicos.
              Sin comisiones ocultas. Solo vende.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/register" className="btn-brutal group">
                Comenzar gratis
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/demo" className="btn-brutal-outline group">
                Ver demo
                <ArrowUpRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="mt-24 pt-12 border-t border-border"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
              {[
                { value: 500, suffix: "+", label: "Tiendas activas" },
                { value: 15, suffix: "K+", label: "Productos vendidos" },
                { value: 98, suffix: "%", label: "Clientes felices" },
                { value: 0, suffix: "$", label: "Comisiones ocultas", prefix: "" },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="heading-lg text-4xl md:text-5xl mb-2">
                    {stat.prefix !== undefined ? stat.prefix : ""}<Counter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="label-mono">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Marquee */}
      <section className="py-8 border-y border-border overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-16 px-8">
              {["Moda", "Comida", "Arte", "Tech", "Belleza", "Hogar", "Deportes", "Libros", "Artesanias", "Joyeria"].map((item, j) => (
                <span key={j} className="text-4xl md:text-5xl font-display font-bold text-muted-foreground/20">
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="caracteristicas" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="mb-24">
              <span className="label-mono mb-4 block">Caracteristicas</span>
              <h2 className="heading-lg text-5xl md:text-6xl lg:text-7xl max-w-4xl">
                Todo lo que necesitas.
                <br />
                <span className="text-muted-foreground">Nada que no.</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {[
              { num: "01", title: "Tu Tienda", desc: "Arrastra y suelta. Personaliza todo. Lanza en minutos." },
              { num: "02", title: "Pagos", desc: "Mercado Pago, transferencias, efectivo. Acepta como quieras." },
              { num: "03", title: "Inventario", desc: "Control de stock en tiempo real. Alertas automaticas." },
              { num: "04", title: "Metricas", desc: "Conoce tus numeros. Ventas, clientes, productos. Todo en un lugar." },
              { num: "05", title: "WhatsApp", desc: "Comparte en WhatsApp, Instagram, donde sea. Herramientas incluidas." },
              { num: "06", title: "Soporte", desc: "Estamos cuando nos necesitas. Rapido y humano." },
            ].map((feature, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="bg-background p-8 md:p-12 h-full group hover:bg-muted/50 transition-colors">
                  <span className="label-mono text-primary mb-6 block">{feature.num}</span>
                  <h3 className="heading-lg text-2xl md:text-3xl mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Big statement */}
      <section className="py-32 bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <h2 className="heading-xl text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-center">
              Construye tu
              <br />
              <span className="text-primary">imperio.</span>
            </h2>
          </Reveal>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-20">
              <span className="label-mono mb-4 block">Precios</span>
              <h2 className="heading-lg text-5xl md:text-6xl mb-6">
                Precios simples.
              </h2>
              <p className="text-xl text-muted-foreground">
                Sin sorpresas. Cancela cuando quieras.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-px bg-border max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className={`p-8 md:p-10 h-full flex flex-col ${plan.popular ? 'bg-foreground text-background' : 'bg-background'}`}>
                  {plan.popular && (
                    <span className="label-mono text-primary mb-4">Mas popular</span>
                  )}
                  <h3 className="heading-lg text-2xl mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="heading-xl text-5xl">${plan.price}</span>
                    <span className={plan.popular ? "text-background/60" : "text-muted-foreground"}> {plan.currency}/mes</span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm">
                        <Check className={`w-4 h-4 ${plan.popular ? 'text-primary' : 'text-primary'}`} />
                        <span className={plan.popular ? "text-background/80" : "text-muted-foreground"}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/register"
                    className={plan.popular ? "btn-brutal bg-primary text-primary-foreground hover:bg-primary/90" : "btn-brutal-outline"}
                  >
                    Comenzar
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="heading-xl text-5xl md:text-6xl lg:text-7xl mb-8">
                Listo para
                <br />
                <span className="text-highlight">empezar a vender?</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-12 max-w-xl mx-auto">
                Crea tu tienda en 5 minutos. Sin tarjeta de credito.
              </p>
              <Link href="/register" className="btn-brutal inline-flex group">
                Crear mi tienda
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <Link href="/" className="mb-4 block">
                <Image
                  src={theme === 'dark' ? '/e-logo-oscuro.png' : '/logo-ev-claro.png'}
                  alt="e-vendify"
                  width={140}
                  height={40}
                  className={theme === 'dark' ? 'h-8 w-auto' : 'h-6 w-auto'}
                />
              </Link>
              <p className="text-muted-foreground max-w-sm">
                La forma mas simple de vender en linea. Hecho para emprendedores mexicanos.
              </p>
            </div>
            <div>
              <h4 className="font-display font-bold mb-4">Producto</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><Link href="#caracteristicas" className="hover:text-foreground transition-colors">Caracteristicas</Link></li>
                <li><Link href="#precios" className="hover:text-foreground transition-colors">Precios</Link></li>
                <li><Link href="/demo" className="hover:text-foreground transition-colors">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold mb-4">Legal</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacidad</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terminos</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contacto</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-sm text-muted-foreground">
              2025 e-vendify. Todos los derechos reservados.
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              Hecho con orgullo en Mexico
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
