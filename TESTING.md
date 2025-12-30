# Testing Guide - E-Vendify

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Stack de Testing](#stack-de-testing)
3. [Configuración](#configuración)
4. [Ejecutar Tests](#ejecutar-tests)
5. [Estructura de Tests](#estructura-de-tests)
6. [Escribir Tests](#escribir-tests)
7. [Cobertura de Tests](#cobertura-de-tests)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Introducción

E-Vendify utiliza una suite de testing moderna y completa para garantizar la calidad del código. Todos los tests están escritos con **Vitest** y **Testing Library**.

### ¿Por qué Testing?

- ✅ **Confianza**: Desplegar con seguridad sabiendo que el código funciona
- ✅ **Documentación**: Los tests documentan cómo usar el código
- ✅ **Refactoring**: Cambiar código sin romper funcionalidad
- ✅ **Detección temprana**: Encontrar bugs antes de producción
- ✅ **Calidad**: Mantener estándares altos de código

---

## Stack de Testing

### Herramientas Principales

| Herramienta | Propósito | Versión |
|-------------|-----------|---------|
| **Vitest** | Test runner (como Jest pero más rápido) | 4.0.15 |
| **@testing-library/react** | Testing de componentes React | 16.3.0 |
| **@testing-library/user-event** | Simulación de interacciones | 14.6.1 |
| **@testing-library/jest-dom** | Matchers adicionales para DOM | 6.9.1 |
| **happy-dom** | Entorno DOM ligero | 20.0.11 |
| **@vitest/ui** | UI visual para tests | 4.0.15 |

### ¿Por qué Vitest?

- ⚡ **10x más rápido** que Jest
- 🔥 **Hot Module Reload** en tests
- 📦 **Compatible con Vite** (usado por Next.js internamente)
- 🎯 **API compatible con Jest** (migración fácil)
- 🎨 **UI integrada** para ver resultados

---

## Configuración

### Archivos de Configuración

#### `vitest.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,              // Usar expect, describe, it sin imports
    environment: 'happy-dom',   // DOM para tests
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 70,                // Meta: 70% cobertura
      functions: 70,
      branches: 70,
      statements: 70
    }
  }
})
```

#### `test/setup.ts`

Configuración global ejecutada antes de cada test:

- Mocks de Next.js (router, Image, navigation)
- Mock de Supabase client
- Matchers de jest-dom
- ResizeObserver mock
- window.matchMedia mock

---

## Ejecutar Tests

### Comandos Disponibles

```bash
# Ejecutar todos los tests (modo watch)
pnpm test

# Ejecutar tests una vez
pnpm test:run

# Ejecutar con UI visual
pnpm test:ui

# Ejecutar con cobertura
pnpm test:coverage

# Ejecutar en modo watch
pnpm test:watch

# Ejecutar tests específicos
pnpm test products

# Ejecutar con patrón
pnpm test useCart
```

### Ejemplos de Uso

```bash
# Desarrollo: modo watch con UI
pnpm test:ui

# CI/CD: ejecutar una vez con cobertura
pnpm test:coverage

# Debuggear test específico
pnpm test -- lib/__tests__/products.test.ts
```

---

## Estructura de Tests

### Organización de Archivos

```
e-vendify/
├── lib/
│   ├── __tests__/
│   │   ├── products.test.ts       # Tests para lib/products.ts
│   │   ├── supabase.test.ts       # Tests para lib/supabase.ts
│   │   └── rate-limit.test.ts     # Tests para lib/rate-limit.ts
│   └── store/
│       └── __tests__/
│           └── useCart.test.ts    # Tests para useCart hook
│
├── components/
│   └── __tests__/
│       └── RateLimitError.test.tsx # Tests para componente
│
├── test/
│   └── setup.ts                   # Configuración global
│
└── vitest.config.ts               # Config de Vitest
```

### Convenciones de Nombres

- Archivos de test: `*.test.ts` o `*.spec.ts`
- Colocar tests en carpeta `__tests__` junto al código
- Nombre del archivo = nombre del módulo + `.test`

---

## Escribir Tests

### Anatomía de un Test

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Nombre del Módulo', () => {
  beforeEach(() => {
    // Setup antes de cada test
    vi.clearAllMocks()
  })

  describe('Función específica', () => {
    it('should do something specific', () => {
      // Arrange: preparar datos
      const input = 'test'

      // Act: ejecutar función
      const result = myFunction(input)

      // Assert: verificar resultado
      expect(result).toBe('expected')
    })

    it('should handle edge case', () => {
      // ...
    })
  })
})
```

### Ejemplos por Tipo

#### 1. Testing de Funciones (lib/products.ts)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProductsByStore } from '../products'
import { supabase } from '../supabase'

describe('getProductsByStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch products for a store', async () => {
    // Mock de Supabase
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [{ id: '1', name: 'Product' }],
            error: null
          })
        })
      })
    } as any)

    const { data, error } = await getProductsByStore('store-1')

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })
})
```

#### 2. Testing de Hooks (useCart)

```typescript
import { renderHook, act } from '@testing-library/react'
import { useCart } from '../useCart'

