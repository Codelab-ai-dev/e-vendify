-- ============================================================================
-- E-VENDIFY: Enable pgvector extension
-- Migration: 20251231_001_enable_pgvector.sql
-- Description: Habilita la extensión pgvector para búsqueda semántica RAG
-- ============================================================================

-- Habilitar extensión pgvector (requiere permisos de superuser en Supabase)
-- En Supabase Dashboard: Database > Extensions > Buscar "vector" > Enable
CREATE EXTENSION IF NOT EXISTS vector;

-- Verificar que la extensión está habilitada
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    RAISE EXCEPTION 'pgvector extension is not installed. Please enable it from Supabase Dashboard.';
  END IF;
END $$;
