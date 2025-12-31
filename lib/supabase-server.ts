import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Cliente de Supabase para uso en el servidor (API routes)
// Usa Service Role Key para bypassear RLS cuando sea necesario

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

// Verificar si estamos en build time
const isBuildTime = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY

if (isBuildTime && typeof window === 'undefined') {
  console.warn('Supabase Admin: usando placeholders para build time')
}

// Cliente con Service Role - SOLO usar en el servidor, nunca exponer al cliente
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Helper para verificar si el admin client está listo
export const isSupabaseAdminReady = () => !isBuildTime
