-- ============================================================================
-- E-VENDIFY: WhatsApp Agent Infrastructure
-- Migration: 20251231_003_create_whatsapp_agent_tables.sql
-- Description: Tablas para el agente RAG de WhatsApp (clientes, sesiones, mensajes)
-- ============================================================================

-- ============================================================================
-- TABLA: whatsapp_customers
-- Vinculación de números de WhatsApp con tiendas y datos del cliente
-- ============================================================================

CREATE TABLE whatsapp_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificación
  phone_number TEXT NOT NULL, -- Formato E.164: +5215512345678
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Datos del cliente (se van llenando con las conversaciones)
  customer_name TEXT,
  customer_email TEXT,

  -- Métricas del cliente
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_order_at TIMESTAMPTZ,

  -- Estado
  is_active BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false, -- Para spam/abuso
  blocked_reason TEXT,

  -- Preferencias
  preferred_language TEXT DEFAULT 'es',
  notification_enabled BOOLEAN DEFAULT true,

  -- Timestamps
  first_contact_at TIMESTAMPTZ DEFAULT NOW(),
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un número de teléfono solo puede estar vinculado a una tienda
  UNIQUE(phone_number, store_id)
);

-- Índices
CREATE INDEX idx_wa_customers_phone ON whatsapp_customers(phone_number);
CREATE INDEX idx_wa_customers_store ON whatsapp_customers(store_id);
CREATE INDEX idx_wa_customers_last_interaction ON whatsapp_customers(last_interaction_at DESC);

-- ============================================================================
-- TIPOS ENUMERADOS
-- ============================================================================

CREATE TYPE whatsapp_session_state AS ENUM (
  'idle',           -- Sin actividad reciente
  'browsing',       -- Explorando catálogo
  'cart',           -- Gestionando carrito
  'checkout',       -- En proceso de pago
  'support',        -- Pidiendo ayuda
  'waiting_input'   -- Esperando respuesta específica
);

CREATE TYPE whatsapp_message_role AS ENUM (
  'user',       -- Mensaje del cliente
  'assistant',  -- Respuesta del bot
  'system'      -- Mensaje del sistema (ej: orden creada)
);

CREATE TYPE agent_intent AS ENUM (
  'greeting',
  'search_product',
  'price_inquiry',
  'stock_check',
  'add_to_cart',
  'view_cart',
  'remove_from_cart',
  'checkout',
  'apply_coupon',
  'order_tracking',
  'faq',
  'support',
  'unknown'
);

-- ============================================================================
-- TABLA: whatsapp_sessions
-- Sesiones de conversación con estado del carrito
-- ============================================================================

