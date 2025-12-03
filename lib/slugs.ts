// Utilidades para generar y manejar slugs de tiendas

/**
 * Genera un slug a partir del nombre de una tienda
 * Convierte espacios en guiones, elimina caracteres especiales y convierte a minúsculas
 */
export function generateSlug(storeName: string): string {
  if (!storeName || typeof storeName !== 'string') {
    return 'tienda'
  }

  let slug = storeName
    .toLowerCase()
    .trim()
    // Reemplazar caracteres especiales del español
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/ç/g, 'c')
    // Eliminar caracteres especiales pero mantener espacios y guiones
    .replace(/[^a-z0-9\s-]/g, '')
    // Reemplazar espacios múltiples con uno solo
    .replace(/\s+/g, ' ')
    // Reemplazar espacios con guiones
    .replace(/\s/g, '-')
    // Eliminar guiones múltiples
    .replace(/-+/g, '-')
    // Eliminar guiones al inicio y final
    .replace(/^-+|-+$/g, '')

  // Si el slug está vacío o es muy corto, usar un fallback
  if (!slug || slug.length < 2) {
    slug = 'tienda-' + Math.random().toString(36).substr(2, 6)
  }

  return slug
}

/**
 * Genera un slug único verificando que no exista en la base de datos
 */
export async function generateUniqueSlug(storeName: string, supabase: any, excludeId?: string): Promise<string> {
  let baseSlug = generateSlug(storeName)
  let finalSlug = baseSlug
  let counter = 1

  while (true) {
    // Verificar si el slug ya existe
    let query = supabase
      .from('stores')
      .select('id')
      .eq('slug', finalSlug)

    // Excluir el ID actual si se está actualizando
    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error verificando slug:', error)
      // En caso de error, devolver el slug base
      return finalSlug
    }

    // Si no existe, usar este slug
    if (!data || data.length === 0) {
      return finalSlug
    }

    // Si existe, probar con un número al final
    counter++
    finalSlug = `${baseSlug}-${counter}`
  }
}

/**
 * Valida que un slug tenga el formato correcto
 */
export function isValidSlug(slug: string): boolean {
  // Debe contener solo letras minúsculas, números y guiones
  // No debe empezar o terminar con guión
  // Debe tener al menos 2 caracteres
  const slugRegex = /^[a-z0-9]+([a-z0-9-]*[a-z0-9])?$/
  return slugRegex.test(slug) && slug.length >= 2
}

/**
 * Ejemplos de uso:
 * generateSlug("Panadería San José") -> "panaderia-san-jose"
 * generateSlug("Tienda de María & Cia.") -> "tienda-de-maria-cia"
 * generateSlug("Café El Rincón") -> "cafe-el-rincon"
 */
