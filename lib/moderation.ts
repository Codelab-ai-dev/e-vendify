/**
 * Sistema de moderación de contenido para productos
 */

// Palabras prohibidas organizadas por categoría
const PROHIBITED_KEYWORDS: Record<string, string[]> = {
  drogas: [
    'marihuana', 'marijuana', 'mota', 'hierba', 'cannabis', 'thc', 'cbd',
    'cocaina', 'coca', 'crack', 'perico',
    'metanfetamina', 'meta', 'cristal', 'ice',
    'heroina', 'fentanilo', 'opioides', 'opiaceos',
    'lsd', 'acido', 'hongos magicos', 'psilocibina',
    'extasis', 'mdma', 'tachas',
    'ketamina', 'ghb',
    'anfetaminas', 'speed',
  ],
  armas: [
    'pistola', 'revolver', 'rifle', 'escopeta', 'fusil',
    'metralleta', 'ametralladora', 'subfusil',
    'municion', 'balas', 'cartuchos', 'calibre',
    'explosivos', 'dinamita', 'c4', 'granadas',
    'silenciador', 'mira telescopica',
    'cuchillo tactico', 'navaja automatica',
    'arma de fuego', 'arma blanca',
    'gas pimienta', 'taser',
  ],
  falsificaciones: [
    'replica', 'imitacion', 'clon', 'pirata', 'pirateado',
    'falsificado', 'falso', 'fake', 'counterfeit',
    'aaa', 'primera copia', 'mirror',
    'sin licencia', 'desbloqueado ilegalmente',
  ],
  robado: [
    'robado', 'sin factura', 'sin caja', 'recuperado',
    'de segunda sin papeles', 'sin documentos',
    'caido del camion', 'de procedencia dudosa',
  ],
  adultos: [
    'pornografia', 'xxx', 'adultos', 'erotico',
    'escort', 'servicios sexuales',
    'desnudo', 'nude',
  ],
  otros_ilegales: [
    'contrabando', 'ilegal', 'prohibido',
    'organos', 'sangre', 'plasma',
    'documentos falsos', 'identificacion falsa', 'ine falsa',
    'tarjetas clonadas', 'cuentas robadas', 'hackeo',
    'medicamento controlado', 'receta medica',
    'animales exoticos', 'especies protegidas',
  ],
}

// Crear lista plana de todas las palabras prohibidas
const ALL_PROHIBITED_WORDS = Object.values(PROHIBITED_KEYWORDS).flat()

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged'

export interface ModerationResult {
  isClean: boolean
  status: ModerationStatus
  flaggedWords: string[]
  categories: string[]
  riskLevel: 'low' | 'medium' | 'high'
  message?: string
}

/**
 * Normaliza texto para comparación (quita acentos, minúsculas)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9\s]/g, ' ') // Solo letras, números y espacios
    .replace(/\s+/g, ' ') // Múltiples espacios a uno
    .trim()
}

/**
 * Busca palabras prohibidas en el texto
 */
function findProhibitedWords(text: string): { word: string; category: string }[] {
  const normalized = normalizeText(text)
  const found: { word: string; category: string }[] = []

  for (const [category, words] of Object.entries(PROHIBITED_KEYWORDS)) {
    for (const word of words) {
      const normalizedWord = normalizeText(word)
      // Buscar palabra completa o como parte de una palabra compuesta
      const regex = new RegExp(`\\b${normalizedWord}\\b|${normalizedWord}`, 'i')
      if (regex.test(normalized)) {
        found.push({ word, category })
      }
    }
  }

  return found
}

/**
 * Analiza el contenido de un producto para detectar contenido prohibido
 */
export function moderateContent(
  name: string,
  description?: string | null,
  category?: string | null
): ModerationResult {
  // Combinar todos los textos para análisis
  const fullText = [name, description, category].filter(Boolean).join(' ')

  // Buscar palabras prohibidas
  const flagged = findProhibitedWords(fullText)

  if (flagged.length === 0) {
    return {
      isClean: true,
      status: 'pending', // Aún requiere revisión manual
      flaggedWords: [],
      categories: [],
      riskLevel: 'low',
    }
  }

  // Determinar nivel de riesgo basado en categorías encontradas
  const categories = [...new Set(flagged.map(f => f.category))]
  const highRiskCategories = ['drogas', 'armas', 'robado']
  const hasHighRisk = categories.some(c => highRiskCategories.includes(c))

  return {
    isClean: false,
    status: hasHighRisk ? 'rejected' : 'flagged',
    flaggedWords: [...new Set(flagged.map(f => f.word))],
    categories,
    riskLevel: hasHighRisk ? 'high' : 'medium',
    message: hasHighRisk
      ? 'Este producto contiene contenido que viola nuestras políticas y no puede ser publicado.'
      : 'Este producto requiere revisión adicional antes de ser publicado.',
  }
}

/**
 * Verifica rápidamente si un texto contiene contenido prohibido
 */
export function quickCheck(text: string): boolean {
  const normalized = normalizeText(text)
  return ALL_PROHIBITED_WORDS.some(word => {
    const normalizedWord = normalizeText(word)
    return normalized.includes(normalizedWord)
  })
}

/**
 * Obtiene la lista de categorías de contenido prohibido
 */
export function getProhibitedCategories(): string[] {
  return Object.keys(PROHIBITED_KEYWORDS)
}

/**
 * Mensajes de rechazo por categoría
 */
export const REJECTION_MESSAGES: Record<string, string> = {
  drogas: 'No permitimos la venta de sustancias controladas o ilegales.',
  armas: 'No permitimos la venta de armas o municiones.',
  falsificaciones: 'No permitimos la venta de productos falsificados o réplicas.',
  robado: 'No permitimos la venta de productos de procedencia dudosa.',
  adultos: 'No permitimos la venta de contenido para adultos.',
  otros_ilegales: 'Este producto viola nuestros términos de servicio.',
}
