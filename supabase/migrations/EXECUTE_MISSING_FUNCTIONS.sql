-- ============================================================================
-- E-VENDIFY: FUNCIONES DE BÚSQUEDA SEMÁNTICA (FALTANTES)
-- Ejecutar este script en Supabase Dashboard -> SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. FUNCIÓN: search_store_knowledge (búsqueda general)
-- ============================================================================

CREATE OR REPLACE FUNCTION search_store_knowledge(
  p_store_id UUID,
  p_query_embedding vector(1536),
  p_match_threshold FLOAT DEFAULT 0.7,
  p_match_count INT DEFAULT 5,
  p_content_types knowledge_content_type[] DEFAULT NULL,
  p_include_metadata BOOLEAN DEFAULT true
)
RETURNS TABLE (
  id UUID,
  content_type knowledge_content_type,
  reference_id UUID,
  title TEXT,
  content_text TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.content_type,
    kb.reference_id,
    kb.title,
    kb.content_text,
    CASE WHEN p_include_metadata THEN kb.metadata ELSE '{}'::JSONB END,
    (1 - (kb.embedding <=> p_query_embedding))::FLOAT AS similarity
  FROM store_knowledge_base kb
  WHERE
    kb.store_id = p_store_id
    AND kb.is_active = true
    AND (kb.valid_from IS NULL OR kb.valid_from <= NOW())
    AND (kb.valid_until IS NULL OR kb.valid_until > NOW())
    AND kb.embedding IS NOT NULL
    AND (p_content_types IS NULL OR kb.content_type = ANY(p_content_types))
    AND (1 - (kb.embedding <=> p_query_embedding)) > p_match_threshold
  ORDER BY kb.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;

-- ============================================================================
-- 2. FUNCIÓN: search_products_semantic (búsqueda de productos)
-- ============================================================================

CREATE OR REPLACE FUNCTION search_products_semantic(
  p_store_id UUID,
  p_query_embedding vector(1536),
  p_match_threshold FLOAT DEFAULT 0.65,
  p_match_count INT DEFAULT 5,
  p_category TEXT DEFAULT NULL,
  p_max_price DECIMAL DEFAULT NULL,
  p_only_available BOOLEAN DEFAULT true
)
RETURNS TABLE (
  product_id UUID,
  title TEXT,
  content_text TEXT,
  price DECIMAL,
  category TEXT,
  stock_quantity INTEGER,
  is_available BOOLEAN,
  image_url TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.reference_id AS product_id,
    kb.title,
    kb.content_text,
    (kb.metadata->>'price')::DECIMAL AS price,
    kb.metadata->>'category' AS category,
    (kb.metadata->>'stock_quantity')::INTEGER AS stock_quantity,
    (kb.metadata->>'is_available')::BOOLEAN AS is_available,
    kb.metadata->>'image_url' AS image_url,
    (1 - (kb.embedding <=> p_query_embedding))::FLOAT AS similarity
  FROM store_knowledge_base kb
  WHERE
    kb.store_id = p_store_id
    AND kb.content_type = 'product'
    AND kb.is_active = true
    AND kb.embedding IS NOT NULL
    AND (p_category IS NULL OR kb.metadata->>'category' ILIKE '%' || p_category || '%')
    AND (p_max_price IS NULL OR (kb.metadata->>'price')::DECIMAL <= p_max_price)
    AND (NOT p_only_available OR (kb.metadata->>'is_available')::BOOLEAN = true)
    AND (1 - (kb.embedding <=> p_query_embedding)) > p_match_threshold
  ORDER BY kb.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT 'Funciones de búsqueda semántica creadas exitosamente!' AS status;

-- Verificar que las funciones existen
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('search_store_knowledge', 'search_products_semantic');
