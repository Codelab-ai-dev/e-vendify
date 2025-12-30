# Script de Migración a Imágenes Optimizadas

## Archivos que Necesitan Migración

Basado en el audit, estos archivos contienen imágenes que deberían usar los componentes optimizados:

### Alta Prioridad (Imágenes Públicas)

1. **app/page.tsx** (Página de inicio)
   - Hero images
   - Feature images
   - Testimonial avatars
   - Screenshots

2. **app/store/[storeId]/page.tsx** (Páginas de tienda)
   - Logo de tienda
   - Imágenes de productos
   - Banner de tienda

3. **app/store/[storeId]/p/[productId]/page.tsx** (Detalle de producto)
   - Imagen principal del producto
   - Galería de imágenes

### Media Prioridad

4. **app/dashboard/page.tsx**
   - Gráficos/ilustraciones
   - Iconos de estado

5. **components/store/CartDrawer.tsx**
   - Thumbnails de productos en carrito

6. **components/StoreSettingsForm.tsx**
   - Vista previa de logo
   - Upload de imágenes

### Baja Prioridad

7. **app/demo/page.tsx**
   - Imágenes de demostración

## Patrón de Migración

### Antes (HTML estándar)

```tsx
<img
  src={product.image_url}
  alt={product.name}
  className="w-full h-64 object-cover"
/>
```

### Después (Optimizado)

```tsx
import { ProductImage } from '@/components/OptimizedImage'

<ProductImage
  src={product.image_url}
  alt={product.name}
  className="rounded-lg"
/>
```

## Ejemplos Específicos

### 1. Producto en Grid

```tsx
// ANTES
{products.map(product => (
  <div key={product.id}>
    <img
      src={product.image_url}
      alt={product.name}
      className="w-full aspect-square object-cover"
    />
  </div>
))}

// DESPUÉS
import { ProductImage } from '@/components/OptimizedImage'

{products.map(product => (
  <div key={product.id}>
    <ProductImage
      src={product.image_url}
      alt={product.name}
      className="rounded-lg shadow"
    />
  </div>
))}
```

### 2. Logo de Tienda

```tsx
// ANTES
{store.logo_url && (
  <img
    src={store.logo_url}
    alt={store.name}
    className="h-12 w-auto"
  />
)}

// DESPUÉS
import { LogoImage } from '@/components/OptimizedImage'

<LogoImage
  src={store.logo_url}
  alt={store.name}
  width={200}
  height={48}
  className="h-12 w-auto"
/>
```

### 3. Avatar de Usuario

```tsx
// ANTES
<img
  src={user.avatar_url || '/default-avatar.png'}
  alt={user.name}
  className="w-10 h-10 rounded-full"
/>

// DESPUÉS
import { AvatarImage } from '@/components/OptimizedImage'

<AvatarImage
  src={user.avatar_url}
  alt={user.name}
  size="md"
/>
```

### 4. Hero/Banner

```tsx
// ANTES
<div className="relative h-96">
  <img
    src="/hero.jpg"
    alt="Hero"
    className="w-full h-full object-cover"
  />
</div>

// DESPUÉS
import { OptimizedImage } from '@/components/OptimizedImage'

<div className="relative h-96">
  <OptimizedImage
    src="/hero.jpg"
    alt="Hero"
    fill
    priority
    sizes="100vw"
  />
</div>
```

### 5. Galería de Producto

```tsx
// ANTES
<div className="grid grid-cols-4 gap-2">
  {images.map(img => (
    <img
      key={img.id}
      src={img.url}
      alt="Product view"
      className="w-full aspect-square"
    />
  ))}
</div>

// DESPUÉS
import { OptimizedImage } from '@/components/OptimizedImage'

<div className="grid grid-cols-4 gap-2">
  {images.map(img => (
    <div key={img.id} className="relative aspect-square">
      <OptimizedImage
        src={img.url}
        alt="Product view"
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
      />
    </div>
  ))}
</div>
```

## Comandos de Búsqueda

### Encontrar todas las imágenes HTML

