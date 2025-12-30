#!/usr/bin/env ts-node
/**
 * Script de Testing para Rate Limiting
 *
 * Ejecutar: pnpm tsx scripts/test-rate-limit.ts
 */

import { rateLimitTokenBucket, rateLimitSlidingWindow, rateLimitCombined } from '../lib/rate-limit'

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Test 1: Token Bucket básico
async function testTokenBucket() {
  log('cyan', '\n=== TEST 1: Token Bucket ===')
  log('blue', 'Config: 5 tokens, refill 1 token/segundo')

  const identifier = 'test-user-1'
  const results: boolean[] = []

  // Hacer 10 requests rápidos
  for (let i = 1; i <= 10; i++) {
    const result = await rateLimitTokenBucket(identifier, 5, 1, 1000)
    results.push(result.success)

    if (result.success) {
      log('green', `✓ Request ${i}: Permitido (${result.remaining} tokens restantes)`)
    } else {
      log('red', `✗ Request ${i}: Bloqueado (retry en ${result.retryAfter}s)`)
    }
  }

  const allowed = results.filter(r => r).length
  const blocked = results.filter(r => !r).length

  log('yellow', `\nResultado: ${allowed} permitidos, ${blocked} bloqueados`)

  if (allowed === 5 && blocked === 5) {
    log('green', '✓ TEST PASADO: Token bucket funcionando correctamente')
  } else {
    log('red', `✗ TEST FALLADO: Esperado 5/5, obtenido ${allowed}/${blocked}`)
  }
}

// Test 2: Sliding Window
async function testSlidingWindow() {
  log('cyan', '\n=== TEST 2: Sliding Window ===')
  log('blue', 'Config: 10 requests por 5 segundos')

  const identifier = 'test-user-2'
  const results: boolean[] = []

  // Hacer 15 requests
  for (let i = 1; i <= 15; i++) {
    const result = await rateLimitSlidingWindow(identifier, 10, 5000)
    results.push(result.success)

    if (result.success) {
      log('green', `✓ Request ${i}: Permitido (${result.remaining} restantes)`)
    } else {
      log('red', `✗ Request ${i}: Bloqueado (reset en ${Math.round(result.reset / 1000)}s)`)
    }

    await sleep(100) // Pequeño delay entre requests
  }

  const allowed = results.filter(r => r).length
  const blocked = results.filter(r => !r).length

  log('yellow', `\nResultado: ${allowed} permitidos, ${blocked} bloqueados`)

  if (allowed === 10 && blocked === 5) {
    log('green', '✓ TEST PASADO: Sliding window funcionando correctamente')
  } else {
    log('red', `✗ TEST FALLADO: Esperado 10/5, obtenido ${allowed}/${blocked}`)
  }
}

// Test 3: Refill de tokens
async function testTokenRefill() {
  log('cyan', '\n=== TEST 3: Token Refill ===')
  log('blue', 'Config: 3 tokens, refill 1 token cada 2 segundos')

  const identifier = 'test-user-3'

  // Consumir todos los tokens
  log('yellow', 'Fase 1: Consumir todos los tokens...')
  for (let i = 1; i <= 3; i++) {
    const result = await rateLimitTokenBucket(identifier, 3, 1, 2000)
    log(result.success ? 'green' : 'red', `Request ${i}: ${result.success ? 'Permitido' : 'Bloqueado'}`)
  }

  // Intentar uno más (debe fallar)
  log('yellow', '\nFase 2: Intentar request sin tokens...')
  const failResult = await rateLimitTokenBucket(identifier, 3, 1, 2000)
  if (!failResult.success) {
    log('green', '✓ Request bloqueado correctamente')
  } else {
    log('red', '✗ Request debería haber sido bloqueado')
  }

  // Esperar refill
  log('yellow', '\nFase 3: Esperando 2.5s para refill...')
  await sleep(2500)

  // Intentar de nuevo (debe pasar)
  const passResult = await rateLimitTokenBucket(identifier, 3, 1, 2000)
  if (passResult.success) {
    log('green', '✓ Request permitido después de refill')
    log('green', '✓ TEST PASADO: Refill funcionando correctamente')
  } else {
    log('red', '✗ TEST FALLADO: Request debería haber sido permitido')
  }
}