describe('useCart', () => {
  it('should add item to cart', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.addItem({
        id: '1',
        name: 'Product',
        price: 99.99,
        quantity: 1
      })
    })

    expect(result.current.items).toHaveLength(1)
  })
})
```

#### 3. Testing de Componentes

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RateLimitError } from '../RateLimitError'

describe('RateLimitError', () => {
  it('should render error message', () => {
    render(<RateLimitError retryAfter={60} limit={100} />)

    expect(screen.getByText(/límite excedido/i)).toBeInTheDocument()
  })

  it('should call onRetry when clicked', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()

    render(<RateLimitError retryAfter={0} onRetry={onRetry} />)

    await user.click(screen.getByRole('button'))

    expect(onRetry).toHaveBeenCalled()
  })
})
```

#### 4. Testing de Autenticación

```typescript
import { signInWithEmail } from '../supabase'

describe('signInWithEmail', () => {
  it('should sign in user successfully', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: { id: '123', email: 'test@test.com' } },
      error: null
    })

    const result = await signInWithEmail('test@test.com', 'pass')

    expect(result.error).toBeNull()
    expect(result.data.user).toBeDefined()
  })

  it('should handle invalid credentials', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials' }
    })

    const result = await signInWithEmail('test@test.com', 'wrong')

    expect(result.error).toBeDefined()
  })
})
```

---

## Cobertura de Tests

### Ver Reporte de Cobertura

```bash
# Generar reporte
pnpm test:coverage

# Abrir reporte HTML
open coverage/index.html
```

### Interpretar Cobertura

```
--------------------------------|---------|----------|---------|---------|
File                            | % Stmts | % Branch | % Funcs | % Lines |
--------------------------------|---------|----------|---------|---------|
All files                       |   85.23 |    78.45 |   82.11 |   85.67 |
 lib                            |   92.15 |    85.33 |   89.12 |   92.45 |
  products.ts                   |   95.12 |    88.23 |   93.45 |   95.67 |
  supabase.ts                   |   89.45 |    82.11 |   85.34 |   89.78 |
 components                     |   78.34 |    71.23 |   75.12 |   78.90 |
--------------------------------|---------|----------|---------|---------|
```

**Metas de Cobertura:**
- ✅ **≥ 70%**: Aceptable
- ✅ **≥ 80%**: Bueno
- 🎯 **≥ 90%**: Excelente

### Priorizar Cobertura

1. **Crítico (100%)**: Autenticación, pagos, carrito
2. **Alto (90%)**: Lógica de negocio, queries
3. **Medio (80%)**: Componentes UI
4. **Bajo (70%)**: Utilidades, helpers

---

## Best Practices

### ✅ DO

#### 1. Tests Descriptivos

```typescript
// ✅ GOOD: Descriptivo y específico
it('should display error when email is invalid', () => {})

// ❌ BAD: Vago
it('should work', () => {})
```

#### 2. Arrange-Act-Assert

```typescript
it('should calculate total correctly', () => {
  // Arrange: preparar
  const cart = { items: [{ price: 10, qty: 2 }] }

  // Act: ejecutar
  const total = calculateTotal(cart)

  // Assert: verificar
  expect(total).toBe(20)
})
```

