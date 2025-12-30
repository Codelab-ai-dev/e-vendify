# Guía para Arreglar Tests Pendientes

Esta guía te ayudará a completar los tests que actualmente están fallando.

---

## 📊 Estado Actual

- ✅ **66 tests pasando** (60%)
- ⚠️ **44 tests necesitan ajustes** (40%)

---

## 🔧 Prioridad 1: Mocks de Supabase (22 tests)

### Problema

Los mocks de Supabase en `test/setup.ts` no coinciden exactamente con la estructura real.

### Solución

Actualizar `test/setup.ts`:

```typescript
// test/setup.ts
vi.mock('@/lib/supabase', () => {
  const mockFrom = vi.fn()
  const mockAuth = {
    getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    signInWithPassword: vi.fn(() => Promise.resolve({ data: null, error: null })),
    signUp: vi.fn(() => Promise.resolve({ data: null, error: null })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
  }

  return {
    supabase: {
      from: mockFrom,
      auth: mockAuth,
    },
    // Re-exportar funciones para que tests puedan importarlas
    handleSupabaseError: vi.fn((err) => err),
    signUpWithRetry: vi.fn(),
    signInWithEmail: vi.fn(),
    signOut: vi.fn(),
    getCurrentUser: vi.fn(),
    isAdmin: vi.fn(),
  }
})
```

### Tests a Arreglar

1. `lib/__tests__/supabase.test.ts` - Todos (22 tests)

**Pasos:**

```bash
# 1. Actualizar test/setup.ts con el mock correcto
# 2. En cada test, mockear la implementación específica:

it('should sign in user', async () => {
  const mockSignIn = vi.fn().mockResolvedValue({
    data: { user: { id: '123' } },
    error: null
  })

  vi.mocked(supabase.auth.signInWithPassword).mockImplementation(mockSignIn)

  // ... resto del test
})
```

---

## 🔧 Prioridad 2: Tests de Products (5 tests)

### Tests Fallando

1. `getProductsWithFilters` - apply category filter
2. `getProductsWithFilters` - apply price range filter
3. `getProductsWithFilters` - combine multiple filters
4. `getProductStatsByStore` - calculate statistics
5. `getProductStatsByStore` - zero stats for empty store

### Problema

Los mocks de query chains no están correctamente encadenados.

### Solución

```typescript
// lib/__tests__/products.test.ts

describe('getProductsWithFilters', () => {
  it('should apply multiple filters', async () => {
    // Crear chain completo que retorna a sí mismo
    const mockChain = {
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockProducts,
        error: null
      })
    }

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockChain)
    } as any)

    const { data, error } = await getProductsWithFilters({
      storeId: 'store-1',
      category: 'electronics',
      minPrice: 50,
      maxPrice: 200,
      isAvailable: true
    })

    expect(error).toBeNull()
    expect(mockChain.eq).toHaveBeenCalledWith('store_id', 'store-1')
    expect(mockChain.eq).toHaveBeenCalledWith('category', 'electronics')
    expect(mockChain.gte).toHaveBeenCalledWith('price', 50)
    expect(mockChain.lte).toHaveBeenCalledWith('price', 200)
  })
})
```

**Comando para testear:**

```bash
pnpm test products -- -t "getProductsWithFilters"
```

---

## 🔧 Prioridad 3: Tests de Cart (9 tests)

### Tests Fallando

1. Load cart from localStorage
2. Respect custom quantity
3. Calculate total price
4. Handle decimal prices
5. Count total items
6. Persist to localStorage
7. Restore from localStorage
8. Very large quantities
9. Very small prices

### Problema

Zustand store se comparte entre tests, necesita reset apropiado.

### Solución

```typescript
// lib/store/__tests__/useCart.test.ts

describe('useCart', () => {
  beforeEach(() => {
    // Limpiar localStorage completamente
    localStorage.clear()

    // Reset el store de Zustand
    const { result } = renderHook(() => useCart())
    act(() => {
      result.current.clearCart()
    })
  })

  it('should load cart from localStorage', () => {
    // Preparar localStorage ANTES de renderizar hook
    const savedCart = {
      state: {
        items: [{
          id: '1',
          storeId: 'store-1',
          name: 'Test Product',
          price: 99.99,
          quantity: 2
        }]
      }
    }

    localStorage.setItem('cart-storage', JSON.stringify(savedCart))

    // Ahora renderizar hook (debería cargar del localStorage)
    const { result } = renderHook(() => useCart())

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(2)
  })

  it('should calculate total correctly', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.addItem({
        id: '1',
        storeId: 'store-1',
        name: 'Product 1',
        price: 100,
        quantity: 2
      })
      result.current.addItem({
        id: '2',
        storeId: 'store-1',
        name: 'Product 2',
        price: 50,
        quantity: 3
      })
    })

    const total = result.current.total()
    expect(total).toBe(350) // (100 * 2) + (50 * 3) = 350
  })
})
```

**Comando para testear:**

```bash
pnpm test useCart
```

---

## 🔧 Prioridad 4: Tests de Components (8 tests)

### Tests Fallando

