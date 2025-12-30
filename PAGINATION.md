# Guía de Paginación

## 📊 Resumen

E-Vendify ahora incluye un sistema completo de paginación con dos estrategias:

- **Offset-based**: Paginación tradicional con números de página (1, 2, 3...)
- **Cursor-based**: Paginación infinita (infinite scroll)

### Beneficios

- ✅ **Reducción de carga en DB** - Solo consulta los datos necesarios
- ✅ **Mejor performance** - Respuestas más rápidas
- ✅ **Mejor UX** - Navegación fluida entre páginas
- ✅ **Escalabilidad** - Maneja grandes volúmenes de datos
- ✅ **SEO-friendly** - URLs con parámetros de página

---

## 🛠️ Arquitectura

### Estructura de Archivos

```
lib/
  ├── pagination.ts              # Utilidades y tipos base
  ├── products.ts                # Queries de productos + paginación
  └── stores.ts                  # Queries de tiendas + paginación

hooks/
  └── usePagination.ts           # Hooks de React para paginación

components/
  ├── PaginationControls.tsx     # Controles UI de paginación
  └── InfiniteScrollList.tsx     # Componente de infinite scroll
```

---

## 📚 Utilidades Base (`lib/pagination.ts`)

### Tipos

```typescript
// Paginación offset-based
interface PaginationParams {
  page: number      // Página actual (1-based)
  pageSize: number  // Items por página
}

interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  error: any | null
}

// Paginación cursor-based
interface CursorPaginationParams {
  cursor?: string  // ID del último elemento
  limit: number    // Número de elementos a obtener
}

interface CursorPaginationResult<T> {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
  error: any | null
}
```

### Funciones Auxiliares

```typescript
// Calcular offset para queries
calculateOffset(page: number, pageSize: number): number

// Calcular total de páginas
calculateTotalPages(total: number, pageSize: number): number

// Crear resultado de paginación
createPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
  error?: any
): PaginationResult<T>

// Crear resultado de paginación por cursor
createCursorPaginationResult<T extends { id: string }>(
  data: T[],
  limit: number,
  error?: any
): CursorPaginationResult<T>

// Validar parámetros
validatePaginationParams(
  page: number,
  pageSize: number,
  maxPageSize?: number
): { valid: boolean; error?: string }

// Helpers para URLs
createPaginationQueryParams(page: number, pageSize: number): URLSearchParams
parsePaginationQueryParams(searchParams: URLSearchParams): PaginationParams
```

### Constantes

```typescript
export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  INITIAL_PAGE: 1,
}
```

---

## 🔄 Queries Paginados

### Productos

#### Offset-based

```typescript
// Todos los productos
const result = await getAllProductsPaginated({
  page: 1,
  pageSize: 20
})

// Por tienda
const result = await getProductsByStorePaginated('store-id', {
  page: 1,
  pageSize: 20
})

// Búsqueda
const result = await searchProductsPaginated('laptop', {
  page: 1,
  pageSize: 20
})

// Con filtros avanzados
const result = await getProductsWithFiltersPaginated(
  {
    storeId: 'store-id',
    category: 'Electronics',
    minPrice: 100,
    maxPrice: 500,
    isAvailable: true,
    searchTerm: 'laptop'
  },
  { page: 1, pageSize: 20 }
)
```

#### Cursor-based

```typescript
// Primera página
const result = await getProductsCursor({
  cursor: null,
  limit: 20
})

// Página siguiente
const result = await getProductsCursor({
  cursor: lastProduct.id,
  limit: 20
})

// Por tienda
const result = await getProductsByStoreCursor('store-id', {
  cursor: null,
  limit: 20
})
```

### Tiendas

```typescript
// Todas las tiendas
const result = await getAllStoresPaginated({
  page: 1,
  pageSize: 20
})

// Con filtros
const result = await getStoresWithFiltersPaginated(
  {
    status: 'active',
    plan: 'premium',
    city: 'Madrid',
    search: 'tech'
  },
  { page: 1, pageSize: 20 }
)

// Por categoría
const result = await getStoresByCategoryPaginated('Technology', {
  page: 1,
  pageSize: 20
})

// Cursor-based
const result = await getStoresCursor({
  cursor: null,
  limit: 20
})

// Solo tiendas activas (cursor)
const result = await getActiveStoresCursor({
  cursor: null,
  limit: 20
})
```

---

## 🎣 React Hooks

### `usePagination` - Offset-based

