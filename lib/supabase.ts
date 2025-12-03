import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Configuración mejorada del cliente con manejo de errores
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'e-vendify-web'
    }
  }
})

// Función helper para manejar errores de red
export const handleSupabaseError = (error: any) => {
  console.error('Supabase Error Details:', {
    message: error.message,
    status: error.status,
    details: error,
    timestamp: new Date().toISOString(),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
  })
  
  if (error.message?.includes('Failed to fetch')) {
    return {
      ...error,
      message: 'Error de conexión con el servidor. Verifica tu conexión a internet e intenta de nuevo.',
      isNetworkError: true
    }
  }
  
  if (error.message?.includes('NetworkError')) {
    return {
      ...error,
      message: 'Error de red. Intenta de nuevo en unos momentos.',
      isNetworkError: true
    }
  }
  
  return error
}

// Función de registro con reintentos
export const signUpWithRetry = async (email: string, password: string, options?: any, maxRetries = 3) => {
  let lastError
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Intento de registro ${attempt}/${maxRetries}...`)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options
      })
      
      if (error) {
        lastError = handleSupabaseError(error)
        
        // Si es un error de red y no es el último intento, reintenta
        if (lastError.isNetworkError && attempt < maxRetries) {
          console.log(`Error de red, reintentando en ${attempt * 1000}ms...`)
          await new Promise(resolve => setTimeout(resolve, attempt * 1000))
          continue
        }
        
        return { data: null, error: lastError }
      }
      
      return { data, error: null }
    } catch (err) {
      lastError = handleSupabaseError(err)
      
      if (attempt < maxRetries) {
        console.log(`Error inesperado, reintentando en ${attempt * 1000}ms...`)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
        continue
      }
    }
  }
  
  return { data: null, error: lastError }
}

// Función para el login de admin
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  return { data, error }
}

// Función para el logout
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Función para obtener el usuario actual
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Función para verificar si el usuario es admin
export const isAdmin = async (userId: string) => {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  return { isAdmin: !!data, error }
}