CREATE TABLE whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  customer_id UUID NOT NULL REFERENCES whatsapp_customers(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL, -- Denormalizado para queries rápidas

  -- Estado de la sesión
  session_state whatsapp_session_state DEFAULT 'idle',

  -- Carrito de la sesión (JSONB para flexibilidad)
  cart_items JSONB DEFAULT '[]',
  -- Estructura: [{product_id, name, price, quantity, image_url}]

  cart_total DECIMAL(10,2) DEFAULT 0,
  applied_coupon_id UUID REFERENCES coupons(id),
  applied_coupon_code TEXT,
  discount_amount DECIMAL(10,2) DEFAULT 0,

  -- Contexto de la conversación
  context JSONB DEFAULT '{}',
  -- Estructura: {last_search, last_viewed_product, pending_action, etc.}

  -- Esperando input específico
  waiting_for TEXT, -- 'email', 'address', 'confirmation', etc.
  waiting_data JSONB DEFAULT '{}',

  -- Ventana de 24 horas de WhatsApp Business
  window_opened_at TIMESTAMPTZ,
  window_closes_at TIMESTAMPTZ,

  -- Timestamps
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE UNIQUE INDEX idx_wa_sessions_customer ON whatsapp_sessions(customer_id);
CREATE INDEX idx_wa_sessions_phone ON whatsapp_sessions(phone_number);
CREATE INDEX idx_wa_sessions_store ON whatsapp_sessions(store_id);
CREATE INDEX idx_wa_sessions_state ON whatsapp_sessions(session_state);
CREATE INDEX idx_wa_sessions_last_message ON whatsapp_sessions(last_message_at DESC);
CREATE INDEX idx_wa_sessions_window ON whatsapp_sessions(window_closes_at)
  WHERE window_closes_at IS NOT NULL;

-- ============================================================================
-- TABLA: whatsapp_messages
-- Historial de mensajes (para contexto del LLM)
-- ============================================================================

CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  session_id UUID NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
  store_id UUID NOT NULL, -- Denormalizado para partitioning futuro

  -- Mensaje
  role whatsapp_message_role NOT NULL,
  content TEXT NOT NULL,

  -- Metadata del mensaje
  message_type TEXT DEFAULT 'text', -- text, image, button_reply, list_reply
  metadata JSONB DEFAULT '{}',

  -- ID externo (Twilio)
  external_message_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_wa_messages_session ON whatsapp_messages(session_id, created_at DESC);
CREATE INDEX idx_wa_messages_store ON whatsapp_messages(store_id);
CREATE INDEX idx_wa_messages_external ON whatsapp_messages(external_message_id)
  WHERE external_message_id IS NOT NULL;

-- ============================================================================
-- TABLA: agent_conversations
-- Auditoría completa de cada interacción del agente
-- ============================================================================

CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificación
  session_id UUID REFERENCES whatsapp_sessions(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  phone_number TEXT NOT NULL,

  -- Mensajes
  user_message TEXT NOT NULL,
  agent_response TEXT NOT NULL,

  -- Clasificación
  intent agent_intent NOT NULL,
  intent_confidence DECIMAL(3,2), -- 0.00 - 1.00
  entities JSONB DEFAULT '{}', -- {product_name, category, order_id, etc.}

  -- RAG
  rag_query TEXT, -- Query usada para búsqueda
  rag_chunks_used JSONB DEFAULT '[]', -- Chunks recuperados con similarity
  rag_search_time_ms INTEGER,

  -- SQL
  sql_queries_executed JSONB DEFAULT '[]', -- Queries ejecutadas

  -- LLM
  llm_model TEXT NOT NULL, -- 'gpt-4o-mini', 'llama-3.3-70b', etc.
  llm_tokens_input INTEGER,
  llm_tokens_output INTEGER,
  llm_cost_usd DECIMAL(10,6), -- Costo en USD

  -- Acciones ejecutadas
  actions_executed JSONB DEFAULT '[]',
  -- [{type: 'add_to_cart', payload: {...}, success: true}]

  -- Performance
  total_latency_ms INTEGER,

  -- Feedback
  user_feedback TEXT, -- 'positive', 'negative', NULL
  escalated_to_human BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_agent_conv_session ON agent_conversations(session_id);
CREATE INDEX idx_agent_conv_store ON agent_conversations(store_id);
CREATE INDEX idx_agent_conv_phone ON agent_conversations(phone_number);
CREATE INDEX idx_agent_conv_intent ON agent_conversations(intent);
CREATE INDEX idx_agent_conv_created ON agent_conversations(created_at DESC);
CREATE INDEX idx_agent_conv_feedback ON agent_conversations(user_feedback)
  WHERE user_feedback IS NOT NULL;

-- ============================================================================
-- TABLA: agent_rate_limits
-- Control de rate limiting por usuario
-- ============================================================================

CREATE TABLE agent_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id),

  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  message_count INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limits_phone_window ON agent_rate_limits(phone_number, store_id, window_end DESC);

-- ============================================================================
-- FUNCIONES DE UTILIDAD
-- ============================================================================

-- Normalizar número de teléfono a formato E.164
CREATE OR REPLACE FUNCTION normalize_phone_number(p_phone TEXT)
RETURNS TEXT AS $$
DECLARE
  v_clean TEXT;
BEGIN
  -- Remover todo excepto dígitos y +
  v_clean := regexp_replace(p_phone, '[^0-9+]', '', 'g');

  -- Si no empieza con +, agregar +52 (México default)
  IF NOT v_clean LIKE '+%' THEN
    -- Si empieza con 52, agregar +
    IF v_clean LIKE '52%' AND length(v_clean) >= 12 THEN
      v_clean := '+' || v_clean;
    -- Si es número de 10 dígitos, agregar +52
    ELSIF length(v_clean) = 10 THEN
      v_clean := '+52' || v_clean;
    -- Si tiene 11 y empieza con 1 (formato sin código país)
    ELSIF length(v_clean) = 11 AND v_clean LIKE '1%' THEN
      v_clean := '+52' || substring(v_clean from 2);
    ELSE
      v_clean := '+' || v_clean;
    END IF;
  END IF;

  RETURN v_clean;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Obtener o crear sesión de WhatsApp
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

  -- Buscar o crear cliente
  INSERT INTO whatsapp_customers (phone_number, store_id)
  VALUES (v_normalized_phone, p_store_id)
  ON CONFLICT (phone_number, store_id) DO UPDATE
    SET last_interaction_at = NOW(),
        updated_at = NOW()
  RETURNING id INTO v_customer_id;

  -- Buscar o crear sesión
  INSERT INTO whatsapp_sessions (customer_id, store_id, phone_number)
  VALUES (v_customer_id, p_store_id, v_normalized_phone)
  ON CONFLICT (customer_id) DO UPDATE
    SET last_message_at = NOW(),
        updated_at = NOW()
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Verificar si está dentro de ventana de 24h
CREATE OR REPLACE FUNCTION is_within_24h_window(
  p_session_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_window_closes TIMESTAMPTZ;
BEGIN
  SELECT window_closes_at INTO v_window_closes
  FROM whatsapp_sessions
  WHERE id = p_session_id;

  IF v_window_closes IS NULL THEN
    RETURN false;
  END IF;

  RETURN v_window_closes > NOW();
END;
$$ LANGUAGE plpgsql STABLE;

-- Abrir ventana de 24h
CREATE OR REPLACE FUNCTION open_24h_window(
  p_session_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE whatsapp_sessions
  SET
    window_opened_at = NOW(),
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
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;

  SELECT COALESCE(SUM(message_count), 0) INTO v_count
  FROM agent_rate_limits
  WHERE phone_number = normalize_phone_number(p_phone_number)
    AND store_id = p_store_id
    AND window_end > v_window_start;

  RETURN v_count < p_max_messages;
END;
$$ LANGUAGE plpgsql STABLE;

-- Incrementar contador de rate limit
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
-- TRIGGERS
-- ============================================================================

-- Auto-actualizar updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_wa_customers_updated
  BEFORE UPDATE ON whatsapp_customers
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_wa_sessions_updated
  BEFORE UPDATE ON whatsapp_sessions
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON TABLE whatsapp_customers IS 'Clientes de WhatsApp vinculados a tiendas. Un teléfono puede comprar en múltiples tiendas.';
COMMENT ON TABLE whatsapp_sessions IS 'Sesión activa de un cliente en una tienda. Incluye carrito y contexto de conversación.';
COMMENT ON TABLE whatsapp_messages IS 'Historial de mensajes para contexto del LLM. Se usa para mantener coherencia conversacional.';
COMMENT ON TABLE agent_conversations IS 'Auditoría completa de cada interacción. Incluye RAG chunks, LLM cost, latency, etc.';
COMMENT ON FUNCTION normalize_phone_number IS 'Normaliza teléfonos a formato E.164. Default: México (+52)';
