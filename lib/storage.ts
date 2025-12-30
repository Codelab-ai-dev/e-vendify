import { supabase } from './supabase'

const BUCKET_NAME = 'store-images'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Genera un nombre unico para el archivo
 */
function generateFileName(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  return `${timestamp}-${random}.${extension}`
}

/**
 * Sube una imagen de producto al storage
 * @param file - Archivo a subir
 * @param userId - ID del usuario (para organizar por carpetas)
 * @returns URL publica de la imagen o error
 */
export async function uploadProductImage(file: File, userId: string): Promise<UploadResult> {
  try {
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF.' }
    }

    // Validar tamano (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return { success: false, error: 'El archivo es muy grande. Maximo 5MB.' }
    }

    const fileName = generateFileName(file.name)
    const filePath = `${userId}/products/${fileName}`

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading product image:', error)
      return { success: false, error: error.message }
    }

    // Obtener URL publica
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return { success: true, url: urlData.publicUrl }
  } catch (error) {
    console.error('Unexpected error uploading product image:', error)
    return { success: false, error: 'Error inesperado al subir la imagen' }
  }
}

/**
 * Sube el logo de una tienda al storage
 * @param file - Archivo a subir
 * @param userId - ID del usuario
 * @returns URL publica del logo o error
 */
export async function uploadStoreLogo(file: File, userId: string): Promise<UploadResult> {
  try {
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF.' }
    }

    // Validar tamano (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return { success: false, error: 'El archivo es muy grande. Maximo 5MB.' }
    }

    const fileName = generateFileName(file.name)
    const filePath = `${userId}/logo/${fileName}`

    // Eliminar logo anterior si existe
    const { data: existingFiles } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`${userId}/logo`)

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${userId}/logo/${f.name}`)
      await supabase.storage.from(BUCKET_NAME).remove(filesToDelete)
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('Error uploading store logo:', error)
      return { success: false, error: error.message }
    }

    // Obtener URL publica
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return { success: true, url: urlData.publicUrl }
  } catch (error) {
    console.error('Unexpected error uploading store logo:', error)
    return { success: false, error: 'Error inesperado al subir el logo' }
  }
}

/**
 * Elimina una imagen del storage
 * @param imageUrl - URL completa de la imagen
 * @param userId - ID del usuario (para verificar permisos)
 */
export async function deleteImage(imageUrl: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Extraer el path del archivo de la URL
    const url = new URL(imageUrl)
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/store-images\/(.+)/)

    if (!pathMatch) {
      return { success: false, error: 'URL de imagen invalida' }
    }

    const filePath = decodeURIComponent(pathMatch[1])

    // Verificar que el archivo pertenece al usuario
    if (!filePath.startsWith(userId)) {
      return { success: false, error: 'No tienes permiso para eliminar esta imagen' }
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (error) {
      console.error('Error deleting image:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting image:', error)
    return { success: false, error: 'Error inesperado al eliminar la imagen' }
  }
}

/**
 * Verifica si una URL es del storage de Supabase
 */
export function isStorageUrl(url: string): boolean {
  if (!url) return false
  return url.includes('/storage/v1/object/public/store-images/')
}

/**
 * Verifica si una URL es base64
 */
export function isBase64Image(url: string): boolean {
  if (!url) return false
  return url.startsWith('data:image/')
}
