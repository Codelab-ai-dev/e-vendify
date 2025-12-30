import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  signUpWithRetry,
  signInWithEmail,
  signOut,
  getCurrentUser,
  isAdmin,
  handleSupabaseError,
} from '../supabase'
import { supabase } from '../supabase'

describe('Supabase Authentication Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('handleSupabaseError', () => {
    it('should identify network errors', () => {
      const networkError = {
        message: 'Failed to fetch',
        status: 0,
      }

      const handled = handleSupabaseError(networkError)

      expect(handled.isNetworkError).toBe(true)
      expect(handled.message).toContain('Error de conexión')
    })

    it('should handle NetworkError type', () => {
      const networkError = {
        message: 'NetworkError when attempting to fetch resource',
      }

      const handled = handleSupabaseError(networkError)

      expect(handled.isNetworkError).toBe(true)
      expect(handled.message).toContain('Error de red')
    })

    it('should pass through non-network errors unchanged', () => {
      const regularError = {
        message: 'Invalid credentials',
        status: 401,
      }

      const handled = handleSupabaseError(regularError)

      expect(handled.isNetworkError).toBeUndefined()
      expect(handled.message).toBe('Invalid credentials')
    })

    it('should log error details', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const error = { message: 'Test error', status: 500 }
      handleSupabaseError(error)

      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Supabase Error Details:',
        expect.objectContaining({
          message: 'Test error',
          status: 500,
        })
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('signUpWithRetry', () => {
    it('should successfully sign up a new user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      } as any)

      const result = await signUpWithRetry('test@example.com', 'password123')

      expect(result.error).toBeNull()
      expect(result.data?.user).toEqual(mockUser)
      expect(supabase.auth.signUp).toHaveBeenCalledTimes(1)
    })

    it('should retry on network error', async () => {
      const networkError = {
        message: 'Failed to fetch',
        status: 0,
      }

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      // First two calls fail, third succeeds
      vi.mocked(supabase.auth.signUp)
        .mockResolvedValueOnce({ data: null, error: networkError } as any)
        .mockResolvedValueOnce({ data: null, error: networkError } as any)
        .mockResolvedValueOnce({
          data: { user: mockUser, session: null },
          error: null,
        } as any)

      const result = await signUpWithRetry('test@example.com', 'password123')

      expect(result.error).toBeNull()
      expect(result.data?.user).toEqual(mockUser)
      expect(supabase.auth.signUp).toHaveBeenCalledTimes(3)
    }, 10000) // Increase timeout for retries

    it('should fail after max retries', async () => {
      const networkError = {
        message: 'Failed to fetch',
        status: 0,
      }

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: null,
        error: networkError,
      } as any)

      const result = await signUpWithRetry('test@example.com', 'password123', undefined, 3)

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error?.isNetworkError).toBe(true)
      expect(supabase.auth.signUp).toHaveBeenCalledTimes(3)
    }, 15000)

    it('should not retry on non-network errors', async () => {
      const authError = {
        message: 'Email already registered',
        status: 400,
      }

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: null,
        error: authError,
      } as any)

      const result = await signUpWithRetry('test@example.com', 'password123')

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
      expect(supabase.auth.signUp).toHaveBeenCalledTimes(1)
    })

    it('should pass options to signUp', async () => {
      const options = {
        data: {
          full_name: 'Test User',
          age: 30,
        },
      }

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      } as any)

      await signUpWithRetry('test@example.com', 'password123', options)

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options,
      })
    })

    it('should handle unexpected errors', async () => {
      const unexpectedError = new Error('Unexpected error')

      vi.mocked(supabase.auth.signUp).mockRejectedValue(unexpectedError)

      const result = await signUpWithRetry('test@example.com', 'password123', undefined, 2)

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
      expect(supabase.auth.signUp).toHaveBeenCalledTimes(2)
    }, 10000)
  })

  describe('signInWithEmail', () => {
    it('should successfully sign in a user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      const mockSession = {
        access_token: 'token-123',
        refresh_token: 'refresh-123',
      }

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      } as any)

      const result = await signInWithEmail('test@example.com', 'password123')

      expect(result.error).toBeNull()
      expect(result.data?.user).toEqual(mockUser)
      expect(result.data?.session).toEqual(mockSession)
    })

    it('should handle invalid credentials', async () => {
      const authError = {
        message: 'Invalid login credentials',
        status: 400,
      }

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: null,
        error: authError,
      } as any)

      const result = await signInWithEmail('test@example.com', 'wrongpassword')

      expect(result.data).toBeNull()
      expect(result.error).toEqual(authError)
    })

    it('should call signInWithPassword with correct parameters', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: null,
        error: null,
      } as any)

      await signInWithEmail('user@test.com', 'mypassword')

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: 'mypassword',
      })
    })
  })

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      })

      const result = await signOut()

      expect(result.error).toBeNull()
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })

    it('should handle sign out errors', async () => {
      const signOutError = {
        message: 'Failed to sign out',
        status: 500,
      }

      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: signOutError,
      } as any)

      const result = await signOut()

      expect(result.error).toEqual(signOutError)
    })
  })

  describe('getCurrentUser', () => {
    it('should return the current user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'authenticated',
      }

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      const result = await getCurrentUser()

      expect(result.error).toBeNull()
      expect(result.user).toEqual(mockUser)
    })

    it('should return null when no user is authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any)

      const result = await getCurrentUser()

      expect(result.error).toBeNull()
      expect(result.user).toBeNull()
    })

    it('should handle errors when getting user', async () => {
      const getError = {
        message: 'Invalid JWT',
        status: 401,
      }

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: getError,
      } as any)

      const result = await getCurrentUser()

      expect(result.user).toBeNull()
      expect(result.error).toEqual(getError)
    })
  })

  describe('isAdmin', () => {
    it('should return true for admin users', async () => {
      const mockAdminRecord = {
        id: 'admin-1',
        user_id: 'user-123',
        created_at: new Date().toISOString(),
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAdminRecord,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await isAdmin('user-123')

      expect(result.isAdmin).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should return false for non-admin users', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found', code: 'PGRST116' },
            }),
          }),
        }),
      } as any)

      const result = await isAdmin('user-456')

      expect(result.isAdmin).toBe(false)
    })

    it('should handle database errors', async () => {
      const dbError = {
        message: 'Database connection error',
        code: '500',
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: dbError,
            }),
          }),
        }),
      } as any)

      const result = await isAdmin('user-123')

      expect(result.isAdmin).toBe(false)
      expect(result.error).toEqual(dbError)
    })

    it('should query admin_users table with correct user_id', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockImplementation(mockFrom as any)

      await isAdmin('user-789')

      expect(mockFrom).toHaveBeenCalledWith('admin_users')
    })
  })
})
