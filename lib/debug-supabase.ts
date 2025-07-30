// Utilidad para debuggear la conexión con Supabase
import { supabase } from './supabase'

export const debugSupabaseConnection = async () => {
  console.log('🔍 Debuggeando conexión con Supabase...')
  
  // Verificar variables de entorno
  console.log('📋 Variables de entorno:')
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ No configurada')
  console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ No configurada')
  
  try {
    // Probar conexión básica
    console.log('🔌 Probando conexión básica...')
    const { data, error } = await supabase.from('admin_users').select('count', { count: 'exact' })
    
    if (error) {
      console.error('❌ Error en conexión básica:', error)
      return { success: false, error: error.message }
    } else {
      console.log('✅ Conexión básica exitosa')
    }
    
    // Probar autenticación
    console.log('🔐 Probando sistema de autenticación...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('❌ Error en autenticación:', authError)
      return { success: false, error: authError.message }
    } else {
      console.log('✅ Sistema de autenticación accesible')
    }
    
    return { success: true, message: 'Todas las pruebas pasaron' }
    
  } catch (error) {
    console.error('❌ Error general:', error)
    return { success: false, error: 'Error de conexión general' }
  }
}

// Función para probar registro de usuario
export const testUserRegistration = async (email: string, password: string) => {
  console.log('🧪 Probando registro de usuario...')
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) {
      console.error('❌ Error en registro:', error)
      return { success: false, error: error.message }
    }
    
    console.log('✅ Registro exitoso:', data)
    return { success: true, data }
    
  } catch (error) {
    console.error('❌ Error general en registro:', error)
    return { success: false, error: 'Error general en registro' }
  }
}
