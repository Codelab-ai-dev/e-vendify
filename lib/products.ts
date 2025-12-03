import { supabase } from './supabase'

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