```typescript
import { usePagination } from '@/hooks/usePagination'

function ProductsPage() {
  const pagination = usePagination({
    initialPage: 1,
    pageSize: 20,
    total: 0  // Actualizar después de fetch
  })

  // Fetch data
  useEffect(() => {
    async function loadProducts() {
      const result = await getAllProductsPaginated({
        page: pagination.page,
        pageSize: pagination.pageSize
      })

      if (result.data) {
        setProducts(result.data)
        pagination.setTotal(result.pagination.total)
      }
    }
    loadProducts()
  }, [pagination.page, pagination.pageSize])

  return (
    <div>
      {/* Mostrar productos */}
      <ProductList products={products} />

      {/* Controles de paginación */}
      <PaginationControls pagination={pagination} />
    </div>
  )
}
```

**API del hook:**

```typescript
{
  // Estado
  page: number                  // Página actual
  pageSize: number              // Items por página
  offset: number                // Offset calculado
  totalPages: number            // Total de páginas
  hasNextPage: boolean          // Hay página siguiente
  hasPreviousPage: boolean      // Hay página anterior

  // Acciones
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
  firstPage: () => void
  lastPage: () => void
  setPageSize: (size: number) => void
  setTotal: (total: number) => void
}
```

### `useCursorPagination` - Cursor-based

```typescript
import { useCursorPagination } from '@/hooks/usePagination'

function ProductsInfiniteScroll() {
  const {
    data,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    reset
  } = useCursorPagination({
    limit: 20,
    fetchFn: async (cursor, limit) => {
      const result = await getProductsCursor({ cursor, limit })
      return {
        data: result.data,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore
      }
    }
  })

  return (
    <InfiniteScrollList
      items={data}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      hasMore={hasMore}
      onLoadMore={loadMore}
      renderItem={(product) => (
        <ProductCard key={product.id} product={product} />
      )}
    />
  )
}
```

**API del hook:**

```typescript
{
  // Estado
  data: T[]                     // Items cargados
  isLoading: boolean            // Carga inicial
  isLoadingMore: boolean        // Cargando más items
  error: Error | null           // Error si existe
  hasMore: boolean              // Hay más items

  // Acciones
  loadMore: () => Promise<void>     // Cargar siguiente página
  refresh: () => Promise<void>      // Recargar desde inicio
  reset: () => void                 // Resetear estado
}
```

### `useInfiniteScroll` - Intersection Observer

```typescript
import { useInfiniteScroll } from '@/hooks/usePagination'

function CustomInfiniteList() {
  const observerRef = useInfiniteScroll(loadMore, {
    threshold: 0.1,       // 10% visible
    rootMargin: '100px',  // Cargar 100px antes
    enabled: hasMore      // Solo si hay más items
  })

  return (
    <div>
      {items.map(item => <Item key={item.id} {...item} />)}
      <div ref={observerRef}>Loading...</div>
    </div>
  )
}
```

---

## 🎨 Componentes UI

### `PaginationControls` - Controles completos

```typescript
import { PaginationControls } from '@/components/PaginationControls'

<PaginationControls
  pagination={pagination}
  showPageSize={true}
  pageSizeOptions={[10, 20, 50, 100]}
  className="mt-4"
/>
```

**Features:**
- Botones Primera/Anterior/Siguiente/Última
- Números de página directos (5 visibles)
- Selector de items por página
- Info de página actual

### `PaginationControlsCompact` - Versión compacta

```typescript
import { PaginationControlsCompact } from '@/components/PaginationControls'

<PaginationControlsCompact
  pagination={pagination}
  className="mt-4"
/>
```

**Features:**
- Solo Anterior/Siguiente
- Contador de páginas
- Diseño minimalista

### `PaginationInfo` - Solo información

```typescript
import { PaginationInfo } from '@/components/PaginationControls'

<PaginationInfo
  pagination={pagination}
  totalItems={150}
  itemName="productos"
  className="text-sm"
/>
// Output: "Mostrando 21 a 40 de 150 productos"
```

### `InfiniteScrollList` - Lista infinita

```typescript
import { InfiniteScrollList } from '@/components/InfiniteScrollList'

<InfiniteScrollList
  items={data}
  isLoading={isLoading}
  isLoadingMore={isLoadingMore}
  hasMore={hasMore}
  onLoadMore={loadMore}
  renderItem={(product) => (
    <ProductCard key={product.id} product={product} />
  )}
  renderEmpty={() => <EmptyState />}
  renderError={(error) => <ErrorState error={error} />}
  threshold={0.1}
  rootMargin="100px"
  className="space-y-4"
/>
```

### `InfiniteScrollGrid` - Grid infinito

```typescript
import { InfiniteScrollGrid } from '@/components/InfiniteScrollList'

<InfiniteScrollGrid
  items={products}
  isLoading={isLoading}
  isLoadingMore={isLoadingMore}
  hasMore={hasMore}
  onLoadMore={loadMore}
  renderItem={(product) => (
    <ProductCard key={product.id} product={product} />
  )}
  columns={3}  // 1-6, responsive automático
  className="gap-4"
/>
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Página de Productos con Paginación

```typescript
'use client'

