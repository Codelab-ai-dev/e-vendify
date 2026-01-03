-- ============================================================================
-- E-VENDIFY: Add oxxo_checkout to agent_intent enum
-- ============================================================================

-- Agregar el valor 'oxxo_checkout' al enum agent_intent si no existe
DO $$
BEGIN
  -- Verificar si el valor ya existe en el enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'oxxo_checkout'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'agent_intent')
  ) THEN
    ALTER TYPE agent_intent ADD VALUE 'oxxo_checkout';
  END IF;
END $$;

-- Comentario para documentar el cambio
COMMENT ON TYPE agent_intent IS 'Tipos de intent del agente de WhatsApp: greeting, search_product, price_inquiry, stock_check, add_to_cart, view_cart, remove_from_cart, update_cart, checkout, oxxo_checkout, apply_coupon, order_tracking, order_history, faq, store_info, support, farewell, unknown';
