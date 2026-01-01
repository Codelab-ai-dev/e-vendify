-- ============================================================================
-- E-VENDIFY: Store Knowledge Base (Vector DB)
-- Migration: 20251231_002_create_store_knowledge_base.sql
-- Description: Tabla principal para RAG con embeddings de productos y FAQs
-- ============================================================================

-- Tipos de contenido permitidos
CREATE TYPE knowledge_content_type AS ENUM (
  'product',      -- Producto del catálogo
  'faq',          -- Pregunta frecuente
  'policy',       -- Política (envío, devoluciones, etc.)
  'promotion',    -- Promoción activa
  'store_info',   -- Información de la tienda
  'custom'        -- Contenido personalizado
);

-- Tabla principal de knowledge base
CREATE TABLE store_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relación con tienda (multi-tenant obligatorio)
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Tipo y referencia
  content_type knowledge_content_type NOT NULL DEFAULT 'product',
  reference_id UUID, -- product_id si es producto, NULL para otros tipos

  -- Contenido
  title TEXT NOT NULL,
  content_text TEXT NOT NULL, -- Texto legible para RAG

  -- Vector embedding (OpenAI text-embedding-3-small = 1536 dimensiones)
  embedding vector(1536),

  -- Metadata adicional (precio, categoría, stock, etc.)
  metadata JSONB DEFAULT '{}',

  -- Vigencia (para promociones temporales)
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ, -- NULL = sin expiración

  -- Control
  is_active BOOLEAN DEFAULT true,
  is_auto_generated BOOLEAN DEFAULT true, -- true si viene de producto

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Índice B-tree para filtrado por tienda (obligatorio en todas las queries)
CREATE INDEX idx_knowledge_store_id ON store_knowledge_base(store_id);

-- Índice B-tree para tipo de contenido
CREATE INDEX idx_knowledge_content_type ON store_knowledge_base(content_type);

-- Índice B-tree para referencia (búsqueda de producto específico)
CREATE INDEX idx_knowledge_reference_id ON store_knowledge_base(reference_id)
  WHERE reference_id IS NOT NULL;

-- Índice GIN para metadata (filtrado por precio, categoría, etc.)
CREATE INDEX idx_knowledge_metadata ON store_knowledge_base USING GIN(metadata);

-- Índice para contenido activo y vigente
CREATE INDEX idx_knowledge_active ON store_knowledge_base(store_id, is_active)
  WHERE is_active = true;

-- Índice compuesto para queries frecuentes
CREATE INDEX idx_knowledge_store_type_active ON store_knowledge_base(store_id, content_type, is_active)
  WHERE is_active = true;

-- ============================================================================
-- ÍNDICE VECTORIAL (HNSW - más rápido que IVFFlat para búsquedas)
-- ============================================================================

-- Índice HNSW para búsqueda vectorial con cosine distance
-- m=16: conexiones por nodo (balance entre velocidad y precisión)
-- ef_construction=64: calidad de construcción del índice
CREATE INDEX idx_knowledge_embedding ON store_knowledge_base
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- TRIGGER: Actualizar updated_at automáticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION update_knowledge_base_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_knowledge_base_updated
  BEFORE UPDATE ON store_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_base_timestamp();

-- ============================================================================
-- FUNCIÓN: Generar contenido de producto para RAG
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_product_content(
  p_product_id UUID
) RETURNS TEXT AS $$
DECLARE
  v_content TEXT;
  v_product RECORD;
BEGIN
  SELECT
    p.name,
    p.description,
    p.price,
    p.category,
    p.stock_quantity,
    p.is_available,
    p.sku
  INTO v_product
  FROM products p
  WHERE p.id = p_product_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Construir texto optimizado para embeddings
  v_content := v_product.name;

  IF v_product.description IS NOT NULL AND v_product.description != '' THEN
    v_content := v_content || '. ' || v_product.description;
  END IF;

  v_content := v_content || '. Precio: $' || v_product.price::TEXT || ' MXN';

  IF v_product.category IS NOT NULL THEN
    v_content := v_content || '. Categoría: ' || v_product.category;
  END IF;

  IF v_product.stock_quantity IS NOT NULL THEN
    IF v_product.stock_quantity > 10 THEN
      v_content := v_content || '. Disponible en stock';
    ELSIF v_product.stock_quantity > 0 THEN
      v_content := v_content || '. Pocas unidades disponibles';
    ELSE
      v_content := v_content || '. Agotado temporalmente';
    END IF;
  END IF;

  RETURN v_content;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCIÓN: Upsert knowledge base entry
-- ============================================================================

CREATE OR REPLACE FUNCTION upsert_product_knowledge(
  p_store_id UUID,
  p_product_id UUID,
  p_title TEXT,
  p_content_text TEXT,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_knowledge_id UUID;
BEGIN
  INSERT INTO store_knowledge_base (
    store_id,
    content_type,
    reference_id,
    title,
    content_text,
    metadata,
    is_auto_generated
  ) VALUES (
    p_store_id,
    'product',
    p_product_id,
    p_title,
    p_content_text,
    p_metadata,
    true
  )
  ON CONFLICT (store_id, reference_id)
  WHERE content_type = 'product'
  DO UPDATE SET
    title = EXCLUDED.title,
    content_text = EXCLUDED.content_text,
    metadata = EXCLUDED.metadata,
    updated_at = NOW()
  RETURNING id INTO v_knowledge_id;

  RETURN v_knowledge_id;
END;
$$ LANGUAGE plpgsql;

-- Índice único para upsert de productos
CREATE UNIQUE INDEX idx_knowledge_product_unique
  ON store_knowledge_base(store_id, reference_id)
  WHERE content_type = 'product' AND reference_id IS NOT NULL;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON TABLE store_knowledge_base IS 'Vector database para RAG del agente WhatsApp. Almacena embeddings de productos, FAQs y políticas por tienda.';
COMMENT ON COLUMN store_knowledge_base.embedding IS 'Vector de 1536 dimensiones generado por OpenAI text-embedding-3-small';
COMMENT ON COLUMN store_knowledge_base.content_text IS 'Texto legible optimizado para búsqueda semántica';
COMMENT ON COLUMN store_knowledge_base.metadata IS 'Datos estructurados: {price, category, stock, image_url, etc.}';
