"use client"

import { useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, useInView } from "framer-motion"
import { ArrowLeft, ArrowRight, Target, Lightbulb, Heart } from "lucide-react"
import { useTheme } from "next-themes"

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

export default function AboutPage() {
  const { theme, setTheme } = useTheme()

  const values = [
    {
      icon: Target,
      title: "Mision",
      description: "Democratizar el comercio electronico para que cualquier emprendedor pueda crear y gestionar su tienda digital."
    },
    {
      icon: Lightbulb,
      title: "Vision",
      description: "Ser la plataforma lider en Latinoamerica para el comercio digital local."
    },
    {
      icon: Heart,
      title: "Valores",
      description: "Innovacion, simplicidad, accesibilidad y compromiso con el crecimiento de los negocios."
    }
  ]

  const milestones = [
    { year: "2023", title: "Fundacion", description: "Nace e-vendify con la vision de democratizar el comercio electronico en Mexico." },
    { year: "2024", title: "1,000 tiendas", description: "Alcanzamos nuestro primer gran hito con mas de 1,000 tiendas activas." },
    { year: "2024", title: "Expansion", description: "Expandimos servicios a 5 paises de Latinoamerica." },
    { year: "2025", title: "IA", description: "Lanzamos asistente de IA para optimizar ventas y atencion al cliente." }
  ]

  const team = [
    { name: "Maria Gonzalez", role: "CEO & Fundadora", initials: "MG" },
    { name: "Carlos Rodriguez", role: "CTO", initials: "CR" },
    { name: "Ana Martinez", role: "Head of Design", initials: "AM" },
    { name: "Luis Hernandez", role: "Head of Growth", initials: "LH" }
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
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <span className="label-mono mb-6 block">Nuestra historia</span>
            <h1 className="heading-xl text-5xl sm:text-6xl lg:text-7xl mb-8">
              Construyendo el futuro del
              <br />
              <span className="text-primary">comercio digital.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Somos un equipo apasionado por democratizar el comercio electronico,
              haciendo que cualquier emprendedor pueda crear su tienda digital de manera profesional.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "10K+", label: "Tiendas creadas" },
              { number: "500K+", label: "Productos vendidos" },
              { number: "50+", label: "Ciudades" },
              { number: "99.9%", label: "Uptime" }
            ].map((stat, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="text-center">
                  <div className="heading-xl text-4xl md:text-5xl mb-2">{stat.number}</div>
                  <div className="label-mono">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="mb-16">
              <span className="label-mono mb-4 block">Nuestros pilares</span>
              <h2 className="heading-lg text-4xl md:text-5xl">
                Lo que nos define.
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-4">
            {values.map((value, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="border-2 border-border p-8 h-full group hover:border-foreground transition-colors">
                  <div className="w-12 h-12 border-2 border-primary flex items-center justify-center mb-6">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-2xl mb-4">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-foreground text-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="mb-16">
              <span className="label-mono text-background/60 mb-4 block">Nuestro camino</span>
              <h2 className="heading-lg text-4xl md:text-5xl">
                Hitos importantes.
              </h2>
            </div>
          </Reveal>

          <div className="space-y-0">
            {milestones.map((milestone, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="flex border-t border-background/20 py-8 group">
                  <div className="w-24 shrink-0">
                    <span className="font-mono text-primary font-bold">{milestone.year}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-xl mb-2 group-hover:text-primary transition-colors">
                      {milestone.title}
                    </h3>
                    <p className="text-background/60">{milestone.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="mb-16">
              <span className="label-mono mb-4 block">El equipo</span>
              <h2 className="heading-lg text-4xl md:text-5xl">
                Quienes lo hacen posible.
              </h2>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {team.map((member, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="border-2 border-border p-6 text-center group hover:border-foreground transition-colors">
                  <div className="w-20 h-20 bg-muted flex items-center justify-center mx-auto mb-4 font-display font-bold text-2xl text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {member.initials}
                  </div>
                  <h3 className="font-display font-bold text-lg mb-1">{member.name}</h3>
                  <p className="text-sm text-primary">{member.role}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Reveal>
            <h2 className="heading-xl text-4xl md:text-5xl lg:text-6xl mb-6">
              Se parte de
              <br />
              <span className="text-highlight">nuestra historia.</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
              Unete a miles de emprendedores que ya estan transformando sus negocios con e-vendify.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-brutal inline-flex items-center gap-2 px-8 py-4">
                Comenzar mi tienda
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/contact" className="btn-brutal-outline px-8 py-4">
                Contactanos
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
                <Link href="/contact" className="hover:text-foreground transition-colors">Contacto</Link>
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
