"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Mock data - en una app real vendría de la API
const mockProduct = {
  id: 1,
  name: "Pan integral artesanal",
  price: "2500",
  description: "Pan integral hecho con masa madre natural",
  image: "/placeholder.svg?height=200&width=200&text=Pan",
}

export default function EditProductPage() {
  const params = useParams()
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    image: "",
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    // Simular carga de datos del producto
    setFormData({
      name: mockProduct.name,
      price: mockProduct.price,
      description: mockProduct.description,
      image: mockProduct.image,
    })
    setImagePreview(mockProduct.image)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí iría la lógica para actualizar el producto
    console.log("Update product:", formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(result)
        setFormData({ ...formData, image: result })
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setFormData({ ...formData, image: "" })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al dashboard
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Editar producto</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Editar información del producto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Imagen */}
              <div className="space-y-2">
                <Label>Imagen del producto</Label>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="image-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Subir imagen</span>
                          <input
                            id="image-upload"
                            name="image-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </label>
                        <p className="pl-1">o arrastra y suelta</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG hasta 10MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del producto *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Ej: Pan integral artesanal"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Precio */}
              <div className="space-y-2">
                <Label htmlFor="price">Precio *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    placeholder="2500"
                    className="pl-8"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="100"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe tu producto, ingredientes, características especiales..."
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6">
                <Link href="/dashboard">
                  <Button variant="outline">Cancelar</Button>
                </Link>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Actualizar producto
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
