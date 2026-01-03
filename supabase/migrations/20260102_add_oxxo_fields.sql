-- ============================================================================
-- E-VENDIFY: Add OXXO payment fields to orders
-- ============================================================================

-- Agregar campos para pagos OXXO
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'mercadopago',
ADD COLUMN IF NOT EXISTS oxxo_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS oxxo_ticket_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS oxxo_expiration VARCHAR(255);

-- Índice para buscar por referencia OXXO
CREATE INDEX IF NOT EXISTS idx_orders_oxxo_reference ON orders(oxxo_reference)
WHERE oxxo_reference IS NOT NULL;

-- Comentarios
COMMENT ON COLUMN orders.payment_method IS 'Método de pago: mercadopago, oxxo, spei, transfer';
COMMENT ON COLUMN orders.oxxo_reference IS 'Referencia/código de barras para pago en OXXO';
COMMENT ON COLUMN orders.oxxo_ticket_id IS 'ID del ticket en MercadoPago';
COMMENT ON COLUMN orders.oxxo_expiration IS 'Fecha de expiración del ticket OXXO';
