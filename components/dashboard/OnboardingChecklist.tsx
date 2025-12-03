"use client"

import { CheckCircle2, Circle, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"

interface Props {
    profile: any
    productsCount: number
}

export default function OnboardingChecklist({ profile, productsCount }: Props) {
    const steps = [
        {
            id: 'profile',
            label: 'Completa tu perfil',
            description: 'Añade un logo y descripción a tu tienda',
            isCompleted: !!(profile?.logo_url && profile?.description),
            action: 'Editar Perfil',
            href: '#settings' // This would ideally scroll to settings or open a modal
        },
        {
            id: 'product',
            label: 'Crea tu primer producto',
            description: 'Sube tu primer artículo para vender',
            isCompleted: productsCount > 0,
            action: 'Crear Producto',
            href: '/dashboard/products/new'
        },
        {
            id: 'share',
            label: 'Comparte tu tienda',
            description: 'Envía el link de tu tienda a tus clientes',
            isCompleted: false, // Hard to track, maybe check if link was copied? For now manual or always false until clicked
            action: 'Ver Tienda',
            href: `/store/${profile?.slug || profile?.id}`
        }
    ]

    const completedSteps = steps.filter(s => s.isCompleted).length
    const progress = (completedSteps / steps.length) * 100

    if (progress === 100) return null // Hide if all done

    return (
        <Card className="mb-8 border-blue-100 bg-blue-50/50 dark:bg-blue-900/10">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg text-blue-900 dark:text-blue-100">¡Bienvenido a E-Vendify!</CardTitle>
                        <CardDescription className="text-blue-700 dark:text-blue-300">
                            Completa estos pasos para despegar tu negocio
                        </CardDescription>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-bold text-blue-900 dark:text-blue-100">{Math.round(progress)}%</span>
                        <Progress value={progress} className="w-24 h-2 mt-1 bg-blue-200 dark:bg-blue-800" indicatorClassName="bg-blue-600" />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                    {steps.map((step) => (
                        <div
                            key={step.id}
                            className={`flex flex-col p-4 rounded-xl border ${step.isCompleted
                                ? 'bg-white/50 dark:bg-gray-800/50 border-blue-100 dark:border-blue-900'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm'}`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-2 rounded-full ${step.isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                    {step.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                </div>
                            </div>
                            <h3 className={`font-semibold mb-1 ${step.isCompleted ? 'text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                                {step.label}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-1">
                                {step.description}
                            </p>

                            {!step.isCompleted && (
                                <Link href={step.href}>
                                    <Button size="sm" variant="outline" className="w-full border-blue-200 hover:bg-blue-50 text-blue-700">
                                        {step.action} <ArrowRight className="w-3 h-3 ml-2" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
