# Implementación de Rate Limiting - Guía Rápida

## ✅ ¿Qué se ha implementado?

Se ha agregado un sistema completo de rate limiting a E-Vendify con las siguientes características:

### Archivos Creados

1. **`lib/rate-limit.ts`** - Funciones core de rate limiting
   - `rateLimitTokenBucket()` - Estrategia de bucket de tokens
   - `rateLimitSlidingWindow()` - Estrategia de ventana deslizante
   - `rateLimitCombined()` - Estrategia combinada (recomendada)
   - `getRequestIdentifier()` - Identificación de clientes
   - `cleanupOldBuckets()` - Limpieza automática de memoria

2. **`lib/rate-limit-config.ts`** - Configuración por endpoint
   - 8 presets predefinidos (auth, payment, publicRead, etc.)
   - Mapeo de rutas a configuraciones
   - Lista de exenciones
   - Headers estándar RFC 6585

3. **`middleware.ts`** (actualizado) - Implementación en Next.js
   - Intercepta todas las requests
   - Aplica rate limiting según endpoint
   - Maneja ACME challenges
   - Logging de violaciones

4. **`components/RateLimitError.tsx`** - Componente React
   - Muestra error de rate limit al usuario
   - Countdown automático
   - Hook `useRateLimitHandler()`

5. **`scripts/test-rate-limit.ts`** - Suite de tests
   - 6 tests automatizados
   - Verifica todas las estrategias
   - Ejecutable con `pnpm test:rate-limit`

6. **`examples/rate-limit-usage.tsx`** - 7 ejemplos de uso
   - Fetch wrapper
   - Hook de React
   - Interceptor global
   - Queue de requests
   - Monitoring

7. **`RATE_LIMITING.md`** - Documentación completa

## 🚀 Inicio Rápido

### El rate limiting ya está activo

No necesitas hacer nada adicional. El middleware de Next.js ya está aplicando rate limiting a todas las rutas según la configuración.

### Verificar que funciona

```bash
# 1. Iniciar el servidor de desarrollo
pnpm dev

# 2. En otra terminal, hacer requests repetidos
for i in {1..15}; do
  curl -i http://localhost:3000/login
  echo "Request $i"
  sleep 0.2
done

# Verás headers como:
# X-RateLimit-Limit: 10
# X-RateLimit-Remaining: 7
# X-RateLimit-Reset: 2025-12-03T...

# El request #11 retornará HTTP 429
```

### Ejecutar tests automatizados

```bash
# Instalar tsx si no está disponible
pnpm add -D tsx

# Ejecutar suite de tests
pnpm test:rate-limit
```

## 📊 Límites por Endpoint (Estado Actual)

| Endpoint | Límite | Descripción |
|----------|--------|-------------|
| `/login`, `/register` | 10 req / 5 min | Autenticación |
| `/api/checkout` | 20 req / hora | Pagos y checkout |
| `/admin/*` | 200 req / min | Panel de admin |
| `/dashboard/products/*` | 50 req / min | Operaciones CRUD |
| `/store/*` | 100 req / min | Tiendas públicas |
| Otros | 100 req / min | Por defecto |

## 🔧 Personalizar Límites

### Cambiar límite de un endpoint existente

Edita `lib/rate-limit-config.ts`:

```typescript
export const rateLimitPresets = {
  auth: {
    maxTokens: 5,           // Cambiar a 10 para permitir más bursts
    refillRate: 1,
    refillInterval: 2000,
    maxRequests: 10,        // Cambiar a 20 para más requests
    windowMs: 300000,
    description: 'Endpoints de autenticación'
  }
}
```

### Agregar nuevo endpoint con límite específico

En `lib/rate-limit-config.ts`, agregar a `endpointRateLimits`:

```typescript
{
  pattern: /^\/api\/mi-endpoint/,
  config: {
    maxTokens: 15,
    refillRate: 2,
    refillInterval: 1000,
    maxRequests: 100,
    windowMs: 60000,
    description: 'Mi endpoint personalizado'
  },
  name: 'mi-endpoint'
}
```

### Eximir una ruta del rate limiting

En `lib/rate-limit-config.ts`, agregar a `rateLimitExemptions`:

```typescript
export const rateLimitExemptions: RegExp[] = [
  // ... existentes
  /^\/mi-ruta-sin-limite$/,
  /^\/public\/assets\//
]
```

## 💻 Uso en el Frontend

### Opción 1: Manejo manual

```typescript
async function login(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })

  if (response.status === 429) {
    const data = await response.json()
    toast.error(`Límite excedido. Espera ${data.retryAfter}s`)
    return
  }

  // Continuar normalmente...
}
```

### Opción 2: Usar el componente (recomendado)

