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

export interface Product {
  id: string
  store_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string | null
  is_available: boolean
  created_at: string
  updated_at: string

  // Relación con store (opcional para joins)
  store?: {
    id: string
    name: string
    category: string | null
  }
}

// Función para obtener todos los productos
export const getAllProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      store:stores(id, name, category)
    `)
    .order('created_at', { ascending: false })
  
  return { data: data as Product[] | null, error }
}

// Función para obtener productos por tienda
export const getProductsByStore = async (storeId: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
  
  return { data: data as Product[] | null, error }
}

// Función para obtener productos disponibles por tienda
export const getAvailableProductsByStore = async (storeId: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_available', true)
    .order('created_at', { ascending: false })
  
  return { data: data as Product[] | null, error }
}

// Función para obtener productos por categoría
export const getProductsByCategory = async (category: string) => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      store:stores(id, name, category)
    `)
    .eq('category', category)
    .eq('is_available', true)
    .order('created_at', { ascending: false })
  
  return { data: data as Product[] | null, error }
}

// Función para buscar productos
export const searchProducts = async (searchTerm: string) => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      store:stores(id, name, category)
    `)
    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
    .eq('is_available', true)
    .order('created_at', { ascending: false })
  
  return { data: data as Product[] | null, error }
}

// Función para obtener un producto por ID
export const getProductById = async (id: string) => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      store:stores(id, name, category, owner, phone, address, city)
    `)
    .eq('id', id)
    .single()
  
  return { data: data as Product | null, error }
}

// Función para crear un nuevo producto
export const createProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'store'>) => {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single()
  
  return { data: data as Product | null, error }
}

// Función para actualizar un producto
export const updateProduct = async (id: string, updates: Partial<Product>) => {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  return { data: data as Product | null, error }
}

// Función para eliminar un producto
export const deleteProduct = async (id: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
  
  return { error }
}

// Función para alternar disponibilidad de un producto
export const toggleProductAvailability = async (id: string) => {
  // Primero obtener el estado actual
  const { data: currentProduct, error: fetchError } = await supabase
    .from('products')
    .select('is_available')
    .eq('id', id)
    .single()
  
  if (fetchError) return { data: null, error: fetchError }
  
  // Alternar el estado
  const { data, error } = await supabase
    .from('products')
    .update({ is_available: !currentProduct.is_available })
    .eq('id', id)
    .select()
    .single()
  
  return { data: data as Product | null, error }
}

// Función para obtener productos con filtros avanzados
export const getProductsWithFilters = async (filters: {
  storeId?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  isAvailable?: boolean
  searchTerm?: string
}) => {
  let query = supabase
    .from('products')
    .select(`
      *,
      store:stores(id, name, category)
    `)
    .order('created_at', { ascending: false })

  // Aplicar filtros
  if (filters.storeId) {
    query = query.eq('store_id', filters.storeId)
  }
  
  if (filters.category) {
    query = query.eq('category', filters.category)
  }
  
  if (filters.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice)
  }
  
  if (filters.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice)
  }
  
  if (filters.isAvailable !== undefined) {
    query = query.eq('is_available', filters.isAvailable)
  }
  
  if (filters.searchTerm) {
    query = query.or(`name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`)
  }

  const { data, error } = await query
  
  return { data: data as Product[] | null, error }
}

// Función para obtener estadísticas de productos por tienda
export const getProductStatsByStore = async (storeId: string) => {
  const { data: products, error } = await getProductsByStore(storeId)
  
  if (error || !products) {
    return { stats: null, error }
  }
  
  const totalProducts = products.length
  const availableProducts = products.filter(p => p.is_available).length
  const averagePrice = products.length > 0 
    ? products.reduce((sum, p) => sum + p.price, 0) / products.length 
    : 0
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]
  
  return {
    stats: {
      totalProducts,
      availableProducts,
      unavailableProducts: totalProducts - availableProducts,
      averagePrice,
      categories: categories.length,
      categoryList: categories
    },
    error: null
  }
}