#### 3. Un Concepto por Test

```typescript
// ✅ GOOD: Un test, un concepto
it('should add item to cart', () => {
  // Solo testea agregar item
})

it('should update quantity when item exists', () => {
  // Solo testea actualizar cantidad
})

// ❌ BAD: Múltiples conceptos
it('should add and update and remove items', () => {
  // Hace demasiado
})
```

#### 4. Tests Independientes

```typescript
// ✅ GOOD: Cada test es independiente
beforeEach(() => {
  // Reset state antes de cada test
  cart.clear()
})

// ❌ BAD: Tests dependen del orden
it('first test', () => { cart.add(item) })
it('second test', () => {
  // Asume que first test corrió primero
  expect(cart.items).toHaveLength(1)
})
```

#### 5. Mock Apropiado

```typescript
// ✅ GOOD: Mock de dependencias externas
vi.mocked(supabase.from).mockReturnValue({...})

// ❌ BAD: No mockear, hacer requests reales
const { data } = await supabase.from('products').select()
```

### ❌ DON'T

1. **No testear implementación**: Testear comportamiento, no detalles internos
2. **No hacer tests frágiles**: Evitar depender de HTML específico
3. **No ignorar errores**: Si un test falla, arreglarlo, no comentarlo
4. **No sobre-mockear**: Solo mockear lo necesario
5. **No duplicar lógica**: Usar helpers para setup repetitivo

---

## Troubleshooting

### Problemas Comunes

#### 1. "Cannot find module '@/...'"

**Causa**: Alias de path no configurado

**Solución**: Verificar `vitest.config.ts`:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './')
  }
}
```

#### 2. "ReferenceError: window is not defined"

**Causa**: Código del navegador en entorno de Node

**Solución**: Mockear o usar happy-dom:

```typescript
// test/setup.ts
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation(...)
})
```

#### 3. "Test timeout of 5000ms exceeded"

**Causa**: Operación asíncrona tarda demasiado

**Solución**: Aumentar timeout o usar fake timers:

```typescript
it('should wait', async () => {
  vi.useFakeTimers()
  // ... test code
  vi.advanceTimersByTime(10000)
  vi.useRealTimers()
}, 10000) // timeout de 10s
```

#### 4. "Module is not mocked"

**Causa**: Mock no está configurado correctamente

**Solución**: Verificar orden de imports y mocks:

```typescript
// Mock ANTES de import
vi.mock('@/lib/supabase')

import { myFunction } from '@/lib/myModule'
```

#### 5. Tests pasan localmente pero fallan en CI

**Causas posibles**:
- Dependencia del timezone
- Dependencia de archivos locales
- Race conditions

**Solución**:
```typescript
// Fijar timezone
process.env.TZ = 'UTC'

// Esperar condiciones asíncronas
await waitFor(() => {
  expect(element).toBeInTheDocument()
})
```

---

## Coverage Goals por Módulo

| Módulo | Coverage Actual | Meta | Prioridad |
|--------|----------------|------|-----------|
| `lib/products.ts` | - | 90% | Alta |
| `lib/supabase.ts` | - | 95% | Crítica |
| `lib/store/useCart.ts` | - | 95% | Crítica |
| `lib/rate-limit.ts` | - | 85% | Alta |
| `components/RateLimitError.tsx` | - | 80% | Media |
| `components/ui/*` | - | 70% | Baja |

---

## CI/CD Integration

### GitHub Actions (Ejemplo)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Recursos Adicionales

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Vitest UI](https://vitest.dev/guide/ui.html)

---

## Próximos Pasos

### Tests Pendientes

1. **Integration Tests**
   - Flow completo de checkout
   - Registro y login de usuario
   - Creación de tienda

2. **E2E Tests** (Playwright/Cypress)
   - User journeys críticos
   - Multi-browser testing

3. **Performance Tests**
   - Load testing con k6
   - Lighthouse CI

4. **Visual Regression**
   - Screenshot testing con Percy

---

**Última actualización**: Diciembre 2025
