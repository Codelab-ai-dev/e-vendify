"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { generateSlug, generateUniqueSlug } from "@/lib/slugs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

export default function DebugSlugsPage() {
  const [stores, setStores] = useState<any[]>([])
  const [testName, setTestName] = useState("Panadería San José")
  const [generatedSlug, setGeneratedSlug] = useState("")
  const [loading, setLoading] = useState(false)

  // Cargar todas las tiendas para ver sus slugs
  useEffect(() => {
    loadStores()
  }, [])

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, business_name, slug, is_active')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading stores:', error)
      } else {
        setStores(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const testSlugGeneration = async () => {
    setLoading(true)
    try {
      // Test basic slug generation
      const basicSlug = generateSlug(testName)
      console.log('Basic slug:', basicSlug)

      // Test unique slug generation
      const uniqueSlug = await generateUniqueSlug(testName, supabase)
      console.log('Unique slug:', uniqueSlug)

      setGeneratedSlug(uniqueSlug)
    } catch (error) {
      console.error('Error generating slug:', error)
    } finally {
      setLoading(false)
    }
  }

  const testStoreBySlug = async (slug: string) => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error finding store by slug:', error)
        alert(`Error: ${error.message}`)
      } else {
        console.log('Store found:', data)
        alert(`Store found: ${data.business_name || data.name}`)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Debug Slugs & Stores</h1>

      {/* Test Slug Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Test Slug Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Store Name:</label>
            <Input
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="Enter store name"
            />
          </div>
          <Button onClick={testSlugGeneration} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Slug'}
          </Button>
          {generatedSlug && (
            <div className="p-3 bg-green-50 rounded">
              <strong>Generated Slug:</strong> {generatedSlug}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Stores */}
      <Card>
        <CardHeader>
          <CardTitle>Current Stores in Database</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={loadStores} className="mb-4">Refresh Stores</Button>
          {stores.length === 0 ? (
            <p className="text-gray-500">No stores found</p>
          ) : (
            <div className="space-y-2">
              {stores.map((store) => (
                <div key={store.id} className="p-3 border rounded flex justify-between items-center">
                  <div>
                    <strong>{store.business_name || store.name}</strong>
                    <br />
                    <span className="text-sm text-gray-600">
                      Slug: {store.slug || 'NO SLUG'} | Active: {store.is_active ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="space-x-2">
                    {store.slug && (
                      <Button
                        size="sm"
                        onClick={() => testStoreBySlug(store.slug)}
                      >
                        Test Slug
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/store/${store.slug}`, '_blank')}
                      disabled={!store.slug}
                    >
                      View Store
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Slug Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            "Panadería San José",
            "Café El Rincón",
            "Tienda de María & Cía.",
            "Supermercado Los Andes",
            "Restaurante La Fogata"
          ].map((name) => (
            <div key={name} className="flex justify-between items-center p-2 border rounded">
              <span>{name}</span>
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {generateSlug(name)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
