"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

interface AdminProtectedRouteProps {
  children: React.ReactNode
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, loading } = useAuth()
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!loading && user) {
        try {
          const { isAdmin: userIsAdmin } = await isAdmin(user.id)
          setIsAdminUser(userIsAdmin)
          
          if (!userIsAdmin) {
            router.push('/admin/login')
          }
        } catch (error) {
          console.error('Error checking admin status:', error)
          router.push('/admin/login')
        }
      } else if (!loading && !user) {
        router.push('/admin/login')
      }
      setCheckingAdmin(false)
    }

    checkAdminStatus()
  }, [user, loading, router])

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando permisos de administrador...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdminUser) {
    return null
  }

  return <>{children}</>
}
