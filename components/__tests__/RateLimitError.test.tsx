import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RateLimitError, useRateLimitHandler } from '../RateLimitError'

describe('RateLimitError Component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render error message', () => {
    render(<RateLimitError retryAfter={60} limit={100} />)

    expect(screen.getByText('Límite de Solicitudes Excedido')).toBeInTheDocument()
    expect(screen.getByText(/demasiadas solicitudes/i)).toBeInTheDocument()
  })

  it('should display retry countdown', () => {
    render(<RateLimitError retryAfter={60} limit={100} />)

    expect(screen.getByText(/60 segundos/i)).toBeInTheDocument()
  })

  it('should show limit when provided', () => {
    render(<RateLimitError retryAfter={30} limit={50} />)

    expect(screen.getByText(/50 solicitudes/i)).toBeInTheDocument()
  })

  it('should countdown properly', async () => {
    render(<RateLimitError retryAfter={5} limit={100} />)

    expect(screen.getByText(/5 segundos/i)).toBeInTheDocument()

    vi.advanceTimersByTime(1000)

    await waitFor(() => {
      expect(screen.getByText(/4 segundos/i)).toBeInTheDocument()
    })

    vi.advanceTimersByTime(1000)

    await waitFor(() => {
      expect(screen.getByText(/3 segundos/i)).toBeInTheDocument()
    })
  })

  it('should enable retry button after countdown', async () => {
    render(<RateLimitError retryAfter={2} limit={100} onRetry={vi.fn()} />)

    const retryButton = screen.getByRole('button')
    expect(retryButton).toBeDisabled()

    vi.advanceTimersByTime(3000)

    await waitFor(() => {
      expect(retryButton).not.toBeDisabled()
      expect(screen.getByText(/reintentar ahora/i)).toBeInTheDocument()
    })
  })

  it('should call onRetry when button is clicked', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup({ delay: null })

    render(<RateLimitError retryAfter={0} limit={100} onRetry={onRetry} />)

    const retryButton = screen.getByRole('button', { name: /reintentar/i })

    await user.click(retryButton)

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('should format time correctly for minutes', () => {
    render(<RateLimitError retryAfter={90} limit={100} />)

    expect(screen.getByText(/1m 30s/i)).toBeInTheDocument()
  })

  it('should format time correctly for exact minutes', () => {
    render(<RateLimitError retryAfter={120} limit={100} />)

    expect(screen.getByText(/2 minutos/i)).toBeInTheDocument()
  })

  it('should display reset time when provided', () => {
    const resetTime = new Date('2025-12-03T15:30:00Z').toISOString()

    render(<RateLimitError retryAfter={60} limit={100} reset={resetTime} />)

    expect(screen.getByText(/reinicio completo/i)).toBeInTheDocument()
  })

  it('should not render retry button when onRetry is not provided', () => {
    render(<RateLimitError retryAfter={60} limit={100} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('useRateLimitHandler Hook', () => {
  it('should initialize with no error', () => {
    let hookResult: any

    function TestComponent() {
      hookResult = useRateLimitHandler()
      return null
    }

    render(<TestComponent />)

    expect(hookResult.rateLimitError).toBeNull()
  })

  it('should set error on 429 response', async () => {
    let hookResult: any

    function TestComponent() {
      hookResult = useRateLimitHandler()
      return null
    }

    render(<TestComponent />)

    const mockResponse = {
      status: 429,
      json: vi.fn().mockResolvedValue({
        retryAfter: 60,
        limit: 100,
        reset: '2025-12-03T15:30:00Z',
      }),
    } as any

    await hookResult.handleResponse(mockResponse)

    await waitFor(() => {
      expect(hookResult.rateLimitError).toBeDefined()
      expect(hookResult.rateLimitError.retryAfter).toBe(60)
      expect(hookResult.rateLimitError.limit).toBe(100)
    })
  })

  it('should clear error on successful response', async () => {
    let hookResult: any

    function TestComponent() {
      hookResult = useRateLimitHandler()
      return null
    }

    render(<TestComponent />)

    // First, set an error
    const errorResponse = {
      status: 429,
      json: vi.fn().mockResolvedValue({ retryAfter: 60 }),
    } as any

    await hookResult.handleResponse(errorResponse)

    await waitFor(() => {
      expect(hookResult.rateLimitError).not.toBeNull()
    })

    // Then, clear with successful response
    const successResponse = {
      status: 200,
      json: vi.fn().mockResolvedValue({}),
    } as any

    await hookResult.handleResponse(successResponse)

    await waitFor(() => {
      expect(hookResult.rateLimitError).toBeNull()
    })
  })

  it('should provide clearError function', async () => {
    let hookResult: any

    function TestComponent() {
      hookResult = useRateLimitHandler()
      return null
    }

    render(<TestComponent />)

    // Set error
    const errorResponse = {
      status: 429,
      json: vi.fn().mockResolvedValue({ retryAfter: 60 }),
    } as any

    await hookResult.handleResponse(errorResponse)

    await waitFor(() => {
      expect(hookResult.rateLimitError).not.toBeNull()
    })

    // Clear error manually
    hookResult.clearError()

    await waitFor(() => {
      expect(hookResult.rateLimitError).toBeNull()
    })
  })

  it('should return response for non-429 status', async () => {
    let hookResult: any

    function TestComponent() {
      hookResult = useRateLimitHandler()
      return null
    }

    render(<TestComponent />)

    const successResponse = {
      status: 200,
      ok: true,
    } as any

    const result = await hookResult.handleResponse(successResponse)

    expect(result).toBe(successResponse)
    expect(hookResult.rateLimitError).toBeNull()
  })

  it('should handle missing retryAfter in 429 response', async () => {
    let hookResult: any

    function TestComponent() {
      hookResult = useRateLimitHandler()
      return null
    }

    render(<TestComponent />)

    const mockResponse = {
      status: 429,
      json: vi.fn().mockResolvedValue({
        limit: 100,
        reset: '2025-12-03T15:30:00Z',
      }),
    } as any

    await hookResult.handleResponse(mockResponse)

    await waitFor(() => {
      expect(hookResult.rateLimitError).toBeDefined()
      expect(hookResult.rateLimitError.retryAfter).toBe(60) // default
    })
  })
})
