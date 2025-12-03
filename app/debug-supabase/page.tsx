"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default function DebugSupabasePage() {
  const [debugResults, setDebugResults] = useState<any>(null)
  const [testEmail, setTestEmail] = useState('test@example.com')
  const [testPassword, setTestPassword] = useState('testpassword123')
  const [registrationResult, setRegistrationResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDebug = async () => {
    setLoading(true)
    try {
      // Test basic connection
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        setDebugResults({
          success: false,
          error: error.message,
          details: error
        })
      } else {
        setDebugResults({
          success: true,
          message: 'Conexión exitosa con Supabase',
          data: data
        })
      }
    } catch (err) {
      setDebugResults({
        success: false,
        error: err instanceof Error ? err.message : 'Error desconocido',
        details: err
      })
    }
    setLoading(false)
  }

  const testRegistration = async () => {
    setLoading(true)
    try {
      // Test user registration
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            test_user: true
          }
        }
      })

      if (error) {
        setRegistrationResult({
          success: false,
          error: error.message,
          details: error
        })
      } else {
        setRegistrationResult({
          success: true,
          message: 'Usuario de prueba creado exitosamente',
          data: data
        })

        // Clean up test user if created
        if (data.user) {
          console.log('Test user created with ID:', data.user.id)
        }
      }
    } catch (err) {
      setRegistrationResult({
        success: false,
        error: err instanceof Error ? err.message : 'Error desconocido',
        details: err
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Debug Supabase</h1>
          <p className="text-gray-600 mt-2">Herramienta para diagnosticar problemas de conexión</p>
        </div>

        {/* Variables de entorno */}
        <Card>
          <CardHeader>
            <CardTitle>Variables de Entorno</CardTitle>
            <CardDescription>Verificación de configuración</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span>NEXT_PUBLIC_SUPABASE_URL:</span>
              <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_URL ? "default" : "destructive"}>
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Configurada" : "❌ No configurada"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
              <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "default" : "destructive"}>
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Configurada" : "❌ No configurada"}
              </Badge>
            </div>
            {process.env.NEXT_PUBLIC_SUPABASE_URL && (
              <div className="mt-4 p-3 bg-gray-100 rounded">
                <p className="text-sm"><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test de conexión */}
        <Card>
          <CardHeader>
            <CardTitle>Test de Conexión</CardTitle>
            <CardDescription>Probar conectividad con Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runDebug} disabled={loading} className="mb-4">
              {loading ? "Probando..." : "Probar Conexión"}
            </Button>

            {debugResults && (
              <div className={`p-4 rounded ${debugResults.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <h4 className="font-semibold mb-2">
                  {debugResults.success ? "✅ Conexión exitosa" : "❌ Error de conexión"}
                </h4>
                <p className="text-sm">
                  {debugResults.success ? debugResults.message : debugResults.error}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test de registro */}
        <Card>
          <CardHeader>
            <CardTitle>Test de Registro de Usuario</CardTitle>
            <CardDescription>Probar creación de usuarios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="testEmail">Email de prueba</Label>
                <Input
                  id="testEmail"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="testPassword">Contraseña de prueba</Label>
                <Input
                  id="testPassword"
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={testRegistration} disabled={loading}>
              {loading ? "Probando..." : "Probar Registro"}
            </Button>

            {registrationResult && (
              <div className={`p-4 rounded ${registrationResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <h4 className="font-semibold mb-2">
                  {registrationResult.success ? "✅ Registro exitoso" : "❌ Error en registro"}
                </h4>
                <p className="text-sm">
                  {registrationResult.success ? "Usuario creado correctamente" : registrationResult.error}
                </p>
                {registrationResult.data && (
                  <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto">
                    {JSON.stringify(registrationResult.data, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instrucciones de troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
            <CardDescription>Pasos para resolver problemas comunes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <h5 className="font-semibold">1. Verificar URL de Supabase</h5>
                <p>Asegúrate de que la URL sea correcta y accesible desde tu navegador</p>
              </div>
              <div>
                <h5 className="font-semibold">2. Verificar clave anónima</h5>
                <p>La clave debe ser la "anon/public key" de tu proyecto Supabase</p>
              </div>
              <div>
                <h5 className="font-semibold">3. Configuración de autenticación</h5>
                <p>Verifica que la autenticación esté habilitada en tu panel de Supabase</p>
              </div>
              <div>
                <h5 className="font-semibold">4. CORS y dominios permitidos</h5>
                <p>Añade localhost:3000 a los dominios permitidos en Supabase</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
