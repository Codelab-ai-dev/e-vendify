import { useState, useCallback, useMemo } from 'react'
import { PAGINATION_DEFAULTS } from '@/lib/pagination'

export interface UsePaginationOptions {
  initialPage?: number
  pageSize?: number
  total?: number
}

export interface UsePaginationReturn {
  page: number
  pageSize: number
  offset: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
  firstPage: () => void
  lastPage: () => void
  setPageSize: (size: number) => void
  setTotal: (total: number) => void
}

/**
 * Hook para manejar paginación offset-based
 *
 * @example
 * const pagination = usePagination({ pageSize: 20 })
 *
 * // Usar en query
 * const { data } = await getProducts({
 *   offset: pagination.offset,
 *   limit: pagination.pageSize
 * })
 *
 * // Actualizar total después de obtener datos
 * pagination.setTotal(data.total)
 */
export function usePagination(
  options: UsePaginationOptions = {}
): UsePaginationReturn {
  const {
    initialPage = PAGINATION_DEFAULTS.INITIAL_PAGE,
    pageSize: initialPageSize = PAGINATION_DEFAULTS.PAGE_SIZE,
    total: initialTotal = 0,
  } = options

  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [total, setTotal] = useState(initialTotal)

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize])

  const totalPages = useMemo(
    () => Math.ceil(total / pageSize) || 1,
    [total, pageSize]
  )

  const hasNextPage = useMemo(() => page < totalPages, [page, totalPages])

  const hasPreviousPage = useMemo(() => page > 1, [page])

  const goToPage = useCallback(
    (newPage: number) => {
      const validPage = Math.max(1, Math.min(newPage, totalPages))
      setPage(validPage)
    },
    [totalPages]
  )

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage((prev) => prev + 1)
    }
  }, [hasNextPage])

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPage((prev) => prev - 1)
    }
  }, [hasPreviousPage])

  const firstPage = useCallback(() => {
    setPage(1)
  }, [])

  const lastPage = useCallback(() => {
    setPage(totalPages)
  }, [totalPages])

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size)
    setPage(1) // Reset to first page when changing page size
  }, [])

  return {
    page,
    pageSize,
    offset,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    setPageSize: handleSetPageSize,
    setTotal,
  }
}

/**
 * Hook para paginación por cursor (infinite scroll)
 */
export interface UseCursorPaginationOptions<T> {
  limit?: number
  fetchFn: (cursor: string | null, limit: number) => Promise<{
    data: T[]
    nextCursor: string | null
    hasMore: boolean
  }>
}

export interface UseCursorPaginationReturn<T> {
  data: T[]
  isLoading: boolean
  isLoadingMore: boolean
  error: Error | null
  hasMore: boolean
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  reset: () => void
}

export function useCursorPagination<T>({
  limit = PAGINATION_DEFAULTS.PAGE_SIZE,
  fetchFn,
}: UseCursorPaginationOptions<T>): UseCursorPaginationReturn<T> {
  const [data, setData] = useState<T[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || isLoadingMore) return

    try {
      setIsLoadingMore(true)
      setError(null)

      const result = await fetchFn(cursor, limit)

      setData((prev) => [...prev, ...result.data])
      setCursor(result.nextCursor)
      setHasMore(result.hasMore)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more'))
    } finally {
      setIsLoadingMore(false)
    }
  }, [cursor, hasMore, isLoading, isLoadingMore, fetchFn, limit])

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await fetchFn(null, limit)

      setData(result.data)
      setCursor(result.nextCursor)
      setHasMore(result.hasMore)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh'))
    } finally {
      setIsLoading(false)
    }
  }, [fetchFn, limit])

  const reset = useCallback(() => {
    setData([])
    setCursor(null)
    setHasMore(true)
    setError(null)
  }, [])

  return {
    data,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    reset,
  }
}

/**
 * Hook para infinite scroll con Intersection Observer
 */
export function useInfiniteScroll(
  callback: () => void,
  options: {
    threshold?: number
    rootMargin?: string
    enabled?: boolean
  } = {}
) {
  const { threshold = 0.1, rootMargin = '100px', enabled = true } = options

  const observerRef = useCallback(
    (node: HTMLElement | null) => {
      if (!enabled || !node) return

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            callback()
          }
        },
        { threshold, rootMargin }
      )

      observer.observe(node)

      return () => observer.disconnect()
    },
    [callback, enabled, threshold, rootMargin]
  )

  return observerRef
}
