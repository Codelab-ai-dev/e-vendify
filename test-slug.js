// Test simple para verificar la generación de slugs
// Ejecutar con: node test-slug.js

function generateSlug(storeName) {
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

// Tests
const testNames = [
  "Panadería San José",
  "Café El Rincón", 
  "Tienda de María & Cía.",
  "Supermercado Los Andes",
  "Restaurante La Fogata",
  "123 Store",
  "A",
  "",
  null,
  undefined,
  "Store with lots of !@#$%^&*() symbols",
  "   Tienda   con   espacios   múltiples   "
]

console.log("=== PRUEBAS DE GENERACIÓN DE SLUGS ===\n")

testNames.forEach(name => {
  const slug = generateSlug(name)
  console.log(`"${name}" -> "${slug}"`)
})

console.log("\n=== VERIFICACIÓN DE LONGITUD ===")
testNames.forEach(name => {
  const slug = generateSlug(name)
  console.log(`"${name}" -> "${slug}" (${slug.length} chars)`)
})
