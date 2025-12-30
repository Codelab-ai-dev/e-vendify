import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getAllProducts,
  getProductsByStore,
  getAvailableProductsByStore,
  getProductsByCategory,
  searchProducts,
  getProductsWithFilters,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStatsByStore,
} from '../products'
import { supabase } from '../supabase'

// Mock data
const mockProducts = [
  {
    id: '1',
    store_id: 'store-1',
    name: 'Producto Test',
    description: 'Descripción del producto',
    price: 99.99,
    image_url: 'https://example.com/image.jpg',
    category: 'electrónica',
    is_available: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    store_id: 'store-1',
    name: 'Producto Test 2',
    description: 'Otro producto',
    price: 149.99,
    image_url: 'https://example.com/image2.jpg',
    category: 'ropa',
    is_available: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
]

const mockStore = {
  id: 'store-1',
  name: 'Mi Tienda',
  category: 'general',
}

describe('Products Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllProducts', () => {
    it('should fetch all products with store information', async () => {
      const mockResponse = mockProducts.map(p => ({
        ...p,
        store: mockStore,
      }))

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockResponse,
            error: null,
          }),
        }),
      } as any)

      const { data, error } = await getAllProducts()

      expect(error).toBeNull()
      expect(data).toHaveLength(2)
      expect(data?.[0].store).toBeDefined()
      expect(supabase.from).toHaveBeenCalledWith('products')
    })

    it('should handle errors when fetching products', async () => {
      const mockError = { message: 'Database error', code: '500' }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      } as any)

      const { data, error } = await getAllProducts()

      expect(data).toBeNull()
      expect(error).toEqual(mockError)
    })
  })

  describe('getProductsByStore', () => {
    it('should fetch products for a specific store', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockProducts,
              error: null,
            }),
          }),
        }),
      } as any)

      const { data, error } = await getProductsByStore('store-1')

      expect(error).toBeNull()
      expect(data).toHaveLength(2)
      expect(data?.[0].store_id).toBe('store-1')
    })

    it('should return empty array when store has no products', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      } as any)

      const { data, error } = await getProductsByStore('empty-store')

      expect(error).toBeNull()
      expect(data).toEqual([])
    })
  })

  describe('getAvailableProductsByStore', () => {
    it('should fetch only available products', async () => {
      const availableProducts = mockProducts.filter(p => p.is_available)

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation((field) => ({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: availableProducts,
                error: null,
              }),
            }),
          })),
        }),
      } as any)

      const { data, error } = await getAvailableProductsByStore('store-1')

      expect(error).toBeNull()
      expect(data?.every(p => p.is_available)).toBe(true)
    })
  })

  describe('getProductsByCategory', () => {
    it('should fetch products by category', async () => {
      const electronicProducts = mockProducts.filter(p => p.category === 'electrónica')

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: electronicProducts,
                error: null,
              }),
            }),
          })),
        }),
      } as any)

      const { data, error } = await getProductsByCategory('electrónica')

      expect(error).toBeNull()
      expect(data).toHaveLength(1)
      expect(data?.[0].category).toBe('electrónica')
    })
  })

  describe('searchProducts', () => {
    it('should search products by name', async () => {
      const searchResults = [mockProducts[0]]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: searchResults,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const { data, error } = await searchProducts('Test')

      expect(error).toBeNull()
      expect(data).toHaveLength(1)
    })

    it('should handle empty search results', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const { data, error } = await searchProducts('NonexistentProduct')

      expect(error).toBeNull()
      expect(data).toEqual([])
    })
  })

  describe('getProductsWithFilters', () => {
    it('should apply category filter', async () => {
      const filteredProducts = mockProducts.filter(p => p.category === 'electrónica')

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: filteredProducts,
                    error: null,
                  }),
                }),
              }),
            }),
          })),
        }),
      } as any)

      const { data, error } = await getProductsWithFilters({
        category: 'electrónica',
      })

      expect(error).toBeNull()
      expect(data?.[0].category).toBe('electrónica')
    })

    it('should apply price range filter', async () => {
      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockProducts,
          error: null,
        }),
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockChain),
      } as any)

      const { data, error } = await getProductsWithFilters({
        minPrice: 50,
        maxPrice: 200,
      })

      expect(error).toBeNull()
      expect(mockChain.gte).toHaveBeenCalledWith('price', 50)
      expect(mockChain.lte).toHaveBeenCalledWith('price', 200)
    })

    it('should combine multiple filters', async () => {
      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockProducts[0]],
          error: null,
        }),
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockChain),
      } as any)

      const { data, error } = await getProductsWithFilters({
        storeId: 'store-1',
        category: 'electrónica',
        minPrice: 50,
        maxPrice: 150,
        isAvailable: true,
      })

      expect(error).toBeNull()
      expect(mockChain.eq).toHaveBeenCalledTimes(3) // store_id, category, is_available
    })
  })

  describe('getProductById', () => {
    it('should fetch a single product by ID', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProducts[0],
              error: null,
            }),
          }),
        }),
      } as any)

      const { data, error } = await getProductById('1')

      expect(error).toBeNull()
      expect(data?.id).toBe('1')
      expect(data?.name).toBe('Producto Test')
    })

    it('should handle product not found', async () => {
      const notFoundError = { message: 'Product not found', code: 'PGRST116' }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: notFoundError,
            }),
          }),
        }),
      } as any)

      const { data, error } = await getProductById('nonexistent')

      expect(data).toBeNull()
      expect(error).toEqual(notFoundError)
    })
  })

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const newProduct = {
        store_id: 'store-1',
        name: 'Nuevo Producto',
        description: 'Descripción',
        price: 199.99,
        category: 'electrónica',
        is_available: true,
      }

      const createdProduct = { id: '3', ...newProduct, created_at: new Date().toISOString() }

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: createdProduct,
              error: null,
            }),
          }),
        }),
      } as any)

      const { data, error } = await createProduct(newProduct)

      expect(error).toBeNull()
      expect(data?.name).toBe('Nuevo Producto')
      expect(data?.id).toBeDefined()
    })

    it('should handle validation errors', async () => {
      const invalidProduct = {
        store_id: 'store-1',
        name: '', // Invalid: empty name
        price: -10, // Invalid: negative price
      }

      const validationError = { message: 'Validation failed', code: '23514' }

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: validationError,
            }),
          }),
        }),
      } as any)

      const { data, error } = await createProduct(invalidProduct as any)

      expect(data).toBeNull()
      expect(error).toBeDefined()
    })
  })

  describe('updateProduct', () => {
    it('should update an existing product', async () => {
      const updates = { name: 'Producto Actualizado', price: 299.99 }
      const updatedProduct = { ...mockProducts[0], ...updates }

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updatedProduct,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const { data, error } = await updateProduct('1', updates)

      expect(error).toBeNull()
      expect(data?.name).toBe('Producto Actualizado')
      expect(data?.price).toBe(299.99)
    })

    it('should handle update of non-existent product', async () => {
      const notFoundError = { message: 'Product not found', code: 'PGRST116' }

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: notFoundError,
              }),
            }),
          }),
        }),
      } as any)

      const { data, error } = await updateProduct('nonexistent', { name: 'Test' })

      expect(data).toBeNull()
      expect(error).toEqual(notFoundError)
    })
  })

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any)

      const { error } = await deleteProduct('1')

      expect(error).toBeNull()
    })

    it('should handle delete errors', async () => {
      const deleteError = { message: 'Cannot delete', code: '23503' }

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: deleteError,
          }),
        }),
      } as any)

      const { error } = await deleteProduct('1')

      expect(error).toEqual(deleteError)
    })
  })

  describe('getProductStatsByStore', () => {
    it('should calculate product statistics', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockProducts,
            error: null,
          }),
        }),
      } as any)

      const stats = await getProductStatsByStore('store-1')

      expect(stats.total).toBe(2)
      expect(stats.available).toBe(2)
      expect(stats.unavailable).toBe(0)
      expect(stats.categories).toEqual(['electrónica', 'ropa'])
    })

    it('should return zero stats for empty store', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      } as any)

      const stats = await getProductStatsByStore('empty-store')

      expect(stats.total).toBe(0)
      expect(stats.available).toBe(0)
      expect(stats.categories).toEqual([])
    })
  })
})
