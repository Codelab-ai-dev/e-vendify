-- ============================================================================
-- E-VENDIFY: Semantic Search Function (RAG)
-- Migration: 20251231_004_create_semantic_search_function.sql
-- Description: Función RPC para búsqueda semántica en knowledge base
-- ============================================================================

-- ============================================================================
-- FUNCIÓN PRINCIPAL: Búsqueda semántica en knowledge base
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
LANGUAGE plpgsql
STABLE
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
    -- Filtro obligatorio por tienda (multi-tenant)
    kb.store_id = p_store_id
    -- Solo contenido activo
    AND kb.is_active = true
    -- Vigencia temporal
    AND (kb.valid_from IS NULL OR kb.valid_from <= NOW())
    AND (kb.valid_until IS NULL OR kb.valid_until > NOW())
    -- Embedding debe existir
    AND kb.embedding IS NOT NULL
    -- Filtro por tipos de contenido (opcional)
    AND (p_content_types IS NULL OR kb.content_type = ANY(p_content_types))
    -- Threshold de similitud
    AND (1 - (kb.embedding <=> p_query_embedding)) > p_match_threshold
  ORDER BY kb.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;

-- ============================================================================
-- FUNCIÓN: Búsqueda semántica solo de productos
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
LANGUAGE plpgsql
STABLE
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
    -- Filtro por categoría
    AND (p_category IS NULL OR kb.metadata->>'category' ILIKE '%' || p_category || '%')
    -- Filtro por precio máximo
    AND (p_max_price IS NULL OR (kb.metadata->>'price')::DECIMAL <= p_max_price)
    -- Filtro por disponibilidad
    AND (NOT p_only_available OR (kb.metadata->>'is_available')::BOOLEAN = true)
    -- Threshold
    AND (1 - (kb.embedding <=> p_query_embedding)) > p_match_threshold
  ORDER BY kb.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;

-- ============================================================================
-- FUNCIÓN: Búsqueda híbrida (semántica + keyword)
-- ============================================================================