// Función para obtener productos más vendidos (simulado por ahora)
export const getTopProducts = async (limit: number = 10) => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      store:stores(id, name, category)
    `)
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  return { data: data as Product[] | null, error }
}

// ============================================================
// FUNCIONES CON PAGINACIÓN
// ============================================================

/**
 * Obtener todos los productos con paginación offset-based
 */
export const getAllProductsPaginated = async (
  params: PaginationParams
): Promise<PaginationResult<Product>> => {
  const { page, pageSize } = params
  const offset = calculateOffset(page, pageSize)

  // Obtener total de productos para metadata de paginación
  const { count, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    return createPaginationResult([], 0, page, pageSize, countError)
  }

  // Obtener productos paginados
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      store:stores(id, name, category)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  return createPaginationResult(
    (data as Product[]) || [],
    count || 0,
    page,
    pageSize,
    error
  )
}

/**
 * Obtener productos por tienda con paginación offset-based
 */
export const getProductsByStorePaginated = async (
  storeId: string,
  params: PaginationParams
): Promise<PaginationResult<Product>> => {
  const { page, pageSize } = params
  const offset = calculateOffset(page, pageSize)

  // Obtener total de productos para la tienda
  const { count, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)

  if (countError) {
    return createPaginationResult([], 0, page, pageSize, countError)
  }

  // Obtener productos paginados
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  return createPaginationResult(
    (data as Product[]) || [],
    count || 0,
    page,
    pageSize,
    error
  )
}

/**
 * Buscar productos con paginación offset-based
 */
export const searchProductsPaginated = async (
  searchTerm: string,
  params: PaginationParams
): Promise<PaginationResult<Product>> => {
  const { page, pageSize } = params
  const offset = calculateOffset(page, pageSize)

  const searchFilter = `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`

  // Obtener total de resultados
  const { count, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .or(searchFilter)
    .eq('is_available', true)

  if (countError) {
    return createPaginationResult([], 0, page, pageSize, countError)
  }

  // Obtener resultados paginados
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      store:stores(id, name, category)
    `)
    .or(searchFilter)
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  return createPaginationResult(
    (data as Product[]) || [],
    count || 0,
    page,
    pageSize,
    error
  )
}

/**
 * Obtener productos con filtros avanzados y paginación
 */
export const getProductsWithFiltersPaginated = async (
  filters: {
    storeId?: string
    category?: string
    minPrice?: number
    maxPrice?: number
    isAvailable?: boolean
    searchTerm?: string
  },
  params: PaginationParams
): Promise<PaginationResult<Product>> => {
  const { page, pageSize } = params
  const offset = calculateOffset(page, pageSize)

  // Construir query de conteo
  let countQuery = supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  // Aplicar filtros al conteo
  if (filters.storeId) {
    countQuery = countQuery.eq('store_id', filters.storeId)
  }
  if (filters.category) {
    countQuery = countQuery.eq('category', filters.category)
  }
  if (filters.minPrice !== undefined) {
    countQuery = countQuery.gte('price', filters.minPrice)
  }
  if (filters.maxPrice !== undefined) {
    countQuery = countQuery.lte('price', filters.maxPrice)
  }
  if (filters.isAvailable !== undefined) {
    countQuery = countQuery.eq('is_available', filters.isAvailable)
  }
  if (filters.searchTerm) {
    countQuery = countQuery.or(
      `name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`
    )
  }

  const { count, error: countError } = await countQuery

  if (countError) {
    return createPaginationResult([], 0, page, pageSize, countError)
  }

  // Construir query de datos
  let dataQuery = supabase
    .from('products')
    .select(`
      *,
      store:stores(id, name, category)
    `)
    .order('created_at', { ascending: false })

  // Aplicar filtros a los datos
  if (filters.storeId) {
    dataQuery = dataQuery.eq('store_id', filters.storeId)
  }
  if (filters.category) {
    dataQuery = dataQuery.eq('category', filters.category)
  }
  if (filters.minPrice !== undefined) {
    dataQuery = dataQuery.gte('price', filters.minPrice)
  }
  if (filters.maxPrice !== undefined) {
    dataQuery = dataQuery.lte('price', filters.maxPrice)
  }
  if (filters.isAvailable !== undefined) {
    dataQuery = dataQuery.eq('is_available', filters.isAvailable)
  }
  if (filters.searchTerm) {
    dataQuery = dataQuery.or(
      `name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`
    )
  }

  const { data, error } = await dataQuery.range(offset, offset + pageSize - 1)

  return createPaginationResult(
    (data as Product[]) || [],
    count || 0,
    page,
    pageSize,
    error
  )
}

/**
 * Obtener productos con paginación por cursor (para infinite scroll)
 */
export const getProductsCursor = async (
  params: CursorPaginationParams
): Promise<CursorPaginationResult<Product>> => {
  const { cursor, limit } = params

  let query = supabase
    .from('products')
    .select(`
      *,
      store:stores(id, name, category)
    `)
    .order('created_at', { ascending: false })
    .limit(limit + 1) // Pedir uno más para saber si hay más páginas

  // Si hay cursor, obtener productos después de ese ID
  if (cursor) {
    // Obtener la fecha del cursor
    const { data: cursorProduct } = await supabase
      .from('products')
      .select('created_at')
      .eq('id', cursor)
      .single()

    if (cursorProduct) {
      query = query.lt('created_at', cursorProduct.created_at)
    }
  }

  const { data, error } = await query

  return createCursorPaginationResult((data as Product[]) || [], limit, error)
}

/**
 * Obtener productos por tienda con paginación por cursor
 */
export const getProductsByStoreCursor = async (
  storeId: string,
  params: CursorPaginationParams
): Promise<CursorPaginationResult<Product>> => {
  const { cursor, limit } = params

  let query = supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    const { data: cursorProduct } = await supabase
      .from('products')
      .select('created_at')
      .eq('id', cursor)
      .single()

    if (cursorProduct) {
      query = query.lt('created_at', cursorProduct.created_at)
    }
  }

  const { data, error } = await query

  return createCursorPaginationResult((data as Product[]) || [], limit, error)
}
