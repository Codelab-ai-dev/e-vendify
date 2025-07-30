import { supabase } from './supabase'

export interface Store {
  id: string
  user_id: string | null
  
  // Información básica de la tienda
  name: string
  business_name: string | null
  owner: string
  email: string
  phone: string | null
  
  // Información de ubicación
  address: string | null
  city: string | null
  
  // Información adicional del negocio
  description: string | null
  website: string | null
  logo_url: string | null
  category: string | null
  
  // Estados y configuración
  registered_date: string
  status: 'active' | 'inactive'
  is_active: boolean
  
  // Estadísticas
  products_count: number
  monthly_revenue: number
  last_login: string
  
  // Plan y configuración
  plan: 'basic' | 'premium'
  
  // Timestamps
  created_at: string
  updated_at: string
}

// Función para obtener todas las tiendas
export const getAllStores = async () => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false })
  
  return { data: data as Store[] | null, error }
}

// Función para obtener tiendas con filtros
export const getStoresWithFilters = async (filters: {
  status?: 'active' | 'inactive'
  plan?: 'basic' | 'premium'
  city?: string
  search?: string
}) => {
  let query = supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false })

  // Aplicar filtros
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  
  if (filters.plan) {
    query = query.eq('plan', filters.plan)
  }
  
  if (filters.city) {
    query = query.eq('city', filters.city)
  }
  
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,owner.ilike.%${filters.search}%,city.ilike.%${filters.search}%`)
  }

  const { data, error } = await query
  
  return { data: data as Store[] | null, error }
}

// Función para obtener una tienda por ID
export const getStoreById = async (id: string) => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .single()
  
  return { data: data as Store | null, error }
}

// Función para crear una nueva tienda
export const createStore = async (store: Omit<Store, 'id' | 'created_at' | 'updated_at' | 'registered_date'>) => {
  const { data, error } = await supabase
    .from('stores')
    .insert([store])
    .select()
    .single()
  
  return { data: data as Store | null, error }
}

// Función para obtener tiendas por categoría
export const getStoresByCategory = async (category: string) => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  return { data: data as Store[] | null, error }
}

// Función para obtener tienda por user_id
export const getStoreByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  return { data: data as Store | null, error }
}

// Función para actualizar una tienda
export const updateStore = async (id: string, updates: Partial<Store>) => {
  const { data, error } = await supabase
    .from('stores')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  return { data: data as Store | null, error }
}

// Función para eliminar una tienda
export const deleteStore = async (id: string) => {
  const { error } = await supabase
    .from('stores')
    .delete()
    .eq('id', id)
  
  return { error }
}

// Función para obtener estadísticas del dashboard
export const getDashboardStats = async () => {
  const { data: stores, error } = await getAllStores()
  
  if (error || !stores) {
    return { stats: null, error }
  }
  
  const totalStores = stores.length
  const activeStores = stores.filter(store => store.status === 'active').length
  const totalRevenue = stores.reduce((sum, store) => sum + store.monthly_revenue, 0)
  const totalProducts = stores.reduce((sum, store) => sum + store.products_count, 0)
  
  return {
    stats: {
      totalStores,
      activeStores,
      totalRevenue,
      totalProducts
    },
    error: null
  }
}
