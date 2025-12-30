"use client"

import { motion } from "framer-motion"
import { Check, ArrowRight, Sparkles, Package, Share2, User } from "lucide-react"
import Link from "next/link"

interface Props {
    profile: any
    productsCount: number
}

export default function OnboardingChecklist({ profile, productsCount }: Props) {
    const steps = [
        {
            id: 'profile',
            label: 'Completa tu perfil',
            description: 'Logo y descripcion de tu tienda',
            isCompleted: !!(profile?.logo_url && profile?.description),
            action: 'Editar perfil',
            href: '#settings',
            icon: User
        },
        {
            id: 'product',
            label: 'Agrega un producto',
            description: 'Sube tu primer articulo para vender',
            isCompleted: productsCount > 0,
            action: 'Crear producto',
            href: '/dashboard/products/new',
            icon: Package
        },
        {
            id: 'share',
            label: 'Comparte tu tienda',
            description: 'Envia el link a tus clientes',
            isCompleted: false,
            action: 'Ver tienda',
            href: `/store/${profile?.slug || profile?.id}`,
            icon: Share2
        }
    ]

    const completedSteps = steps.filter(s => s.isCompleted).length
    const progress = (completedSteps / steps.length) * 100

    // Hide if all done
    if (progress === 100) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="border-2 border-primary"
        >
            {/* Header */}
            <div className="border-b-2 border-primary p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-xl">Primeros pasos</h3>
                        <p className="text-sm text-muted-foreground">Completa para activar tu tienda</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="font-mono text-sm text-muted-foreground">
                        {completedSteps}/{steps.length}
                    </span>
                    {/* Progress bar */}
                    <div className="w-32 h-2 bg-muted relative">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="absolute top-0 left-0 h-full bg-primary"
                        />
                    </div>
                    <span className="font-mono font-bold text-sm">{Math.round(progress)}%</span>
                </div>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y-2 md:divide-y-0 md:divide-x-2 divide-border">
                {steps.map((step, i) => (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 * (i + 1) }}
                        className={`p-6 relative ${step.isCompleted ? 'bg-muted/30' : ''}`}
                    >
                        {/* Step number */}
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-10 h-10 border-2 flex items-center justify-center font-mono font-bold transition-colors ${
                                step.isCompleted
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border'
                            }`}>
                                {step.isCompleted ? (
                                    <Check className="w-5 h-5" />
                                ) : (
                                    <span>{i + 1}</span>
                                )}
                            </div>
                            <step.icon className={`w-5 h-5 ${step.isCompleted ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>

                        {/* Content */}
                        <h4 className={`font-display font-bold text-lg mb-1 ${
                            step.isCompleted ? 'text-muted-foreground line-through' : ''
                        }`}>
                            {step.label}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                            {step.description}
                        </p>

                        {/* Action */}
                        {!step.isCompleted && (
                            <Link
                                href={step.href}
                                className="inline-flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors group"
                            >
                                {step.action}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        )}

                        {step.isCompleted && (
                            <span className="inline-flex items-center gap-2 text-sm text-primary font-medium">
                                <Check className="w-4 h-4" />
                                Completado
                            </span>
                        )}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}
