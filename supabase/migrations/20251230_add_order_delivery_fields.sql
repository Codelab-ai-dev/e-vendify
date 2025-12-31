-- ============================================
-- MIGRACIÓN: Agregar campos de entrega a orders
-- Fecha: 2024-12-30
-- ============================================

-- Agregar campo para notas del cliente
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_notes TEXT;

-- Agregar campo para método de entrega (delivery o pickup)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_method TEXT
CHECK (delivery_method IS NULL OR delivery_method IN ('delivery', 'pickup'));

-- Agregar campo para ubicación de entrega (coordenadas)
-- Usamos JSONB para almacenar { lat: number, lng: number }
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_location JSONB;

-- Agregar índice para filtrar por método de entrega
CREATE INDEX IF NOT EXISTS idx_orders_delivery_method
ON public.orders(delivery_method);

-- Comentarios para documentación
COMMENT ON COLUMN public.orders.customer_notes IS 'Notas adicionales del cliente para el pedido';
COMMENT ON COLUMN public.orders.delivery_method IS 'Método de entrega: delivery (envío a domicilio) o pickup (recoger en tienda)';
COMMENT ON COLUMN public.orders.delivery_location IS 'Coordenadas de entrega en formato JSON: { lat: number, lng: number }';