1. Display retry countdown
2. Countdown properly
3. Enable retry button after countdown
4. Call onRetry when clicked
5. Set error on 429 response
6. Clear error on successful response
7. Provide clearError function
8. Handle missing retryAfter

### Problema

Tests async no esperan correctamente los updates de estado.

### Solución

```typescript
// components/__tests__/RateLimitError.test.tsx

import { waitFor } from '@testing-library/react'

describe('RateLimitError', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should display retry countdown', async () => {
    render(<RateLimitError retryAfter={60} limit={100} />)

    // Usar waitFor para esperar que el componente renderice
    await waitFor(() => {
      expect(screen.getByText(/60 segundo/i)).toBeInTheDocument()
    })
  })

  it('should countdown properly', async () => {
    render(<RateLimitError retryAfter={5} limit={100} />)

    await waitFor(() => {
      expect(screen.getByText(/5 segundo/i)).toBeInTheDocument()
    })

    // Avanzar timers
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(screen.getByText(/4 segundo/i)).toBeInTheDocument()
    })
  })
})

describe('useRateLimitHandler', () => {
  it('should set error on 429 response', async () => {
    let hookResult: any

    function TestComponent() {
      hookResult = useRateLimitHandler()
      return null
    }

    render(<TestComponent />)

    const mockResponse = {
      status: 429,
      json: vi.fn().mockResolvedValue({
        retryAfter: 60,
        limit: 100,
        reset: '2025-12-03T15:30:00Z'
      })
    } as any

    // Ejecutar en act
    await act(async () => {
      await hookResult.handleResponse(mockResponse)
    })

    // Esperar actualización
    await waitFor(() => {
      expect(hookResult.rateLimitError).toBeDefined()
      expect(hookResult.rateLimitError.retryAfter).toBe(60)
    })
  })
})
```

**Comando para testear:**

```bash
pnpm test RateLimitError
```

---

## 🎯 Workflow Recomendado

### Paso 1: Arreglar un Módulo a la Vez

```bash
# Trabajar en modo watch con UI
pnpm test:ui

# O específico:
pnpm test -- supabase --watch
```

### Paso 2: Verificar con Coverage

```bash
pnpm test:coverage

# Ver reporte
open coverage/index.html
```

### Paso 3: Commit cuando módulo esté 100%

```bash
git add .
git commit -m "test: fix all supabase tests (22/22 passing)"
```

---

## 📋 Checklist de Progreso

### Módulo Supabase
- [ ] handleSupabaseError (4 tests)
- [ ] signUpWithRetry (6 tests)
- [ ] signInWithEmail (3 tests)
- [ ] signOut (2 tests)
- [ ] getCurrentUser (3 tests)
- [ ] isAdmin (4 tests)

### Módulo Products
- [ ] getProductsWithFilters (3 tests)
- [ ] getProductStatsByStore (2 tests)

### Módulo Cart
- [ ] Persistence (3 tests)
- [ ] Calculations (3 tests)
- [ ] Edge cases (3 tests)

### Módulo Components
- [ ] Async rendering (4 tests)
- [ ] Hook behavior (4 tests)

---

## 🚀 Comandos Útiles

```bash
# Ejecutar tests en watch mode
pnpm test:watch

# Ejecutar solo tests que fallaron
pnpm test -- --reporter=verbose --bail

# Ejecutar tests de un archivo específico
pnpm test -- lib/__tests__/supabase.test.ts

# Ver UI de tests
pnpm test:ui

# Ejecutar con mayor timeout (para debugging)
pnpm test -- --test-timeout=30000
```

---

## 💡 Tips de Debugging

### 1. Ver qué está renderizando

```typescript
import { screen } from '@testing-library/react'

it('debug test', () => {
  render(<Component />)
  screen.debug() // Imprime el DOM actual
})
```

### 2. Ver logs de consola

```typescript
beforeEach(() => {
  vi.spyOn(console, 'log')
  vi.spyOn(console, 'error')
})

it('test', () => {
  // ... test code
  console.log(console.log.mock.calls) // Ver todos los logs
})
```

### 3. Inspeccionar mocks

```typescript
it('test', () => {
  myMockFunction()

  console.log(myMockFunction.mock.calls) // Ver todas las llamadas
  console.log(myMockFunction.mock.results) // Ver resultados
})
```

---

## 📈 Meta de Coverage

| Módulo | Meta | Comando para Verificar |
|--------|------|------------------------|
| supabase.ts | 95% | `pnpm test:coverage -- supabase` |
| products.ts | 90% | `pnpm test:coverage -- products` |
| useCart.ts | 95% | `pnpm test:coverage -- useCart` |
| RateLimitError | 80% | `pnpm test:coverage -- RateLimitError` |

---

## 🎓 Recursos

- [Vitest API](https://vitest.dev/api/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Async Utilities](https://testing-library.com/docs/dom-testing-library/api-async)
- [User Event](https://testing-library.com/docs/user-event/intro)
- [Mock Functions](https://vitest.dev/api/vi.html#vi-fn)

---

**¡Éxito arreglando los tests!** 🚀