import { useState, useEffect } from 'react'
import { usePagination } from '@/hooks/usePagination'
import { getAllProductsPaginated } from '@/lib/products'
import { PaginationControls, PaginationInfo } from '@/components/PaginationControls'
import { ProductCard } from '@/components/ProductCard'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const pagination = usePagination({
    initialPage: 1,
    pageSize: 20
  })

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true)
      const result = await getAllProductsPaginated({
        page: pagination.page,
        pageSize: pagination.pageSize
      })

      if (result.data) {
        setProducts(result.data)
        pagination.setTotal(result.pagination.total)
      }
      setIsLoading(false)
    }

    loadProducts()
  }, [pagination.page, pagination.pageSize])

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="container py-8">
      <h1>Productos</h1>

      {/* Info */}
      <PaginationInfo
        pagination={pagination}
        totalItems={pagination.totalPages * pagination.pageSize}
        itemName="productos"
      />

      {/* Grid de productos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Controles */}
      <PaginationControls pagination={pagination} />
    </div>
  )
}
```

### Ejemplo 2: Infinite Scroll

```typescript
'use client'

import { useCursorPagination } from '@/hooks/usePagination'
import { getProductsCursor } from '@/lib/products'
import { InfiniteScrollGrid } from '@/components/InfiniteScrollList'
import { ProductCard } from '@/components/ProductCard'

export default function ProductsInfiniteScroll() {
  const {
    data: products,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    error
  } = useCursorPagination({
    limit: 20,
    fetchFn: async (cursor, limit) => {
      const result = await getProductsCursor({ cursor, limit })
      return {
        data: result.data || [],
        nextCursor: result.nextCursor,
        hasMore: result.hasMore
      }
    }
  })

  return (
    <div className="container py-8">
      <h1>Productos</h1>

      <InfiniteScrollGrid
        items={products}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onLoadMore={loadMore}
        error={error}
        renderItem={(product) => (
          <ProductCard key={product.id} product={product} />
        )}
        columns={3}
        className="mt-8"
      />
    </div>
  )
}
```

### Ejemplo 3: Búsqueda con Paginación

```typescript
'use client'

import { useState, useEffect } from 'react'
import { usePagination } from '@/hooks/usePagination'
import { searchProductsPaginated } from '@/lib/products'
import { PaginationControls } from '@/components/PaginationControls'
import { Input } from '@/components/ui/input'

export default function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState([])

  const pagination = usePagination({ pageSize: 20 })

  useEffect(() => {
    async function search() {
      if (!searchTerm) return

      const result = await searchProductsPaginated(searchTerm, {
        page: pagination.page,
        pageSize: pagination.pageSize
      })

      if (result.data) {
        setProducts(result.data)
        pagination.setTotal(result.pagination.total)
      }
    }

    search()
  }, [searchTerm, pagination.page, pagination.pageSize])

  return (
    <div>
      <Input
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value)
          pagination.firstPage() // Resetear a página 1
        }}
        placeholder="Buscar productos..."
      />

      <div className="grid grid-cols-3 gap-4 my-8">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>

      <PaginationControls pagination={pagination} />
    </div>
  )
}
```

### Ejemplo 4: Filtros + Paginación

```typescript
'use client'

import { useState, useEffect } from 'react'
import { usePagination } from '@/hooks/usePagination'
import { getProductsWithFiltersPaginated } from '@/lib/products'

export default function ProductsWithFilters() {
  const [filters, setFilters] = useState({
    category: '',
    minPrice: undefined,
    maxPrice: undefined,
    isAvailable: true
  })

  const [products, setProducts] = useState([])
  const pagination = usePagination({ pageSize: 20 })

  useEffect(() => {
    async function loadProducts() {
      const result = await getProductsWithFiltersPaginated(filters, {
        page: pagination.page,
        pageSize: pagination.pageSize
      })

      if (result.data) {
        setProducts(result.data)
        pagination.setTotal(result.pagination.total)
      }
    }

    loadProducts()
  }, [filters, pagination.page, pagination.pageSize])

  return (
    <div>
      {/* Filtros */}
      <div className="filters">
        <Select
          value={filters.category}
          onValueChange={(val) => {
            setFilters({ ...filters, category: val })
            pagination.firstPage()
          }}
        >
          <SelectItem value="">Todas las categorías</SelectItem>
          <SelectItem value="Electronics">Electrónica</SelectItem>
          {/* ... */}
        </Select>

        {/* Más filtros... */}
      </div>

      {/* Productos */}
      <ProductGrid products={products} />

      {/* Paginación */}
      <PaginationControls pagination={pagination} />
    </div>
  )
}
```

---

## 🚀 Mejores Prácticas

### ✅ DO

1. **Usar pageSize apropiado**
   - 10-20 para grids con imágenes grandes
   - 20-50 para listas
   - Máximo 100 items

2. **Resetear a página 1 cuando cambian filtros**
```typescript
const handleFilterChange = (newFilter) => {
  setFilters(newFilter)
  pagination.firstPage()  // ✅
}
```

3. **Mostrar estados de carga**
```typescript
{isLoading ? <Skeleton /> : <ProductList />}
```

4. **Manejar errores**
```typescript
if (error) {
  return <ErrorMessage error={error} />
}
```

5. **Usar URL params para SEO**
```typescript
// Next.js App Router
const searchParams = useSearchParams()
const page = parseInt(searchParams.get('page') || '1', 10)

