# Rate Limiting - Documentación

## Descripción General

E-Vendify implementa un sistema robusto de rate limiting para proteger la aplicación contra:
- Abuso de API
- Ataques de fuerza bruta
- Scraping excesivo
- Sobrecarga del servidor
- Costos innecesarios en Supabase

## Arquitectura

### Estrategias Implementadas

#### 1. **Token Bucket**
- Permite ráfagas (bursts) de tráfico legítimo
- Se recarga a una tasa constante
- Ideal para uso interactivo normal

**Ejemplo**: Usuario navegando productos puede hacer múltiples requests rápidos inicialmente, pero se estabiliza en un rate promedio.

#### 2. **Sliding Window**
- Control más estricto del rate promedio
- Ventana de tiempo deslizante
- Previene bypass del rate limit al final de ventanas fijas

**Ejemplo**: Máximo 100 requests en cualquier ventana de 60 segundos.

#### 3. **Combinado (Recomendado)**
- Usa ambas estrategias en cascada
- Token Bucket filtra bursts excesivos
- Sliding Window mantiene rate promedio controlado
- Balance óptimo entre flexibilidad y protección

## Configuración por Endpoint

### Presets Disponibles

| Preset | Max Tokens | Refill Rate | Max Requests | Ventana | Uso |
|--------|-----------|-------------|--------------|---------|-----|
| `publicRead` | 20 | 2/seg | 100 | 1 min | Tiendas, productos |
| `auth` | 5 | 1/2seg | 10 | 5 min | Login, registro |
| `write` | 10 | 1/seg | 50 | 1 min | Crear/editar |
| `payment` | 3 | 1/5seg | 20 | 1 hora | Checkout, pagos |
| `search` | 15 | 2/seg | 60 | 1 min | Búsquedas |
| `apiKey` | 50 | 5/seg | 1000 | 1 min | Con API key |
| `admin` | 30 | 3/seg | 200 | 1 min | Panel admin |
| `webhook` | 10 | 2/seg | 100 | 1 min | MercadoPago, etc |

### Mapeo de Rutas

```typescript
// Ejemplos de rutas y sus límites aplicados
/login                    → auth (10 req/5min)
/register                 → auth (10 req/5min)
/store/mi-tienda         → publicRead (100 req/min)
/api/checkout            → payment (20 req/hora)
/dashboard/products/new  → write (50 req/min)
/admin/*                 → admin (200 req/min)
```

## Identificadores de Request

El sistema identifica requests usando (en orden de prioridad):

1. **API Key** (si existe): `x-api-key` header
2. **IP Address**: De headers `x-forwarded-for` o `x-real-ip`
3. **User Agent**: Hash del user agent para granularidad adicional

**Formato del identificador**: `{tipo}_{valor}_{hash}`
- Con API key: `api_abc123...`
- Por IP: `ip_192.168.1.1_9k2l1m`

## Headers de Respuesta

Todos los requests incluyen headers estándar (RFC 6585):

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 2025-12-03T10:30:00Z
```

En caso de límite excedido (HTTP 429):

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-12-03T10:30:00Z
Retry-After: 45
```

## Respuesta al Exceder Límite

### HTTP 429 - Too Many Requests

```json
{
  "error": "Too Many Requests",
  "message": "Has excedido el límite de solicitudes. Por favor, intenta más tarde.",
  "retryAfter": 45,
  "limit": 100,
  "reset": "2025-12-03T10:30:00Z"
}
```

## Rutas Exentas

Las siguientes rutas NO tienen rate limiting:

- `/_next/*` - Next.js internals
- `/favicon.ico`
- Imágenes estáticas (`.jpg`, `.png`, `.svg`, etc.)
- `/.well-known/*` - ACME challenges, webfinger
- `/health` - Health checks
- `/api/health` - API health checks

## Personalización

### Ajustar Límites por Endpoint

Editar `/lib/rate-limit-config.ts`:

```typescript
export const rateLimitPresets = {
  customEndpoint: {
    maxTokens: 25,        // Burst capacity
    refillRate: 3,        // Tokens por segundo
    refillInterval: 1000, // Ms entre refills
    maxRequests: 150,     // Max en ventana
    windowMs: 60000,      // Tamaño ventana (1 min)
    description: 'Mi endpoint personalizado'
  }
}
```