```bash
# Buscar <img tags
grep -r "<img" --include="*.tsx" --include="*.jsx" app/ components/

# Buscar uso de image_url
grep -r "image_url" --include="*.tsx" --include="*.ts" app/ components/ | grep -v "test"

# Buscar uso de logo_url
grep -r "logo_url" --include="*.tsx" app/ components/
```

## Testing Post-Migración

### 1. Verificar en Desarrollo

```bash
pnpm dev
```

Verificar:
- ✅ Imágenes cargan correctamente
- ✅ No hay errores en consola
- ✅ Lazy loading funciona (scroll y observar Network)
- ✅ Placeholders aparecen mientras carga

### 2. Verificar Formatos

Abrir DevTools → Network → filtrar por "img":
- Buscar header `Content-Type`
- Debe ser `image/avif` o `image/webp` en navegadores modernos

### 3. Build de Producción

```bash
pnpm build
pnpm start
```

Verificar:
- ✅ Build exitoso sin warnings
- ✅ Imágenes optimizan correctamente
- ✅ Performance mejorado

### 4. Lighthouse Audit

```bash
# Chrome DevTools → Lighthouse
# Verificar mejoras en:
# - Performance score
# - Properly sized images
# - Efficient cache policy
# - Next-gen formats
```

## Checklist por Archivo

### app/page.tsx
- [ ] Hero image → OptimizedImage with priority
- [ ] Feature images → OptimizedImage
- [ ] Testimonial avatars → AvatarImage
- [ ] Screenshots → OptimizedImage

### app/store/[storeId]/page.tsx
- [ ] Store logo → LogoImage
- [ ] Store banner → OptimizedImage with fill
- [ ] Product grid → ProductImage

### app/store/[storeId]/p/[productId]/page.tsx
- [ ] Main product image → ProductImage with priority
- [ ] Image gallery → OptimizedImage with fill

### components/store/CartDrawer.tsx
- [ ] Cart item thumbnails → ProductImage

### components/StoreSettingsForm.tsx
- [ ] Logo preview → LogoImage
- [ ] Banner preview → OptimizedImage

## Errores Comunes y Soluciones

### Error: "Invalid src prop"

```tsx
// ❌ PROBLEMA: src puede ser null
<OptimizedImage src={product.image_url} />

// ✅ SOLUCIÓN: Fallback
<OptimizedImage src={product.image_url || '/placeholder.svg'} />
// O mejor aún, usar componente helper
<ProductImage src={product.image_url} />
```

### Error: "width and height required"

```tsx
// ❌ PROBLEMA: Falta dimensiones
<OptimizedImage src="/logo.png" />

// ✅ SOLUCIÓN 1: Especificar dimensiones
<OptimizedImage src="/logo.png" width={200} height={50} />

// ✅ SOLUCIÓN 2: Usar fill
<div className="relative w-full h-64">
  <OptimizedImage src="/banner.jpg" fill />
</div>
```

### Warning: "Image with src is missing sizes"

```tsx
// ⚠️ WARNING: fill sin sizes
<OptimizedImage src="/image.jpg" fill />

// ✅ SOLUCIÓN: Agregar sizes
<OptimizedImage
  src="/image.jpg"
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

## Performance Testing

### Antes de Migración

```bash
# Tomar baseline
lighthouse http://localhost:3000 --only-categories=performance --output=json --output-path=./before.json
```

### Después de Migración

```bash
# Comparar
lighthouse http://localhost:3000 --only-categories=performance --output=json --output-path=./after.json
```

### Métricas Esperadas

| Métrica | Antes | Después | Objetivo |
|---------|-------|---------|----------|
| Performance Score | ~65 | ~90+ | +25 puntos |
| LCP | ~4s | ~1.8s | < 2.5s |
| Total Image Size | ~2MB | ~600KB | -70% |
| Image Requests | 20 | 20 | = |
| Next-gen formats | 0% | 100% | 100% |

---

**Tiempo estimado de migración**: 2-4 horas
**Impacto en performance**: +25-30 puntos Lighthouse
**Reducción de peso**: ~70% en imágenes