// Test 4: Estrategia combinada
async function testCombinedStrategy() {
  log('cyan', '\n=== TEST 4: Estrategia Combinada ===')
  log('blue', 'Config: 5 tokens + 10 requests/10s')

  const identifier = 'test-user-4'
  const results: boolean[] = []

  for (let i = 1; i <= 12; i++) {
    const result = await rateLimitCombined(identifier, {
      maxTokens: 5,
      refillRate: 1,
      refillInterval: 1000,
      maxRequests: 10,
      windowMs: 10000
    })

    results.push(result.success)

    if (result.success) {
      log('green', `✓ Request ${i}: Permitido`)
    } else {
      log('red', `✗ Request ${i}: Bloqueado`)
    }

    await sleep(50)
  }

  const allowed = results.filter(r => r).length

  if (allowed <= 10) {
    log('green', `✓ TEST PASADO: Combinado permite máximo 10 (${allowed} permitidos)`)
  } else {
    log('red', `✗ TEST FALLADO: Combinado permitió más de 10 (${allowed} permitidos)`)
  }
}

// Test 5: Múltiples identificadores
async function testMultipleIdentifiers() {
  log('cyan', '\n=== TEST 5: Múltiples Identificadores ===')
  log('blue', 'Config: 3 usuarios diferentes, 5 requests cada uno')

  const users = ['user-A', 'user-B', 'user-C']
  let totalAllowed = 0

  for (const user of users) {
    log('yellow', `\nProbando ${user}...`)
    let allowed = 0

    for (let i = 1; i <= 5; i++) {
      const result = await rateLimitTokenBucket(user, 5, 1, 1000)
      if (result.success) {
        allowed++
      }
    }

    log(allowed === 5 ? 'green' : 'red', `${user}: ${allowed}/5 permitidos`)
    totalAllowed += allowed
  }

  if (totalAllowed === 15) {
    log('green', '✓ TEST PASADO: Cada usuario tiene su propio bucket')
  } else {
    log('red', `✗ TEST FALLADO: Esperado 15 total, obtenido ${totalAllowed}`)
  }
}

// Test 6: Sliding Window - Ventana deslizante
async function testSlidingWindowBehavior() {
  log('cyan', '\n=== TEST 6: Comportamiento de Ventana Deslizante ===')
  log('blue', 'Config: 5 requests por 3 segundos')

  const identifier = 'test-user-6'

  // Hacer 5 requests iniciales
  log('yellow', 'Fase 1: Hacer 5 requests (llenando el límite)...')
  for (let i = 1; i <= 5; i++) {
    await rateLimitSlidingWindow(identifier, 5, 3000)
    log('green', `✓ Request ${i}`)
  }

  // Intentar otro (debe fallar)
  log('yellow', '\nFase 2: Intentar request #6 (debe fallar)...')
  const blocked = await rateLimitSlidingWindow(identifier, 5, 3000)
  if (!blocked.success) {
    log('green', '✓ Request bloqueado correctamente')
  } else {
    log('red', '✗ Request debería haber sido bloqueado')
  }

  // Esperar que expire la ventana
  log('yellow', '\nFase 3: Esperando 3.5s para que expire la ventana...')
  await sleep(3500)

  // Intentar de nuevo (debe pasar)
  log('yellow', 'Fase 4: Intentar request después de expiración...')
  const allowed = await rateLimitSlidingWindow(identifier, 5, 3000)
  if (allowed.success) {
    log('green', '✓ Request permitido después de expiración')
    log('green', '✓ TEST PASADO: Ventana deslizante funcionando correctamente')
  } else {
    log('red', '✗ TEST FALLADO: Request debería haber sido permitido')
  }
}

// Ejecutar todos los tests
async function runAllTests() {
  log('cyan', '╔════════════════════════════════════════╗')
  log('cyan', '║   SUITE DE TESTS - RATE LIMITING      ║')
  log('cyan', '╚════════════════════════════════════════╝')

  try {
    await testTokenBucket()
    await testSlidingWindow()
    await testTokenRefill()
    await testCombinedStrategy()
    await testMultipleIdentifiers()
    await testSlidingWindowBehavior()

    log('cyan', '\n╔════════════════════════════════════════╗')
    log('green', '║   ✓ TODOS LOS TESTS COMPLETADOS       ║')
    log('cyan', '╚════════════════════════════════════════╝\n')
  } catch (error) {
    log('red', `\n✗ ERROR EN TESTS: ${error}`)
    process.exit(1)
  }
}

// Ejecutar si es el script principal
if (require.main === module) {
  runAllTests()
}

export { runAllTests }