### Agregar Nueva Ruta

```typescript
export const endpointRateLimits = [
  // ... rutas existentes
  {
    pattern: /^\/mi-nueva-ruta/,
    config: rateLimitPresets.customEndpoint,
    name: 'mi-ruta'
  }
]
```

### Eximir Ruta de Rate Limiting

```typescript
export const rateLimitExemptions: RegExp[] = [
  // ... exenciones existentes
  /^\/ruta-sin-limite$/
]
```

## Implementación en Cliente

### Manejo de Respuestas 429

```typescript
async function fetchWithRetry(url: string, options = {}) {
  const response = await fetch(url, options)

  if (response.status === 429) {
    const data = await response.json()
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60')

    console.warn(`Rate limit excedido. Reintentando en ${retryAfter}s`)

    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
    return fetchWithRetry(url, options)
  }

  return response
}
```

### Monitorear Headers

```typescript
function logRateLimitStatus(response: Response) {
  const limit = response.headers.get('X-RateLimit-Limit')
  const remaining = response.headers.get('X-RateLimit-Remaining')
  const reset = response.headers.get('X-RateLimit-Reset')

  console.log(`Rate Limit: ${remaining}/${limit} (reset: ${reset})`)

  // Alertar si queda poco margen
  if (remaining && parseInt(remaining) < 10) {
    console.warn('Acercándose al límite de rate limit')
  }
}
```

## Monitoreo y Debugging

### Logs en Desarrollo

En modo desarrollo, el middleware incluye el header:
```http
X-RateLimit-Endpoint: auth
```

Esto indica qué preset se aplicó.

### Logs del Servidor

Violaciones de rate limit se loguean:
```
[RATE_LIMIT] Límite excedido - Endpoint: auth, Path: /login, Identifier: ip_192.168.1.1_9k2l1m
```

### Cleanup Automático

El sistema limpia automáticamente buckets inactivos cada hora para prevenir memory leaks.

## Escalado a Producción

### Redis (Recomendado para Multi-Instancia)

Actualmente usa memoria local (Map). Para múltiples servidores, usar Redis:

```typescript
// lib/rate-limit-redis.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export async function rateLimitRedis(identifier: string, config: any) {
  const key = `rl:${identifier}`
  const current = await redis.incr(key)

  if (current === 1) {
    await redis.expire(key, config.windowMs / 1000)
  }

  return {
    success: current <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - current)
  }
}
```

### Variables de Entorno

```env
# .env.local
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REDIS_URL=redis://localhost:6379
RATE_LIMIT_LOG_VIOLATIONS=true
```

## Testing

### Prueba Manual

```bash
# Probar límite de autenticación (10 req/5min)
for i in {1..15}; do
  curl -i http://localhost:3000/login
  echo "Request $i"
done

# El request #11 debe retornar 429
```

### Prueba con curl

```bash
curl -i http://localhost:3000/api/productos \
  -H "x-forwarded-for: 192.168.1.100"

# Observar headers:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
```

## Seguridad Adicional

### Prevención de Bypass

- ✅ Múltiples estrategias (token bucket + sliding window)
- ✅ Identificación por IP + User Agent
- ✅ Headers proxies respetados (`x-forwarded-for`)
- ✅ Cleanup automático de memoria
- ✅ Graceful degradation en caso de error

### Consideraciones

- ⚠️ VPNs/proxies comparten IPs (posibles falsos positivos)
- ⚠️ CGNAT puede agrupar múltiples usuarios
- ✅ API keys permiten identificación precisa de clientes

## Mejoras Futuras

- [ ] Dashboard de monitoreo en tiempo real
- [ ] Whitelist de IPs
- [ ] Rate limiting adaptativo (ML-based)
- [ ] Integración con WAF
- [ ] Alertas automáticas por Slack/email
- [ ] Métricas en Grafana

## Soporte

Para reportar problemas o solicitar ajustes en los límites:
- Abrir issue en GitHub
- Contactar al equipo de desarrollo

---

**Última actualización**: Diciembre 2025
