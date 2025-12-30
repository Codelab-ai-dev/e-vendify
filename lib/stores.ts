import { supabase } from './supabase'
import {
  createPaginationResult,
  createCursorPaginationResult,
  calculateOffset,
  type PaginationParams,
  type PaginationResult,
  type CursorPaginationParams,
  type CursorPaginationResult,
} from './pagination'

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

// ============================================================
// FUNCIONES CON PAGINACIÓN
// ============================================================

/**
 * Obtener todas las tiendas con paginación offset-based
 */
export const getAllStoresPaginated = async (
  params: PaginationParams
): Promise<PaginationResult<Store>> => {
  const { page, pageSize } = params
  const offset = calculateOffset(page, pageSize)

  // Obtener total de tiendas
  const { count, error: countError } = await supabase
    .from('stores')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    return createPaginationResult([], 0, page, pageSize, countError)
  }

  // Obtener tiendas paginadas
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  return createPaginationResult(
    (data as Store[]) || [],
    count || 0,
    page,
    pageSize,
    error
  )
}

/**
 * Obtener tiendas con filtros y paginación
 */
export const getStoresWithFiltersPaginated = async (
  filters: {
    status?: 'active' | 'inactive'
    plan?: 'basic' | 'premium'
    city?: string
    search?: string
  },
  params: PaginationParams
): Promise<PaginationResult<Store>> => {
  const { page, pageSize } = params
  const offset = calculateOffset(page, pageSize)

  // Construir query de conteo
  let countQuery = supabase
    .from('stores')
    .select('*', { count: 'exact', head: true })

  // Aplicar filtros al conteo
  if (filters.status) {
    countQuery = countQuery.eq('status', filters.status)
  }
  if (filters.plan) {
    countQuery = countQuery.eq('plan', filters.plan)
  }
  if (filters.city) {
    countQuery = countQuery.eq('city', filters.city)
  }
  if (filters.search) {
    countQuery = countQuery.or(
      `name.ilike.%${filters.search}%,owner.ilike.%${filters.search}%,city.ilike.%${filters.search}%`
    )
  }

  const { count, error: countError } = await countQuery

  if (countError) {
    return createPaginationResult([], 0, page, pageSize, countError)
  }

  // Construir query de datos
  let dataQuery = supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false })

  // Aplicar filtros a los datos
  if (filters.status) {
    dataQuery = dataQuery.eq('status', filters.status)
  }
  if (filters.plan) {
    dataQuery = dataQuery.eq('plan', filters.plan)
  }
  if (filters.city) {
    dataQuery = dataQuery.eq('city', filters.city)
  }
  if (filters.search) {
    dataQuery = dataQuery.or(
      `name.ilike.%${filters.search}%,owner.ilike.%${filters.search}%,city.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await dataQuery.range(offset, offset + pageSize - 1)

  return createPaginationResult(
    (data as Store[]) || [],
    count || 0,
    page,
    pageSize,
    error
  )
}

/**
 * Obtener tiendas por categoría con paginación
 */
export const getStoresByCategoryPaginated = async (
  category: string,
  params: PaginationParams
): Promise<PaginationResult<Store>> => {
  const { page, pageSize } = params
  const offset = calculateOffset(page, pageSize)

  // Obtener total de tiendas en la categoría
  const { count, error: countError } = await supabase
    .from('stores')
    .select('*', { count: 'exact', head: true })
    .eq('category', category)
    .eq('is_active', true)

  if (countError) {
    return createPaginationResult([], 0, page, pageSize, countError)
  }

  // Obtener tiendas paginadas
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  return createPaginationResult(
    (data as Store[]) || [],
    count || 0,
    page,
    pageSize,
    error
  )
}

/**
 * Obtener tiendas con paginación por cursor (para infinite scroll)
 */
export const getStoresCursor = async (
  params: CursorPaginationParams
): Promise<CursorPaginationResult<Store>> => {
  const { cursor, limit } = params

  let query = supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  // Si hay cursor, obtener tiendas después de ese ID
  if (cursor) {
    const { data: cursorStore } = await supabase
      .from('stores')
      .select('created_at')
      .eq('id', cursor)
      .single()

    if (cursorStore) {
      query = query.lt('created_at', cursorStore.created_at)
    }
  }

  const { data, error } = await query

  return createCursorPaginationResult((data as Store[]) || [], limit, error)
}

/**
 * Obtener tiendas activas con paginación por cursor
 */
export const getActiveStoresCursor = async (
  params: CursorPaginationParams
): Promise<CursorPaginationResult<Store>> => {
  const { cursor, limit } = params

  let query = supabase
    .from('stores')
    .select('*')
    .eq('is_active', true)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    const { data: cursorStore } = await supabase
      .from('stores')
      .select('created_at')
      .eq('id', cursor)
      .single()

    if (cursorStore) {
      query = query.lt('created_at', cursorStore.created_at)
    }
  }

  const { data, error } = await query

  return createCursorPaginationResult((data as Store[]) || [], limit, error)
}
