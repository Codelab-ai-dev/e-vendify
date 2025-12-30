import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCart } from '../useCart'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useCart Hook', () => {
  beforeEach(() => {
    localStorage.clear()
    // Reset the store state
    const { result } = renderHook(() => useCart())
    act(() => {
      result.current.clearCart()
    })
  })

  describe('Initial State', () => {
    it('should initialize with empty cart', () => {
      const { result } = renderHook(() => useCart())

      expect(result.current.items).toEqual([])
      expect(result.current.total()).toBe(0)
      expect(result.current.itemCount()).toBe(0)
    })

    it('should load cart from localStorage if available', () => {
      const savedCart = [
        {
          id: '1',
          storeId: 'store-1',
          name: 'Producto Test',
          price: 99.99,
          quantity: 2,
          image_url: 'https://example.com/image.jpg',
        },
      ]

      localStorage.setItem('cart-storage', JSON.stringify({ state: { items: savedCart } }))

      const { result } = renderHook(() => useCart())

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].name).toBe('Producto Test')
    })
  })

  describe('addItem', () => {
    it('should add a new item to cart', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem({
          id: '1',
          storeId: 'store-1',
          name: 'Producto Test',
          price: 99.99,
          quantity: 1,
          image_url: 'https://example.com/image.jpg',
        })
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].name).toBe('Producto Test')
      expect(result.current.items[0].quantity).toBe(1)
    })

    it('should increase quantity if item already exists', () => {
      const { result } = renderHook(() => useCart())

      const item = {
        id: '1',
        storeId: 'store-1',
        name: 'Producto Test',
        price: 99.99,
        quantity: 1,
        image_url: 'https://example.com/image.jpg',
      }

      act(() => {
        result.current.addItem(item)
        result.current.addItem(item)
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].quantity).toBe(2)
    })

    it('should add multiple different items', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem({
          id: '1',
          storeId: 'store-1',
          name: 'Producto 1',
          price: 99.99,
          quantity: 1,
        })

        result.current.addItem({
          id: '2',
          storeId: 'store-1',
          name: 'Producto 2',
          price: 149.99,
          quantity: 1,
        })
      })

      expect(result.current.items).toHaveLength(2)
    })

    it('should respect custom quantity when adding item', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem({
          id: '1',
          storeId: 'store-1',
          name: 'Producto Test',
          price: 99.99,
          quantity: 5,
        })
      })

      expect(result.current.items[0].quantity).toBe(5)
    })
  })

  describe('removeItem', () => {
    it('should remove an item from cart', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem({
          id: '1',
          storeId: 'store-1',
          name: 'Producto Test',
          price: 99.99,
          quantity: 1,
        })

        result.current.removeItem('1')
      })

      expect(result.current.items).toHaveLength(0)
    })

    it('should only remove the specified item', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem({
          id: '1',
          storeId: 'store-1',
          name: 'Producto 1',
          price: 99.99,
          quantity: 1,
        })

        result.current.addItem({
          id: '2',
          storeId: 'store-1',
          name: 'Producto 2',
          price: 149.99,
          quantity: 1,
        })

        result.current.removeItem('1')
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].id).toBe('2')
    })

    it('should do nothing if item does not exist', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem({
          id: '1',
          storeId: 'store-1',
          name: 'Producto Test',
          price: 99.99,
          quantity: 1,
        })

        result.current.removeItem('nonexistent')
      })

      expect(result.current.items).toHaveLength(1)
    })
  })

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem({
          id: '1',
          storeId: 'store-1',
          name: 'Producto Test',
          price: 99.99,
          quantity: 1,
        })

        result.current.updateQuantity('1', 5)
      })

      expect(result.current.items[0].quantity).toBe(5)
    })

    it('should remove item when quantity is 0', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem({
          id: '1',
          storeId: 'store-1',
          name: 'Producto Test',
          price: 99.99,
          quantity: 2,
        })

        result.current.updateQuantity('1', 0)
      })

      expect(result.current.items).toHaveLength(0)
    })

    it('should not allow negative quantities', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem({
          id: '1',
          storeId: 'store-1',
          name: 'Producto Test',
          price: 99.99,
          quantity: 2,
        })

        result.current.updateQuantity('1', -1)
      })

      expect(result.current.items).toHaveLength(0)
    })

    it('should do nothing if item does not exist', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem({
          id: '1',
          storeId: 'store-1',
          name: 'Producto Test',
          price: 99.99,
          quantity: 1,
        })

        result.current.updateQuantity('nonexistent', 5)
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].quantity).toBe(1)
    })
  })

  describe('clearCart', () => {
    it('should remove all items from cart', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem({
          id: '1',
          storeId: 'store-1',
          name: 'Producto 1',
          price: 99.99,
          quantity: 1,
        })

        result.current.addItem({
          id: '2',
          storeId: 'store-1',
          name: 'Producto 2',
          price: 149.99,
          quantity: 1,
        })

        result.current.clearCart()
      })

      expect(result.current.items).toHaveLength(0)
    })
  })

  describe('total', () => {
    it('should calculate total price correctly', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem({
          id: '1',
          storeId: 'store-1',
          name: 'Producto 1',
          price: 100,
          quantity: 2,
        })

        result.current.addItem({
          id: '2',
          storeId: 'store-1',
          name: 'Producto 2',
          price: 50,
          quantity: 3,
        })
      })

      // (100 * 2) + (50 * 3) = 350
      expect(result.current.total()).toBe(350)
    })

    it('should return 0 for empty cart', () => {
      const { result } = renderHook(() => useCart())

      expect(result.current.total()).toBe(0)
    })

    it('should handle decimal prices correctly', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem({
          id: '1',
          storeId: 'store-1',
          name: 'Producto Test',
          price: 99.99,
          quantity: 2,
        })
      })

      expect(result.current.total()).toBeCloseTo(199.98, 2)
    })
  })

  describe('itemCount', () => {
    it('should count total items in cart', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem({
          id: '1',
          storeId: 'store-1',
          name: 'Producto 1',
          price: 100,
          quantity: 2,
        })

        result.current.addItem({
          id: '2',
          storeId: 'store-1',
          name: 'Producto 2',
          price: 50,
          quantity: 3,
        })
      })

      expect(result.current.itemCount()).toBe(5)
    })

    it('should return 0 for empty cart', () => {
      const { result } = renderHook(() => useCart())

      expect(result.current.itemCount()).toBe(0)
    })
  })

  describe('Persistence', () => {
    it('should persist cart to localStorage on changes', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem({
          id: '1',
          storeId: 'store-1',
          name: 'Producto Test',
          price: 99.99,
          quantity: 1,
        })
      })

      const stored = localStorage.getItem('cart-storage')
      expect(stored).toBeTruthy()

      if (stored) {
        const parsed = JSON.parse(stored)
        expect(parsed.state.items).toHaveLength(1)
      }
    })

    it('should restore cart state from localStorage', () => {
      // First render - add items
      const { result: result1 } = renderHook(() => useCart())

      act(() => {
        result1.current.addItem({
          id: '1',
          storeId: 'store-1',
          name: 'Producto Test',
          price: 99.99,
          quantity: 2,
        })
      })

      // Second render - should restore from localStorage
      const { result: result2 } = renderHook(() => useCart())

      expect(result2.current.items).toHaveLength(1)
      expect(result2.current.items[0].quantity).toBe(2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle adding item with missing optional fields', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem({
          id: '1',
          storeId: 'store-1',
          name: 'Producto Mínimo',
          price: 50,
          quantity: 1,
          // image_url omitted
        })
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].image_url).toBeUndefined()
    })

    it('should handle very large quantities', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem({
          id: '1',
          storeId: 'store-1',
          name: 'Producto Test',
          price: 10,
          quantity: 1000,
        })
      })

      expect(result.current.total()).toBe(10000)
      expect(result.current.itemCount()).toBe(1000)
    })

    it('should handle very small prices', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem({
          id: '1',
          storeId: 'store-1',
          name: 'Producto Barato',
          price: 0.01,
          quantity: 100,
        })
      })

      expect(result.current.total()).toBeCloseTo(1, 2)
    })
  })
})
