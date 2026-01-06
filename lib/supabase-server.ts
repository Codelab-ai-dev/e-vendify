import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Cliente de Supabase para uso en el servidor (API routes)
// Usa Service Role Key para bypassear RLS cuando sea necesario

// Lazy initialization para evitar errores en build time
let _supabaseAdmin: SupabaseClient | null = null

/**
 * Obtiene el cliente de Supabase Admin con lazy initialization
 * Esto evita errores durante el build de Next.js cuando las variables de entorno no están disponibles
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables not configured')
    }

    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return _supabaseAdmin
}

// Alias para compatibilidad con código existente
// DEPRECATED: Usar getSupabaseAdmin() en su lugar
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin()
    const value = client[prop as keyof SupabaseClient]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

// Helper para verificar si el admin client está listo
export const isSupabaseAdminReady = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}
