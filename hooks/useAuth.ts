import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, getCurrentUser, signOut } from '@/lib/supabase'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener usuario actual al cargar
    const getUser = async () => {
      const { user } = await getCurrentUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await signOut()
    setUser(null)
  }

  return {
    user,
    loading,
    logout,
    isAuthenticated: !!user
  }
}
