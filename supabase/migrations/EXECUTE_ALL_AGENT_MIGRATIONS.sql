-- ============================================================================
-- E-VENDIFY: ALL AGENT MIGRATIONS (CONSOLIDATED)
-- Ejecutar este script completo en Supabase Dashboard -> SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. HABILITAR PGVECTOR
-- IMPORTANTE: Primero habilita la extensión desde:
-- Dashboard -> Database -> Extensions -> Buscar "vector" -> Enable
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- 2. TIPOS ENUMERADOS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE knowledge_content_type AS ENUM (
    'product', 'faq', 'policy', 'promotion', 'store_info', 'custom'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE whatsapp_session_state AS ENUM (
    'idle', 'browsing', 'cart', 'checkout', 'support', 'waiting_input'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE whatsapp_message_role AS ENUM ('user', 'assistant', 'system');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE agent_intent AS ENUM (
    'greeting', 'search_product', 'price_inquiry', 'stock_check',
    'add_to_cart', 'view_cart', 'remove_from_cart', 'update_cart',
    'checkout', 'apply_coupon', 'order_tracking', 'order_history',
    'faq', 'store_info', 'support', 'farewell', 'unknown'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 3. TABLA: store_knowledge_base (Vector DB)
-- ============================================================================

CREATE TABLE IF NOT EXISTS store_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  content_type knowledge_content_type NOT NULL DEFAULT 'product',
  reference_id UUID,
  title TEXT NOT NULL,
  content_text TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_auto_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para store_knowledge_base
CREATE INDEX IF NOT EXISTS idx_knowledge_store_id ON store_knowledge_base(store_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_content_type ON store_knowledge_base(content_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_reference_id ON store_knowledge_base(reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_knowledge_metadata ON store_knowledge_base USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_knowledge_active ON store_knowledge_base(store_id, is_active) WHERE is_active = true;

-- Índice HNSW para búsqueda vectorial (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_knowledge_embedding') THEN
    CREATE INDEX idx_knowledge_embedding ON store_knowledge_base
      USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);
  END IF;
END $$;

-- ============================================================================
-- 4. TABLA: whatsapp_customers
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_email TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false,
  blocked_reason TEXT,
  preferred_language TEXT DEFAULT 'es',
  notification_enabled BOOLEAN DEFAULT true,
  first_contact_at TIMESTAMPTZ DEFAULT NOW(),
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(phone_number, store_id)
);

CREATE INDEX IF NOT EXISTS idx_wa_customers_phone ON whatsapp_customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_wa_customers_store ON whatsapp_customers(store_id);

-- ============================================================================
-- 5. TABLA: whatsapp_sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES whatsapp_customers(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  session_state whatsapp_session_state DEFAULT 'idle',
  cart_items JSONB DEFAULT '[]',
  cart_total DECIMAL(10,2) DEFAULT 0,
  applied_coupon_id UUID REFERENCES coupons(id),
  applied_coupon_code TEXT,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  context JSONB DEFAULT '{}',
  waiting_for TEXT,
  waiting_data JSONB DEFAULT '{}',
  window_opened_at TIMESTAMPTZ,
  window_closes_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wa_sessions_customer ON whatsapp_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_wa_sessions_phone ON whatsapp_sessions(phone_number);
CREATE INDEX IF NOT EXISTS idx_wa_sessions_store ON whatsapp_sessions(store_id);

-- ============================================================================
-- 6. TABLA: whatsapp_messages
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
  store_id UUID NOT NULL,
  role whatsapp_message_role NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  metadata JSONB DEFAULT '{}',
  external_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_messages_session ON whatsapp_messages(session_id, created_at DESC);

-- ============================================================================
-- 7. TABLA: agent_conversations
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES whatsapp_sessions(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  phone_number TEXT NOT NULL,
  user_message TEXT NOT NULL,
  agent_response TEXT NOT NULL,
  intent agent_intent NOT NULL,
  intent_confidence DECIMAL(3,2),
  entities JSONB DEFAULT '{}',
  rag_query TEXT,
  rag_chunks_used JSONB DEFAULT '[]',
  sql_queries_executed JSONB DEFAULT '[]',
  actions_executed JSONB DEFAULT '[]',
  llm_model TEXT NOT NULL,
  llm_tokens_input INTEGER,
  llm_tokens_output INTEGER,
  llm_cost_usd DECIMAL(10,6),
  total_latency_ms INTEGER,
  user_feedback TEXT,
  escalated_to_human BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_conv_store ON agent_conversations(store_id);
CREATE INDEX IF NOT EXISTS idx_agent_conv_created ON agent_conversations(created_at DESC);

-- ============================================================================
-- 8. TABLA: agent_rate_limits
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id),
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  message_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_phone_window ON agent_rate_limits(phone_number, store_id, window_end DESC);

-- ============================================================================
-- 9. FUNCIONES DE UTILIDAD
-- ============================================================================

-- Normalizar número de teléfono
CREATE OR REPLACE FUNCTION normalize_phone_number(p_phone TEXT)
RETURNS TEXT AS $$
DECLARE
  v_clean TEXT;
BEGIN
  v_clean := regexp_replace(p_phone, '[^0-9+]', '', 'g');
  IF NOT v_clean LIKE '+%' THEN
    IF v_clean LIKE '52%' AND length(v_clean) >= 12 THEN
      v_clean := '+' || v_clean;
    ELSIF length(v_clean) = 10 THEN
      v_clean := '+52' || v_clean;
    ELSIF length(v_clean) = 11 AND v_clean LIKE '1%' THEN
      v_clean := '+52' || substring(v_clean from 2);
    ELSE
      v_clean := '+' || v_clean;
    END IF;
  END IF;
  RETURN v_clean;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Obtener o crear sesión
CREATE OR REPLACE FUNCTION get_or_create_whatsapp_session(
  p_phone_number TEXT,
  p_store_id UUID
) RETURNS UUID AS $$
DECLARE
  v_normalized_phone TEXT;
  v_customer_id UUID;
  v_session_id UUID;
BEGIN
  v_normalized_phone := normalize_phone_number(p_phone_number);

  INSERT INTO whatsapp_customers (phone_number, store_id)
  VALUES (v_normalized_phone, p_store_id)
  ON CONFLICT (phone_number, store_id) DO UPDATE
    SET last_interaction_at = NOW(), updated_at = NOW()
  RETURNING id INTO v_customer_id;

  INSERT INTO whatsapp_sessions (customer_id, store_id, phone_number)
  VALUES (v_customer_id, p_store_id, v_normalized_phone)
  ON CONFLICT (customer_id) DO UPDATE
    SET last_message_at = NOW(), updated_at = NOW()
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Abrir ventana 24h
CREATE OR REPLACE FUNCTION open_24h_window(p_session_id UUID) RETURNS VOID AS $$
BEGIN
  UPDATE whatsapp_sessions
  SET window_opened_at = NOW(),
      window_closes_at = NOW() + INTERVAL '24 hours',
      updated_at = NOW()
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- Verificar rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_phone_number TEXT,
  p_store_id UUID,
  p_window_minutes INTEGER DEFAULT 10,
  p_max_messages INTEGER DEFAULT 20
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(message_count), 0) INTO v_count
  FROM agent_rate_limits
  WHERE phone_number = normalize_phone_number(p_phone_number)
    AND store_id = p_store_id
    AND window_end > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  RETURN v_count < p_max_messages;
END;
$$ LANGUAGE plpgsql STABLE;

-- Incrementar rate limit
CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_phone_number TEXT,
  p_store_id UUID,
  p_window_minutes INTEGER DEFAULT 10
) RETURNS VOID AS $$
DECLARE
  v_normalized_phone TEXT;
  v_window_end TIMESTAMPTZ;
BEGIN
  v_normalized_phone := normalize_phone_number(p_phone_number);
  v_window_end := NOW() + (p_window_minutes || ' minutes')::INTERVAL;

  INSERT INTO agent_rate_limits (phone_number, store_id, window_start, window_end, message_count)
  VALUES (v_normalized_phone, p_store_id, NOW(), v_window_end, 1)
  ON CONFLICT (phone_number, store_id, window_end) DO UPDATE
    SET message_count = agent_rate_limits.message_count + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. FUNCIÓN DE BÚSQUEDA SEMÁNTICA
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

-- Búsqueda de productos
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
-- 11. HABILITAR RLS
-- ============================================================================

ALTER TABLE store_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_rate_limits ENABLE ROW LEVEL SECURITY;

-- Políticas para service_role (acceso completo)
CREATE POLICY IF NOT EXISTS "Service role full access kb" ON store_knowledge_base FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Service role full access customers" ON whatsapp_customers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Service role full access sessions" ON whatsapp_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Service role full access messages" ON whatsapp_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Service role full access conv" ON agent_conversations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Service role full access rate" ON agent_rate_limits FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- DONE! Todas las migraciones del agente ejecutadas.
-- ============================================================================
SELECT 'Migraciones del agente completadas exitosamente!' AS status;