const pagination = usePagination({ initialPage: page })

// Actualizar URL al cambiar página
useEffect(() => {
  router.push(`?page=${pagination.page}`)
}, [pagination.page])
```

### ❌ DON'T

1. **No paginar pequeños datasets**
   - < 50 items: Mostrar todo
   - 50-100 items: Considerar paginación
   - > 100 items: Siempre paginar

2. **No usar pageSize muy grande**
```typescript
// ❌ INCORRECTO
const pagination = usePagination({ pageSize: 1000 })

// ✅ CORRECTO
const pagination = usePagination({ pageSize: 20 })
```

3. **No olvidar actualizar total**
```typescript
// ❌ INCORRECTO - total siempre 0
const pagination = usePagination({ total: 0 })

// ✅ CORRECTO - actualizar después de fetch
useEffect(() => {
  loadData().then((result) => {
    pagination.setTotal(result.pagination.total)
  })
}, [])
```

---

## 📊 Performance

### Offset-based vs Cursor-based

| Aspecto | Offset-based | Cursor-based |
|---------|--------------|--------------|
| Navegación | Cualquier página | Solo siguiente |
| Performance | Degrada con offset alto | Constante |
| SEO | ✅ URLs compartibles | ❌ Sin URLs |
| Uso | Páginas de catálogo | Infinite scroll, feeds |
| Complejidad | Baja | Media |

### Recomendaciones

**Usar Offset-based cuando:**
- Necesitas saltar a páginas específicas
- SEO es importante
- Usuarios necesitan ver "página X de Y"
- Ejemplo: Catálogo de productos, resultados de búsqueda

**Usar Cursor-based cuando:**
- Infinite scroll / load more
- Datasets muy grandes
- Performance crítica
- Ejemplo: Feeds, timelines, listas largas

---

## 🔧 Migración

### Antes (sin paginación)

```typescript
// ❌ ANTES - Obtiene TODOS los productos
const { data: products } = await getAllProducts()

return (
  <div>
    {products.map(p => <ProductCard key={p.id} product={p} />)}
  </div>
)
```

### Después (con paginación)

```typescript
// ✅ DESPUÉS - Solo 20 productos a la vez
const pagination = usePagination({ pageSize: 20 })
const [products, setProducts] = useState([])

useEffect(() => {
  getAllProductsPaginated({
    page: pagination.page,
    pageSize: pagination.pageSize
  }).then((result) => {
    setProducts(result.data)
    pagination.setTotal(result.pagination.total)
  })
}, [pagination.page, pagination.pageSize])

return (
  <div>
    {products.map(p => <ProductCard key={p.id} product={p} />)}
    <PaginationControls pagination={pagination} />
  </div>
)
```

---

## 📈 Testing

```typescript
import { describe, it, expect } from 'vitest'
import {
  calculateOffset,
  calculateTotalPages,
  createPaginationResult
} from '@/lib/pagination'

describe('Pagination Utilities', () => {
  it('calculates offset correctly', () => {
    expect(calculateOffset(1, 20)).toBe(0)
    expect(calculateOffset(2, 20)).toBe(20)
    expect(calculateOffset(3, 20)).toBe(40)
  })

  it('calculates total pages', () => {
    expect(calculateTotalPages(100, 20)).toBe(5)
    expect(calculateTotalPages(101, 20)).toBe(6)
    expect(calculateTotalPages(0, 20)).toBe(0)
  })

  it('creates pagination result', () => {
    const result = createPaginationResult(
      [{ id: '1' }],
      100,
      1,
      20
    )

    expect(result.data).toHaveLength(1)
    expect(result.pagination.totalPages).toBe(5)
    expect(result.pagination.hasNextPage).toBe(true)
    expect(result.pagination.hasPreviousPage).toBe(false)
  })
})
```

---

## 🎓 Recursos

- [Supabase Pagination Docs](https://supabase.com/docs/guides/api/pagination)
- [Next.js Pagination Best Practices](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns#pagination)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

---

**Implementado**: Diciembre 2025
**Versión**: 1.0
