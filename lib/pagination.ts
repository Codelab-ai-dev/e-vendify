/**
 * Utilidades de Paginación
 *
 * Proporciona funciones y tipos para implementar paginación
 * eficiente en queries de Supabase
 */

export interface PaginationParams {
  page: number // Página actual (1-based)
  pageSize: number // Elementos por página
}

export interface PaginationResult<T> {
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

export interface CursorPaginationParams {
  cursor?: string // ID del último elemento
  limit: number // Número de elementos a obtener
}

export interface CursorPaginationResult<T> {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
  error: any | null
}

/**
 * Calcular offset para paginación offset-based
 */
export function calculateOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize
}

/**
 * Calcular número total de páginas
 */
export function calculateTotalPages(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize)
}

/**
 * Crear resultado de paginación
 */
export function createPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
  error: any = null
): PaginationResult<T> {
  const totalPages = calculateTotalPages(total, pageSize)

  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
    error,
  }
}

/**
 * Crear resultado de paginación por cursor
 */
export function createCursorPaginationResult<T extends { id: string }>(
  data: T[],
  limit: number,
  error: any = null
): CursorPaginationResult<T> {
  const hasMore = data.length > limit
  const items = hasMore ? data.slice(0, limit) : data
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null

  return {
    data: items,
    nextCursor,
    hasMore,
    error,
  }
}

/**
 * Validar parámetros de paginación
 */
export function validatePaginationParams(
  page: number,
  pageSize: number,
  maxPageSize: number = 100
): { valid: boolean; error?: string } {
  if (page < 1) {
    return { valid: false, error: 'Page must be >= 1' }
  }

  if (pageSize < 1) {
    return { valid: false, error: 'Page size must be >= 1' }
  }

  if (pageSize > maxPageSize) {
    return { valid: false, error: `Page size must be <= ${maxPageSize}` }
  }

  return { valid: true }
}

/**
 * Constantes de paginación
 */
export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  INITIAL_PAGE: 1,
} as const

/**
 * Tipos de estrategia de paginación
 */
export type PaginationStrategy = 'offset' | 'cursor'

/**
 * Configuración de paginación
 */
export interface PaginationConfig {
  strategy: PaginationStrategy
  pageSize: number
  maxPageSize?: number
}

/**
 * Metadata de paginación para headers HTTP
 */
export interface PaginationMetadata {
  'X-Page': string
  'X-Page-Size': string
  'X-Total-Count': string
  'X-Total-Pages': string
  'X-Has-Next': string
  'X-Has-Previous': string
}

/**
 * Crear headers de paginación
 */
export function createPaginationHeaders(
  pagination: PaginationResult<any>['pagination']
): PaginationMetadata {
  return {
    'X-Page': pagination.page.toString(),
    'X-Page-Size': pagination.pageSize.toString(),
    'X-Total-Count': pagination.total.toString(),
    'X-Total-Pages': pagination.totalPages.toString(),
    'X-Has-Next': pagination.hasNextPage.toString(),
    'X-Has-Previous': pagination.hasPreviousPage.toString(),
  }
}

/**
 * Helper para crear query params de paginación
 */
export function createPaginationQueryParams(
  page: number,
  pageSize: number
): URLSearchParams {
  const params = new URLSearchParams()
  params.set('page', page.toString())
  params.set('pageSize', pageSize.toString())
  return params
}

/**
 * Parser de query params de paginación
 */
export function parsePaginationQueryParams(
  searchParams: URLSearchParams
): PaginationParams {
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(
    searchParams.get('pageSize') || String(PAGINATION_DEFAULTS.PAGE_SIZE),
    10
  )

  return {
    page: Math.max(1, page),
    pageSize: Math.min(
      Math.max(1, pageSize),
      PAGINATION_DEFAULTS.MAX_PAGE_SIZE
    ),
  }
}