CREATE OR REPLACE FUNCTION search_products_hybrid(
  p_store_id UUID,
  p_query_embedding vector(1536),
  p_keyword TEXT DEFAULT NULL,
  p_match_threshold FLOAT DEFAULT 0.5,
  p_match_count INT DEFAULT 10
)
RETURNS TABLE (
  product_id UUID,
  title TEXT,
  content_text TEXT,
  price DECIMAL,
  category TEXT,
  image_url TEXT,
  similarity FLOAT,
  keyword_match BOOLEAN,
  combined_score FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH semantic_results AS (
    SELECT
      kb.reference_id,
      kb.title,
      kb.content_text,
      (kb.metadata->>'price')::DECIMAL AS price,
      kb.metadata->>'category' AS category,
      kb.metadata->>'image_url' AS image_url,
      (1 - (kb.embedding <=> p_query_embedding))::FLOAT AS sim,
      -- Keyword match boost
      CASE
        WHEN p_keyword IS NOT NULL AND (
          kb.title ILIKE '%' || p_keyword || '%'
          OR kb.content_text ILIKE '%' || p_keyword || '%'
        ) THEN true
        ELSE false
      END AS kw_match
    FROM store_knowledge_base kb
    WHERE
      kb.store_id = p_store_id
      AND kb.content_type = 'product'
      AND kb.is_active = true
      AND kb.embedding IS NOT NULL
      AND (1 - (kb.embedding <=> p_query_embedding)) > p_match_threshold
  )
  SELECT
    sr.reference_id AS product_id,
    sr.title,
    sr.content_text,
    sr.price,
    sr.category,
    sr.image_url,
    sr.sim AS similarity,
    sr.kw_match AS keyword_match,
    -- Score combinado: similarity + bonus por keyword match
    (sr.sim + CASE WHEN sr.kw_match THEN 0.15 ELSE 0 END)::FLOAT AS combined_score
  FROM semantic_results sr
  ORDER BY combined_score DESC
  LIMIT p_match_count;
END;
$$;

-- ============================================================================
-- FUNCIÓN: Obtener historial de mensajes para contexto LLM
-- ============================================================================

CREATE OR REPLACE FUNCTION get_conversation_history(
  p_session_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  role whatsapp_message_role,
  content TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    m.role,
    m.content,
    m.created_at
  FROM whatsapp_messages m
  WHERE m.session_id = p_session_id
  ORDER BY m.created_at DESC
  LIMIT p_limit;
$$;

-- ============================================================================
-- FUNCIÓN: Estadísticas del agente por tienda
-- ============================================================================

CREATE OR REPLACE FUNCTION get_agent_stats(
  p_store_id UUID,
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  total_conversations BIGINT,
  unique_customers BIGINT,
  avg_latency_ms NUMERIC,
  total_llm_cost_usd NUMERIC,
  top_intents JSONB,
  conversations_by_day JSONB,
  escalation_rate NUMERIC
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
BEGIN
  v_start_date := NOW() - (p_days || ' days')::INTERVAL;

  RETURN QUERY
  SELECT
    -- Total conversaciones
    COUNT(*)::BIGINT AS total_conversations,

    -- Clientes únicos
    COUNT(DISTINCT ac.phone_number)::BIGINT AS unique_customers,

    -- Latencia promedio
    ROUND(AVG(ac.total_latency_ms)::NUMERIC, 2) AS avg_latency_ms,

    -- Costo total LLM
    ROUND(SUM(ac.llm_cost_usd)::NUMERIC, 4) AS total_llm_cost_usd,

    -- Top intents
    (
      SELECT jsonb_agg(intent_stat)
      FROM (
        SELECT jsonb_build_object('intent', intent, 'count', cnt) AS intent_stat
        FROM (
          SELECT intent, COUNT(*) AS cnt
          FROM agent_conversations
          WHERE store_id = p_store_id AND created_at >= v_start_date
          GROUP BY intent
          ORDER BY cnt DESC
          LIMIT 5
        ) top5
      ) agg
    ) AS top_intents,

    -- Conversaciones por día
    (
      SELECT jsonb_agg(day_stat ORDER BY day)
      FROM (
        SELECT jsonb_build_object(
          'date', day::DATE,
          'count', cnt
        ) AS day_stat, day
        FROM (
          SELECT DATE_TRUNC('day', created_at) AS day, COUNT(*) AS cnt
          FROM agent_conversations
          WHERE store_id = p_store_id AND created_at >= v_start_date
          GROUP BY DATE_TRUNC('day', created_at)
        ) by_day
      ) agg
    ) AS conversations_by_day,

    -- Tasa de escalación
    ROUND(
      (COUNT(*) FILTER (WHERE ac.escalated_to_human = true)::NUMERIC /
       NULLIF(COUNT(*), 0) * 100)::NUMERIC,
      2
    ) AS escalation_rate

  FROM agent_conversations ac
  WHERE ac.store_id = p_store_id
    AND ac.created_at >= v_start_date;
END;
$$;

-- ============================================================================
-- FUNCIÓN: Sincronizar producto a knowledge base
-- Llamar cuando se crea/actualiza un producto
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_product_to_knowledge_base()
RETURNS TRIGGER AS $$
DECLARE
  v_content_text TEXT;
  v_metadata JSONB;
BEGIN
  -- Solo sincronizar productos aprobados
  IF NEW.moderation_status != 'approved' THEN
    -- Si fue aprobado antes y ahora no, desactivar
    IF TG_OP = 'UPDATE' AND OLD.moderation_status = 'approved' THEN
      UPDATE store_knowledge_base
      SET is_active = false, updated_at = NOW()
      WHERE reference_id = NEW.id AND content_type = 'product';
    END IF;
    RETURN NEW;
  END IF;

  -- Generar contenido
  v_content_text := generate_product_content(NEW.id);

  -- Preparar metadata
  v_metadata := jsonb_build_object(
    'price', NEW.price,
    'category', COALESCE(NEW.category, 'General'),
    'stock_quantity', COALESCE(NEW.stock_quantity, 0),
    'is_available', COALESCE(NEW.is_available, true),
    'image_url', NEW.image_url,
    'sku', NEW.sku,
    'average_rating', NEW.average_rating,
    'reviews_count', NEW.reviews_count
  );

  -- Upsert en knowledge base (embedding se genera via n8n)
  INSERT INTO store_knowledge_base (
    store_id,
    content_type,
    reference_id,
    title,
    content_text,
    metadata,
    is_active,
    is_auto_generated
  ) VALUES (
    NEW.store_id,
    'product',
    NEW.id,
    NEW.name,
    v_content_text,
    v_metadata,
    true,
    true
  )
  ON CONFLICT (store_id, reference_id)
  WHERE content_type = 'product'
  DO UPDATE SET
    title = EXCLUDED.title,
    content_text = EXCLUDED.content_text,
    metadata = EXCLUDED.metadata,
    is_active = true,
    embedding = NULL, -- Forzar regeneración del embedding
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar productos
DROP TRIGGER IF EXISTS trigger_sync_product_knowledge ON products;
CREATE TRIGGER trigger_sync_product_knowledge
  AFTER INSERT OR UPDATE OF name, description, price, category, stock_quantity, is_available, moderation_status
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_to_knowledge_base();

-- ============================================================================
-- FUNCIÓN: Limpiar producto de knowledge base cuando se elimina
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_product_from_knowledge_base()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM store_knowledge_base
  WHERE reference_id = OLD.id AND content_type = 'product';
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_delete_product_knowledge ON products;
CREATE TRIGGER trigger_delete_product_knowledge
  AFTER DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION delete_product_from_knowledge_base();

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON FUNCTION search_store_knowledge IS 'Búsqueda semántica principal en knowledge base. Usa cosine similarity con pgvector.';
COMMENT ON FUNCTION search_products_semantic IS 'Búsqueda semántica especializada para productos con filtros adicionales.';
COMMENT ON FUNCTION search_products_hybrid IS 'Búsqueda híbrida: combina similaridad semántica con match de keywords.';
COMMENT ON FUNCTION sync_product_to_knowledge_base IS 'Trigger: sincroniza automáticamente productos aprobados a knowledge base.';
