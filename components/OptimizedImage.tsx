import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  priority?: boolean
  quality?: number
  sizes?: string
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  fallback?: string
  onLoad?: () => void
  onError?: () => void
}

/**
 * Componente de imagen optimizado con Next.js Image
 *
 * Características:
 * - Optimización automática con sharp
 * - Formatos modernos (AVIF, WebP)
 * - Lazy loading por defecto
 * - Responsive automático
 * - Fallback en caso de error
 * - Placeholder blur
 *
 * @example
 * // Imagen con tamaño fijo
 * <OptimizedImage
 *   src="/logo.png"
 *   alt="Logo"
 *   width={200}
 *   height={100}
 * />
 *
 * @example
 * // Imagen responsive con fill
 * <div className="relative w-full h-64">
 *   <OptimizedImage
 *     src={product.image_url}
 *     alt={product.name}
 *     fill
 *     objectFit="cover"
 *   />
 * </div>
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  priority = false,
  quality = 80,
  sizes,
  objectFit = 'cover',
  fallback = '/placeholder-image.png',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src || fallback)
  const [isLoading, setIsLoading] = useState(true)

  const handleError = () => {
    setImgSrc(fallback)
    if (onError) onError()
  }

  const handleLoad = () => {
    setIsLoading(false)
    if (onLoad) onLoad()
  }

  // Calcular sizes automáticamente si no se provee
  const imageSizes = sizes || (fill ? '100vw' : undefined)

  if (fill) {
    return (
      <Image
        src={imgSrc}
        alt={alt}
        fill
        quality={quality}
        sizes={imageSizes}
        priority={priority}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        style={{ objectFit }}
        onLoad={handleLoad}
        onError={handleError}
      />
    )
  }

  if (!width || !height) {
    console.warn(
      'OptimizedImage: width and height are required when fill is false'
    )
    return null
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      quality={quality}
      sizes={imageSizes}
      priority={priority}
      className={cn(
        'transition-opacity duration-300',
        isLoading ? 'opacity-0' : 'opacity-100',
        className
      )}
      style={{ objectFit }}
      onLoad={handleLoad}
      onError={handleError}
    />
  )
}

/**
 * Componente de imagen de producto optimizado
 *
 * Incluye:
 * - Aspect ratio 1:1 para productos
 * - Placeholder mientras carga
 * - Fallback de imagen por defecto
 */
export function ProductImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src?: string | null
  alt: string
  className?: string
  priority?: boolean
}) {
  return (
    <div className={cn('relative aspect-square overflow-hidden', className)}>
      <OptimizedImage
        src={src || '/placeholder-product.png'}
        alt={alt}
        fill
        objectFit="cover"
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  )
}

/**
 * Componente de avatar optimizado
 *
 * Incluye:
 * - Aspect ratio 1:1 circular
 * - Tamaños predefinidos
 */
export function AvatarImage({
  src,
  alt,
  size = 'md',
  className,
}: {
  src?: string | null
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  }

  const dimension = sizeMap[size]

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-full',
        className
      )}
      style={{ width: dimension, height: dimension }}
    >
      <OptimizedImage
        src={src || '/placeholder-avatar.png'}
        alt={alt}
        width={dimension}
        height={dimension}
        objectFit="cover"
      />
    </div>
  )
}

/**
 * Componente de logo optimizado
 */
export function LogoImage({
  src,
  alt,
  width = 200,
  height = 50,
  priority = true,
  className,
}: {
  src?: string | null
  alt: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
}) {
  return (
    <OptimizedImage
      src={src || '/logo.png'}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      objectFit="contain"
      className={className}
    />
  )
}
