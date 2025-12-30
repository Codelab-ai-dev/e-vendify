'use client'

import { useEffect, useRef } from 'react'
import { useInfiniteScroll } from '@/hooks/usePagination'
import { Loader2 } from 'lucide-react'

interface InfiniteScrollListProps<T> {
  items: T[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  onLoadMore: () => void
  renderItem: (item: T, index: number) => React.ReactNode
  renderEmpty?: () => React.ReactNode
  renderError?: (error: Error) => React.ReactNode
  error?: Error | null
  className?: string
  threshold?: number
  rootMargin?: string
}

/**
 * Componente de lista con infinite scroll
 *
 * @example
 * const { data, isLoading, isLoadingMore, hasMore, loadMore, error } = useCursorPagination({
 *   limit: 20,
 *   fetchFn: async (cursor, limit) => {
 *     const result = await getProductsCursor({ cursor, limit })
 *     return {
 *       data: result.data,
 *       nextCursor: result.nextCursor,
 *       hasMore: result.hasMore
 *     }
 *   }
 * })
 *
 * <InfiniteScrollList
 *   items={data}
 *   isLoading={isLoading}
 *   isLoadingMore={isLoadingMore}
 *   hasMore={hasMore}
 *   onLoadMore={loadMore}
 *   renderItem={(product) => <ProductCard key={product.id} product={product} />}
 * />
 */
export function InfiniteScrollList<T extends { id: string }>({
  items,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  renderItem,
  renderEmpty,
  renderError,
  error,
  className = '',
  threshold = 0.1,
  rootMargin = '100px',
}: InfiniteScrollListProps<T>) {
  const loadingRef = useRef<HTMLDivElement>(null)

  // Usar el hook de infinite scroll
  const observerRef = useInfiniteScroll(onLoadMore, {
    threshold,
    rootMargin,
    enabled: hasMore && !isLoadingMore && !isLoading,
  })

  // Adjuntar el observer al elemento de loading
  useEffect(() => {
    if (loadingRef.current) {
      observerRef(loadingRef.current)
    }
  }, [observerRef])

  // Mostrar error si existe
  if (error && !isLoading) {
    if (renderError) {
      return <>{renderError(error)}</>
    }
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-destructive font-medium">Error al cargar los datos</p>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    )
  }

  // Mostrar loader inicial
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Mostrar mensaje de lista vacía
  if (items.length === 0) {
    if (renderEmpty) {
      return <>{renderEmpty()}</>
    }
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No hay elementos para mostrar</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Lista de items */}
      <div className="space-y-4">
        {items.map((item, index) => renderItem(item, index))}
      </div>

      {/* Loader y trigger para infinite scroll */}
      {hasMore && (
        <div
          ref={loadingRef}
          className="flex items-center justify-center py-8"
          aria-live="polite"
          aria-busy={isLoadingMore}
        >
          {isLoadingMore ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Cargando más...</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              Desplázate para cargar más
            </span>
          )}
        </div>
      )}

      {/* Mensaje cuando ya no hay más items */}
      {!hasMore && items.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <span className="text-sm text-muted-foreground">
            No hay más elementos
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Componente de grid con infinite scroll
 */
export function InfiniteScrollGrid<T extends { id: string }>({
  items,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  renderItem,
  renderEmpty,
  renderError,
  error,
  columns = 3,
  className = '',
  threshold = 0.1,
  rootMargin = '100px',
}: InfiniteScrollListProps<T> & { columns?: number }) {
  const loadingRef = useRef<HTMLDivElement>(null)

  const observerRef = useInfiniteScroll(onLoadMore, {
    threshold,
    rootMargin,
    enabled: hasMore && !isLoadingMore && !isLoading,
  })

  useEffect(() => {
    if (loadingRef.current) {
      observerRef(loadingRef.current)
    }
  }, [observerRef])

  if (error && !isLoading) {
    if (renderError) {
      return <>{renderError(error)}</>
    }
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-destructive font-medium">Error al cargar los datos</p>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (items.length === 0) {
    if (renderEmpty) {
      return <>{renderEmpty()}</>
    }
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No hay elementos para mostrar</p>
      </div>
    )
  }

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  }[columns] || 'grid-cols-3'

  return (
    <div className={className}>
      {/* Grid de items */}
      <div className={`grid ${gridColsClass} gap-4`}>
        {items.map((item, index) => renderItem(item, index))}
      </div>

      {/* Loader y trigger */}
      {hasMore && (
        <div
          ref={loadingRef}
          className="flex items-center justify-center py-8"
          aria-live="polite"
          aria-busy={isLoadingMore}
        >
          {isLoadingMore ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Cargando más...</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              Desplázate para cargar más
            </span>
          )}
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <span className="text-sm text-muted-foreground">
            No hay más elementos
          </span>
        </div>
      )}
    </div>
  )
}
