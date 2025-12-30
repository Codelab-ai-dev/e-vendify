'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { type UsePaginationReturn } from '@/hooks/usePagination'

interface PaginationControlsProps {
  pagination: UsePaginationReturn
  showPageSize?: boolean
  pageSizeOptions?: number[]
  className?: string
}

/**
 * Componente de controles de paginación
 *
 * @example
 * const pagination = usePagination({ pageSize: 20 })
 *
 * <PaginationControls
 *   pagination={pagination}
 *   showPageSize={true}
 * />
 */
export function PaginationControls({
  pagination,
  showPageSize = true,
  pageSizeOptions = [10, 20, 50, 100],
  className = '',
}: PaginationControlsProps) {
  const {
    page,
    pageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    setPageSize,
  } = pagination

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* Info de página actual */}
      <div className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </div>

      {/* Controles de navegación */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={firstPage}
          disabled={!hasPreviousPage}
          aria-label="Primera página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={previousPage}
          disabled={!hasPreviousPage}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Páginas directas */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Mostrar 5 páginas alrededor de la actual
            const startPage = Math.max(1, Math.min(page - 2, totalPages - 4))
            const pageNum = startPage + i

            if (pageNum > totalPages) return null

            return (
              <Button
                key={pageNum}
                variant={page === pageNum ? 'default' : 'outline'}
                size="sm"
                onClick={() => goToPage(pageNum)}
                className="min-w-[2rem]"
              >
                {pageNum}
              </Button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={nextPage}
          disabled={!hasNextPage}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={lastPage}
          disabled={!hasNextPage}
          aria-label="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Selector de tamaño de página */}
      {showPageSize && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Items por página:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => setPageSize(parseInt(value, 10))}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

/**
 * Variante compacta de controles de paginación
 */
export function PaginationControlsCompact({
  pagination,
  className = '',
}: Omit<PaginationControlsProps, 'showPageSize' | 'pageSizeOptions'>) {
  const { page, totalPages, hasNextPage, hasPreviousPage, nextPage, previousPage } = pagination

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={previousPage}
        disabled={!hasPreviousPage}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Anterior
      </Button>

      <span className="text-sm text-muted-foreground px-2">
        {page} / {totalPages}
      </span>

      <Button variant="outline" size="sm" onClick={nextPage} disabled={!hasNextPage}>
        Siguiente
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  )
}

/**
 * Componente de info de paginación (solo texto)
 */
export function PaginationInfo({
  pagination,
  totalItems,
  itemName = 'items',
  className = '',
}: {
  pagination: UsePaginationReturn
  totalItems: number
  itemName?: string
  className?: string
}) {
  const { page, pageSize } = pagination
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div className={`text-sm text-muted-foreground ${className}`}>
      Mostrando {start} a {end} de {totalItems} {itemName}
    </div>
  )
}
