import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import { FormSkeleton, CompactFormSkeleton, SettingsCardSkeleton } from '@/components/skeletons/FormSkeleton'

/**
 * Opciones para lazy loading de componentes
 */
export interface LazyLoadOptions {
  /**
   * Componente de loading a mostrar mientras se carga
   * @default null
   */
  loading?: ComponentType<any>

  /**
   * Si debe renderizarse en el servidor
   * @default false para componentes interactivos
   */
  ssr?: boolean
}

/**
 * Lazy load un componente con opciones predeterminadas
 *
 * @example
 * const CartDrawer = lazyLoad(() => import('@/components/CartDrawer'))
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
) {
  return dynamic(importFn, {
    loading: options.loading || (() => null),
    ssr: options.ssr ?? false,
  })
}

/**
 * Lazy load un componente nombrado (no default export)
 *
 * @example
 * const CartDrawer = lazyLoadNamed(
 *   () => import('@/components/store/CartDrawer'),
 *   'CartDrawer'
 * )
 */
export function lazyLoadNamed<T extends ComponentType<any>>(
  importFn: () => Promise<any>,
  componentName: string,
  options: LazyLoadOptions = {}
) {
  return dynamic(
    () => importFn().then((mod) => ({ default: mod[componentName] })),
    {
      loading: options.loading || (() => null),
      ssr: options.ssr ?? false,
    }
  )
}

/**
 * Lazy load un componente de formulario con skeleton
 */
export function lazyLoadForm<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return dynamic(importFn, {
    loading: () => <FormSkeleton />,
    ssr: false,
  })
}

/**
 * Lazy load un componente de configuración con skeleton
 */
export function lazyLoadSettings<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return dynamic(importFn, {
    loading: () => <SettingsCardSkeleton />,
    ssr: false,
  })
}

/**
 * Lazy load un modal/drawer/dialog (sin skeleton)
 */
export function lazyLoadModal<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return dynamic(importFn, {
    loading: () => null, // Los modales aparecen instantáneamente
    ssr: false, // No renderizar modales en servidor
  })
}

/**
 * Presets de lazy loading para casos comunes
 */
export const LazyLoadPresets = {
  /**
   * Para componentes de formulario pesados
   */
  form: (importFn: () => Promise<{ default: ComponentType<any> }>) =>
    lazyLoadForm(importFn),

  /**
   * Para componentes de configuración
   */
  settings: (importFn: () => Promise<{ default: ComponentType<any> }>) =>
    lazyLoadSettings(importFn),

  /**
   * Para modales, drawers, dialogs
   */
  modal: (importFn: () => Promise<{ default: ComponentType<any> }>) =>
    lazyLoadModal(importFn),

  /**
   * Para componentes con named exports
   */
  named: (
    importFn: () => Promise<any>,
    componentName: string,
    options?: LazyLoadOptions
  ) => lazyLoadNamed(importFn, componentName, options),

  /**
   * Lazy load básico sin skeleton
   */
  basic: (importFn: () => Promise<{ default: ComponentType<any> }>) =>
    lazyLoad(importFn),
}

/**
 * Ejemplos de uso:
 *
 * @example
 * // Formulario con skeleton
 * const StoreSettingsForm = LazyLoadPresets.form(
 *   () => import('@/components/StoreSettingsForm')
 * )
 *
 * @example
 * // Modal sin skeleton
 * const CartDrawer = LazyLoadPresets.modal(
 *   () => import('@/components/CartDrawer')
 * )
 *
 * @example
 * // Componente nombrado
 * const CartDrawer = LazyLoadPresets.named(
 *   () => import('@/components/store/CartDrawer'),
 *   'CartDrawer'
 * )
 *
 * @example
 * // Con opciones personalizadas
 * const MyComponent = lazyLoad(
 *   () => import('@/components/MyComponent'),
 *   {
 *     loading: () => <MyCustomSkeleton />,
 *     ssr: true
 *   }
 * )
 */
