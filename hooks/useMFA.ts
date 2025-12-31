import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { AuthMFAEnrollResponse, AuthMFAVerifyResponse, Factor } from '@supabase/supabase-js'

export interface MFAStatus {
  isEnabled: boolean
  isVerified: boolean
  factors: Factor[]
  loading: boolean
}

export interface EnrollmentData {
  qrCode: string
  secret: string
  factorId: string
}

export const useMFA = () => {
  const [status, setStatus] = useState<MFAStatus>({
    isEnabled: false,
    isVerified: false,
    factors: [],
    loading: true
  })
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null)

  // Verificar estado de MFA
  const checkMFAStatus = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true }))

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setStatus({ isEnabled: false, isVerified: false, factors: [], loading: false })
        return
      }

      // Obtener factores MFA del usuario
      const { data, error } = await supabase.auth.mfa.listFactors()

      if (error) {
        console.error('Error checking MFA status:', error)
        setStatus(prev => ({ ...prev, loading: false }))
        return
      }

      const verifiedFactors = data.totp.filter(f => f.status === 'verified')

      setStatus({
        isEnabled: verifiedFactors.length > 0,
        isVerified: verifiedFactors.length > 0,
        factors: data.totp,
        loading: false
      })
    } catch (error) {
      console.error('Error in checkMFAStatus:', error)
      setStatus(prev => ({ ...prev, loading: false }))
    }
  }, [])

  useEffect(() => {
    checkMFAStatus()
  }, [checkMFAStatus])

  // Iniciar enrolamiento en MFA
  const enroll = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      })

      if (error) {
        console.error('MFA enroll error:', error)
        return { success: false, error: error.message }
      }

      if (data.type === 'totp') {
        setEnrollmentData({
          qrCode: data.totp.qr_code,
          secret: data.totp.secret,
          factorId: data.id
        })
        return { success: true }
      }

      return { success: false, error: 'Tipo de factor no soportado' }
    } catch (error) {
      console.error('Error enrolling MFA:', error)
      return { success: false, error: 'Error al configurar 2FA' }
    }
  }

  // Verificar código TOTP durante enrolamiento
  const verifyEnrollment = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!enrollmentData?.factorId) {
      return { success: false, error: 'No hay enrolamiento activo' }
    }

    try {
      // Crear challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollmentData.factorId
      })

      if (challengeError) {
        console.error('Challenge error:', challengeError)
        return { success: false, error: challengeError.message }
      }

      // Verificar código
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: enrollmentData.factorId,
        challengeId: challengeData.id,
        code
      })

      if (error) {
        console.error('Verify error:', error)
        return { success: false, error: 'Código incorrecto. Inténtalo de nuevo.' }
      }

      setEnrollmentData(null)
      await checkMFAStatus()
      return { success: true }
    } catch (error) {
      console.error('Error verifying enrollment:', error)
      return { success: false, error: 'Error al verificar código' }
    }
  }

  // Verificar código TOTP durante login
  const verifyLogin = async (factorId: string, code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Crear challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      })

      if (challengeError) {
        console.error('Login challenge error:', challengeError)
        return { success: false, error: challengeError.message }
      }

      // Verificar código
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code
      })

      if (error) {
        console.error('Login verify error:', error)
        return { success: false, error: 'Código incorrecto' }
      }

      return { success: true }
    } catch (error) {
      console.error('Error verifying login:', error)
      return { success: false, error: 'Error al verificar código' }
    }
  }

  // Desactivar MFA
  const disable = async (factorId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId
      })

      if (error) {
        console.error('Unenroll error:', error)
        return { success: false, error: error.message }
      }

      await checkMFAStatus()
      return { success: true }
    } catch (error) {
      console.error('Error disabling MFA:', error)
      return { success: false, error: 'Error al desactivar 2FA' }
    }
  }

  // Cancelar enrolamiento
  const cancelEnrollment = async (): Promise<void> => {
    if (enrollmentData?.factorId) {
      try {
        await supabase.auth.mfa.unenroll({
          factorId: enrollmentData.factorId
        })
      } catch (error) {
        // Ignorar errores al cancelar
      }
    }
    setEnrollmentData(null)
  }

  // Obtener el nivel de autenticación actual
  const getAuthenticatorAssuranceLevel = async () => {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    return { data, error }
  }

  return {
    status,
    enrollmentData,
    enroll,
    verifyEnrollment,
    verifyLogin,
    disable,
    cancelEnrollment,
    checkMFAStatus,
    getAuthenticatorAssuranceLevel
  }
}
