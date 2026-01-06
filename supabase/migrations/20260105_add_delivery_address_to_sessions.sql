-- ============================================================================
-- Migración: Agregar campo delivery_address a whatsapp_sessions
-- Fecha: 2026-01-05
-- Descripción: Añade el campo para guardar la dirección de entrega durante
--              el flujo de checkout por WhatsApp
-- ============================================================================

-- Agregar columna delivery_address a whatsapp_sessions
ALTER TABLE whatsapp_sessions
ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- Comentario para documentación
COMMENT ON COLUMN whatsapp_sessions.delivery_address IS 'Dirección de entrega proporcionada por el cliente durante el checkout';
