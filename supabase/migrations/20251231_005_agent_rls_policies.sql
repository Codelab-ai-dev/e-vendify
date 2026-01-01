-- ============================================================================
-- E-VENDIFY: RLS Policies for WhatsApp Agent Tables
-- Migration: 20251231_005_agent_rls_policies.sql
-- Description: Políticas de seguridad Row Level Security
-- ============================================================================

-- ============================================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================================================

ALTER TABLE store_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_rate_limits ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS: store_knowledge_base
-- ============================================================================

-- Los dueños de tienda pueden ver su knowledge base
CREATE POLICY "Store owners can view their knowledge base"
  ON store_knowledge_base
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Los dueños pueden insertar en su knowledge base
CREATE POLICY "Store owners can insert knowledge"
  ON store_knowledge_base
  FOR INSERT
  TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Los dueños pueden actualizar su knowledge base
CREATE POLICY "Store owners can update their knowledge"
  ON store_knowledge_base
  FOR UPDATE
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Los dueños pueden eliminar de su knowledge base
CREATE POLICY "Store owners can delete their knowledge"
  ON store_knowledge_base
  FOR DELETE
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Service role tiene acceso completo (para n8n/webhooks)
CREATE POLICY "Service role full access to knowledge base"
  ON store_knowledge_base
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- POLÍTICAS: whatsapp_customers
-- ============================================================================

-- Dueños de tienda ven sus clientes de WhatsApp
CREATE POLICY "Store owners can view their whatsapp customers"
  ON whatsapp_customers
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Dueños pueden actualizar datos de sus clientes
CREATE POLICY "Store owners can update their whatsapp customers"
  ON whatsapp_customers
  FOR UPDATE
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Service role puede crear/gestionar clientes (webhooks)
CREATE POLICY "Service role full access to whatsapp customers"
  ON whatsapp_customers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- POLÍTICAS: whatsapp_sessions
-- ============================================================================

-- Dueños de tienda ven sesiones de su tienda
CREATE POLICY "Store owners can view their sessions"
  ON whatsapp_sessions
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Dueños pueden ver carritos abandonados, etc.
CREATE POLICY "Store owners can update sessions"
  ON whatsapp_sessions
  FOR UPDATE
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Service role gestiona sesiones (webhooks)
CREATE POLICY "Service role full access to sessions"
  ON whatsapp_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- POLÍTICAS: whatsapp_messages
-- ============================================================================

-- Dueños ven mensajes de sus tiendas
CREATE POLICY "Store owners can view messages"
  ON whatsapp_messages
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Service role gestiona mensajes
CREATE POLICY "Service role full access to messages"
  ON whatsapp_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- POLÍTICAS: agent_conversations
-- ============================================================================

-- Dueños ven conversaciones de sus tiendas (auditoría)
CREATE POLICY "Store owners can view agent conversations"
  ON agent_conversations
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Dueños pueden marcar feedback
CREATE POLICY "Store owners can update conversation feedback"
  ON agent_conversations
  FOR UPDATE
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Service role gestiona conversaciones
CREATE POLICY "Service role full access to agent conversations"
  ON agent_conversations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- POLÍTICAS: agent_rate_limits
-- ============================================================================

-- Solo service role gestiona rate limits
CREATE POLICY "Service role manages rate limits"
  ON agent_rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Dueños pueden ver rate limits de su tienda (para monitoreo)
CREATE POLICY "Store owners can view rate limits"
  ON agent_rate_limits
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- ADMIN POLICIES (para admin_users)
-- ============================================================================

-- Los admins pueden ver todo el knowledge base
CREATE POLICY "Admins can view all knowledge base"
  ON store_knowledge_base
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Los admins pueden ver todos los clientes
CREATE POLICY "Admins can view all whatsapp customers"
  ON whatsapp_customers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Los admins pueden ver todas las conversaciones
CREATE POLICY "Admins can view all conversations"
  ON agent_conversations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Permisos para authenticated users
GRANT SELECT ON store_knowledge_base TO authenticated;
GRANT INSERT, UPDATE, DELETE ON store_knowledge_base TO authenticated;

GRANT SELECT, UPDATE ON whatsapp_customers TO authenticated;
GRANT SELECT, UPDATE ON whatsapp_sessions TO authenticated;
GRANT SELECT ON whatsapp_messages TO authenticated;
GRANT SELECT, UPDATE ON agent_conversations TO authenticated;
GRANT SELECT ON agent_rate_limits TO authenticated;

-- Permisos para service role (webhooks, n8n)
GRANT ALL ON store_knowledge_base TO service_role;
GRANT ALL ON whatsapp_customers TO service_role;
GRANT ALL ON whatsapp_sessions TO service_role;
GRANT ALL ON whatsapp_messages TO service_role;
GRANT ALL ON agent_conversations TO service_role;
GRANT ALL ON agent_rate_limits TO service_role;

-- Permisos para ejecutar funciones
GRANT EXECUTE ON FUNCTION search_store_knowledge TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION search_products_semantic TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION search_products_hybrid TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_conversation_history TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_agent_stats TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_or_create_whatsapp_session TO service_role;
GRANT EXECUTE ON FUNCTION normalize_phone_number TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_within_24h_window TO service_role;
GRANT EXECUTE ON FUNCTION open_24h_window TO service_role;
GRANT EXECUTE ON FUNCTION check_rate_limit TO service_role;
GRANT EXECUTE ON FUNCTION increment_rate_limit TO service_role;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON POLICY "Store owners can view their knowledge base" ON store_knowledge_base
  IS 'Dueños de tienda solo ven knowledge de su tienda (multi-tenant)';

COMMENT ON POLICY "Service role full access to knowledge base" ON store_knowledge_base
  IS 'Service role (n8n, webhooks) tiene acceso completo para generar embeddings';
