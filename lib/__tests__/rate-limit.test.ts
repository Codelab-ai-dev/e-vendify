import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  rateLimitTokenBucket,
  rateLimitSlidingWindow,
  rateLimitCombined,
  getRequestIdentifier,
  cleanupOldBuckets,
} from '../rate-limit'

describe('Rate Limit Module', () => {
  beforeEach(() => {
    // Clear any existing rate limit data
    vi.clearAllMocks()
  })

  describe('rateLimitTokenBucket', () => {
    it('should allow requests within token limit', async () => {
      const identifier = 'user-1'
      const results = []

      for (let i = 0; i < 5; i++) {
        const result = await rateLimitTokenBucket(identifier, 5, 1, 1000)
        results.push(result.success)
      }

      expect(results.filter(s => s).length).toBe(5)
    })

    it('should block requests when tokens are exhausted', async () => {
      const identifier = 'user-2'
      const results = []

      for (let i = 0; i < 7; i++) {
        const result = await rateLimitTokenBucket(identifier, 5, 1, 1000)
        results.push(result.success)
      }

      const allowed = results.filter(s => s).length
      const blocked = results.filter(s => !s).length

      expect(allowed).toBe(5)
      expect(blocked).toBe(2)
    })

    it('should return correct remaining count', async () => {
      const identifier = 'user-3'

      const result1 = await rateLimitTokenBucket(identifier, 10, 1, 1000)
      expect(result1.remaining).toBe(9)

      const result2 = await rateLimitTokenBucket(identifier, 10, 1, 1000)
      expect(result2.remaining).toBe(8)
    })

    it('should refill tokens over time', async () => {
      vi.useFakeTimers()
      const identifier = 'user-4'

      // Consume all tokens
      for (let i = 0; i < 5; i++) {
        await rateLimitTokenBucket(identifier, 5, 1, 1000)
      }

      // Should be blocked
      const blocked = await rateLimitTokenBucket(identifier, 5, 1, 1000)
      expect(blocked.success).toBe(false)

      // Wait for refill
      vi.advanceTimersByTime(2000)

      // Should have refilled 2 tokens
      const allowed = await rateLimitTokenBucket(identifier, 5, 1, 1000)
      expect(allowed.success).toBe(true)

      vi.useRealTimers()
    })

    it('should provide retry time when blocked', async () => {
      const identifier = 'user-5'

      // Exhaust tokens
      for (let i = 0; i < 5; i++) {
        await rateLimitTokenBucket(identifier, 5, 1, 1000)
      }

      const result = await rateLimitTokenBucket(identifier, 5, 1, 1000)

      expect(result.success).toBe(false)
      expect(result.retryAfter).toBeDefined()
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    it('should handle different identifiers independently', async () => {
      const user1 = 'user-6'
      const user2 = 'user-7'

      // Exhaust user1's tokens
      for (let i = 0; i < 5; i++) {
        await rateLimitTokenBucket(user1, 5, 1, 1000)
      }

      // user1 should be blocked
      const result1 = await rateLimitTokenBucket(user1, 5, 1, 1000)
      expect(result1.success).toBe(false)

      // user2 should still work
      const result2 = await rateLimitTokenBucket(user2, 5, 1, 1000)
      expect(result2.success).toBe(true)
    })
  })

  describe('rateLimitSlidingWindow', () => {
    it('should allow requests within window limit', async () => {
      const identifier = 'window-user-1'
      const results = []

      for (let i = 0; i < 10; i++) {
        const result = await rateLimitSlidingWindow(identifier, 10, 5000)
        results.push(result.success)
      }

      expect(results.filter(s => s).length).toBe(10)
    })

    it('should block requests exceeding window limit', async () => {
      const identifier = 'window-user-2'
      const results = []

      for (let i = 0; i < 15; i++) {
        const result = await rateLimitSlidingWindow(identifier, 10, 5000)
        results.push(result.success)
      }

      const allowed = results.filter(s => s).length
      const blocked = results.filter(s => !s).length

      expect(allowed).toBe(10)
      expect(blocked).toBe(5)
    })

    it('should return correct remaining count', async () => {
      const identifier = 'window-user-3'

      const result1 = await rateLimitSlidingWindow(identifier, 20, 10000)
      expect(result1.remaining).toBe(19)

      const result2 = await rateLimitSlidingWindow(identifier, 20, 10000)
      expect(result2.remaining).toBe(18)
    })

    it('should reset after window expires', async () => {
      vi.useFakeTimers()
      const identifier = 'window-user-4'

      // Fill window
      for (let i = 0; i < 5; i++) {
        await rateLimitSlidingWindow(identifier, 5, 3000)
      }

      // Should be blocked
      const blocked = await rateLimitSlidingWindow(identifier, 5, 3000)
      expect(blocked.success).toBe(false)

      // Wait for window to expire
      vi.advanceTimersByTime(3500)

      // Should work again
      const allowed = await rateLimitSlidingWindow(identifier, 5, 3000)
      expect(allowed.success).toBe(true)

      vi.useRealTimers()
    })

    it('should provide reset time', async () => {
      const identifier = 'window-user-5'

      const result = await rateLimitSlidingWindow(identifier, 10, 5000)

      expect(result.reset).toBeDefined()
      expect(result.reset).toBeGreaterThan(0)
      expect(result.reset).toBeLessThanOrEqual(5000)
    })
  })

  describe('rateLimitCombined', () => {
    it('should apply both token bucket and sliding window', async () => {
      const identifier = 'combined-user-1'

      const result = await rateLimitCombined(identifier, {
        maxTokens: 10,
        refillRate: 1,
        refillInterval: 1000,
        maxRequests: 50,
        windowMs: 60000,
      })

      expect(result.success).toBe(true)
      expect(result.limit).toBe(50)
    })

    it('should block when token bucket is exhausted', async () => {
      const identifier = 'combined-user-2'
      const results = []

      for (let i = 0; i < 12; i++) {
        const result = await rateLimitCombined(identifier, {
          maxTokens: 10,
          refillRate: 1,
          refillInterval: 1000,
          maxRequests: 100,
          windowMs: 60000,
        })
        results.push(result.success)
      }

      const allowed = results.filter(s => s).length
      expect(allowed).toBeLessThanOrEqual(10)
    })

    it('should block when sliding window limit is exceeded', async () => {
      vi.useFakeTimers()
      const identifier = 'combined-user-3'
      const results = []

      for (let i = 0; i < 15; i++) {
        const result = await rateLimitCombined(identifier, {
          maxTokens: 20,
          refillRate: 2,
          refillInterval: 500,
          maxRequests: 10,
          windowMs: 5000,
        })
        results.push(result.success)

        // Small delay to allow token refill
        vi.advanceTimersByTime(100)
      }

      const allowed = results.filter(s => s).length
      expect(allowed).toBeLessThanOrEqual(10)

      vi.useRealTimers()
    })

    it('should return minimum remaining from both strategies', async () => {
      const identifier = 'combined-user-4'

      // First request
      const result = await rateLimitCombined(identifier, {
        maxTokens: 5,
        refillRate: 1,
        refillInterval: 1000,
        maxRequests: 100,
        windowMs: 60000,
      })

      // Remaining should be based on token bucket (lower)
      expect(result.remaining).toBeLessThanOrEqual(5)
    })
  })

  describe('getRequestIdentifier', () => {
    it('should use API key when available', () => {
      const request = new Request('http://localhost:3000', {
        headers: {
          'x-api-key': 'test-api-key-123',
        },
      })

      const identifier = getRequestIdentifier(request)

      expect(identifier).toContain('api_test-api-key-123')
    })

    it('should use x-forwarded-for when available', () => {
      const request = new Request('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.1.100, 10.0.0.1',
        },
      })

      const identifier = getRequestIdentifier(request)

      expect(identifier).toContain('ip_192.168.1.100')
    })

    it('should use x-real-ip as fallback', () => {
      const request = new Request('http://localhost:3000', {
        headers: {
          'x-real-ip': '203.0.113.45',
        },
      })

      const identifier = getRequestIdentifier(request)

      expect(identifier).toContain('ip_203.0.113.45')
    })

    it('should include user agent hash', () => {
      const request = new Request('http://localhost:3000', {
        headers: {
          'x-real-ip': '192.168.1.1',
          'user-agent': 'Mozilla/5.0 (Test Browser)',
        },
      })

      const identifier = getRequestIdentifier(request)

      expect(identifier).toMatch(/ip_192\.168\.1\.1_[a-z0-9]+/)
    })

    it('should handle missing headers gracefully', () => {
      const request = new Request('http://localhost:3000')

      const identifier = getRequestIdentifier(request)

      expect(identifier).toContain('ip_unknown')
    })

    it('should prioritize API key over IP', () => {
      const request = new Request('http://localhost:3000', {
        headers: {
          'x-api-key': 'my-api-key',
          'x-forwarded-for': '192.168.1.1',
        },
      })

      const identifier = getRequestIdentifier(request)

      expect(identifier).toContain('api_my-api-key')
      expect(identifier).not.toContain('ip_')
    })
  })

  describe('cleanupOldBuckets', () => {
    it('should remove expired buckets', async () => {
      vi.useFakeTimers()
      const identifier = 'cleanup-test-1'

      // Create a bucket
      await rateLimitTokenBucket(identifier, 5, 1, 1000)

      // Advance time past max age
      vi.advanceTimersByTime(4000000) // > 1 hour

      // Run cleanup
      cleanupOldBuckets(3600000) // 1 hour max age

      // Try to use the identifier again
      const result = await rateLimitTokenBucket(identifier, 5, 1, 1000)

      // Should have fresh bucket with full tokens
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(4) // One consumed

      vi.useRealTimers()
    })

    it('should keep recent buckets', async () => {
      const identifier = 'cleanup-test-2'

      // Create bucket
      await rateLimitTokenBucket(identifier, 5, 1, 1000)
      await rateLimitTokenBucket(identifier, 5, 1, 1000)

      // Run cleanup with very short max age
      cleanupOldBuckets(10)

      // Bucket should still exist (recently used)
      const result = await rateLimitTokenBucket(identifier, 5, 1, 1000)
      expect(result.remaining).toBe(2) // Third consumption
    })
  })

  describe('Edge Cases', () => {
    it('should handle concurrent requests', async () => {
      const identifier = 'concurrent-user'

      const promises = Array.from({ length: 10 }, () =>
        rateLimitTokenBucket(identifier, 10, 1, 1000)
      )

      const results = await Promise.all(promises)

      const allowed = results.filter(r => r.success).length
      expect(allowed).toBeLessThanOrEqual(10)
    })

    it('should handle zero limits', async () => {
      const identifier = 'zero-limit-user'

      const result = await rateLimitTokenBucket(identifier, 0, 1, 1000)

      expect(result.success).toBe(false)
    })

    it('should handle very large limits', async () => {
      const identifier = 'large-limit-user'

      const result = await rateLimitTokenBucket(identifier, 1000000, 1000, 1000)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(1000000)
    })

    it('should handle very small windows', async () => {
      const identifier = 'small-window-user'

      const result = await rateLimitSlidingWindow(identifier, 10, 100)

      expect(result.success).toBe(true)
      expect(result.reset).toBeLessThanOrEqual(100)
    })
  })
})