```tsx
import { RateLimitError, useRateLimitHandler } from '@/components/RateLimitError'

export function MyForm() {
  const { rateLimitError, handleResponse } = useRateLimitHandler()

  const handleSubmit = async () => {
    const response = await fetch('/api/endpoint')
    const processedResponse = await handleResponse(response)

    if (!processedResponse) return // Rate limit activo

    // Procesar respuesta...
  }

  return (
    <form onSubmit={handleSubmit}>
      {rateLimitError && (
        <RateLimitError {...rateLimitError} />
      )}
      {/* Resto del form */}
    </form>
  )
}
```

### Opción 3: Interceptor global

Ver `examples/rate-limit-usage.tsx` para implementación completa.

## 📈 Monitoreo

### Headers en cada respuesta

Todas las respuestas incluyen headers de rate limit:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 2025-12-03T10:30:00.000Z
```

En desarrollo, también:
```
X-RateLimit-Endpoint: auth
```

### Logs del servidor

```bash
# Violaciones se loguean automáticamente:
[RATE_LIMIT] Límite excedido - Endpoint: auth, Path: /login, Identifier: ip_192.168.1.1_abc123
```

### Dashboard (futuro)

Considera agregar un dashboard en `/admin/rate-limits` para visualizar:
- Requests por endpoint
- Top usuarios por consumo
- Gráficos de tendencias
- Alertas configurables

## 🔒 Seguridad

### Protecciones implementadas

- ✅ Doble estrategia (Token Bucket + Sliding Window)
- ✅ Identificación por IP + User Agent
- ✅ Headers de proxy respetados
- ✅ Cleanup automático de memoria
- ✅ Graceful degradation en errores
- ✅ Logging de violaciones

### Limitaciones conocidas

- ⚠️ Storage en memoria (no persistente entre reinicios)
- ⚠️ No funciona en múltiples instancias sin Redis
- ⚠️ VPNs/CGNAT pueden causar falsos positivos

## 🚀 Producción

### Para un servidor único

La implementación actual funciona perfectamente. No se requieren cambios.

### Para múltiples servidores (load balancer)

Necesitas Redis para compartir estado:

```bash
pnpm add ioredis
```

Luego adapta `lib/rate-limit.ts` para usar Redis (ver comentarios en el código).

### Variables de entorno opcionales

Agregar a `.env.local`:

```env
# Habilitar/deshabilitar rate limiting
RATE_LIMIT_ENABLED=true

# Redis para producción (opcional)
REDIS_URL=redis://localhost:6379

# Logging detallado
RATE_LIMIT_DEBUG=false
```

## 🧪 Testing

### Tests automatizados

```bash
pnpm test:rate-limit
```

Corre 6 tests que verifican:
1. Token Bucket básico
2. Sliding Window
3. Refill de tokens
4. Estrategia combinada
5. Múltiples identificadores
6. Comportamiento de ventana deslizante

### Tests manuales

```bash
# Test endpoint de auth (10 req/5min)
for i in {1..12}; do
  curl -w "\nStatus: %{http_code}\n" http://localhost:3000/login
done

# Test endpoint público (100 req/min)
ab -n 150 -c 10 http://localhost:3000/

# Test con diferentes IPs
curl -H "x-forwarded-for: 1.1.1.1" http://localhost:3000/
curl -H "x-forwarded-for: 2.2.2.2" http://localhost:3000/
```

## 📝 Próximos Pasos

### Mejoras recomendadas

1. **Redis para producción**
   - Permite múltiples instancias
   - Persistencia entre reinicios

2. **Dashboard de monitoreo**
   - Visualizar rate limits en tiempo real
   - Alertas configurables

3. **Whitelist de IPs**
   - Eximir IPs de confianza
   - Límites más altos para partners

4. **Rate limiting adaptativo**
   - Ajustar límites según carga del servidor
   - Machine learning para detectar patrones

5. **Métricas y analytics**
   - Grafana/Prometheus integration
   - Histórico de violaciones

## ❓ Troubleshooting

### "Estoy siendo bloqueado injustamente"

1. Verifica tu IP: `curl ifconfig.me`
2. Revisa los límites en `lib/rate-limit-config.ts`
3. Agrega tu IP a whitelist si es necesario
4. Considera aumentar límites para tu caso de uso

### "Rate limiting no funciona"

1. Verifica que el servidor esté corriendo
2. Revisa los logs: `pnpm dev | grep RATE_LIMIT`
3. Comprueba que la ruta no esté exenta
4. Ejecuta tests: `pnpm test:rate-limit`

### "Performance degradado"

1. El rate limiting agrega ~1-5ms por request
2. Si es crítico, considera eximir rutas estáticas
3. Para APIs de alto tráfico, usa Redis

## 📚 Referencias

- [RFC 6585 - Additional HTTP Status Codes](https://tools.ietf.org/html/rfc6585)
- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
- [Sliding Window Counter](https://blog.cloudflare.com/counting-things-a-lot-of-different-things/)
- Documentación completa: `RATE_LIMITING.md`
- Ejemplos de código: `examples/rate-limit-usage.tsx`

---

**Implementado**: Diciembre 2025
**Versión**: 1.0.0
