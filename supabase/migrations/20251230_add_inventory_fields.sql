-- ============================================
-- Migración: Agregar campos de inventario a productos
-- Fecha: 2024-12-30
-- ============================================

-- Agregar campos de inventario a la tabla products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sku TEXT;

-- Índice para búsqueda por SKU
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku) WHERE sku IS NOT NULL;

-- Índice para productos con stock bajo
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON public.products(stock_quantity, low_stock_threshold)
WHERE track_inventory = true;

-- ============================================
-- Función: Actualizar disponibilidad basada en stock
-- ============================================
CREATE OR REPLACE FUNCTION public.update_product_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el producto rastrea inventario y el stock llega a 0, marcarlo como no disponible
    IF NEW.track_inventory = true AND NEW.stock_quantity <= 0 THEN
        NEW.is_available := false;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar disponibilidad automáticamente
DROP TRIGGER IF EXISTS trigger_update_product_availability ON public.products;
CREATE TRIGGER trigger_update_product_availability
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    WHEN (OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity OR OLD.track_inventory IS DISTINCT FROM NEW.track_inventory)
    EXECUTE FUNCTION public.update_product_availability();

-- ============================================
-- Función: Reducir stock al crear orden
-- ============================================
CREATE OR REPLACE FUNCTION public.reduce_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
    product_record RECORD;
BEGIN
    -- Obtener información del producto
    SELECT id, track_inventory, stock_quantity, name
    INTO product_record
    FROM public.products
    WHERE id = NEW.product_id;

    -- Si el producto rastrea inventario, reducir el stock
    IF product_record.track_inventory = true THEN
        UPDATE public.products
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.product_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para reducir stock cuando se crea un item de orden
DROP TRIGGER IF EXISTS trigger_reduce_stock_on_order ON public.order_items;
CREATE TRIGGER trigger_reduce_stock_on_order
    AFTER INSERT ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.reduce_stock_on_order();

-- ============================================
-- Función: Restaurar stock al cancelar orden
-- ============================================
CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
RETURNS TRIGGER AS $$
DECLARE
    item_record RECORD;
    product_record RECORD;
BEGIN
    -- Solo restaurar si el estado cambia a 'cancelled'
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        -- Iterar sobre los items de la orden
        FOR item_record IN
            SELECT product_id, quantity
            FROM public.order_items
            WHERE order_id = NEW.id
        LOOP
            -- Verificar si el producto rastrea inventario
            SELECT track_inventory INTO product_record
            FROM public.products
            WHERE id = item_record.product_id;

            -- Restaurar stock si aplica
            IF product_record.track_inventory = true THEN
                UPDATE public.products
                SET stock_quantity = stock_quantity + item_record.quantity,
                    is_available = true
                WHERE id = item_record.product_id;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para restaurar stock al cancelar orden
DROP TRIGGER IF EXISTS trigger_restore_stock_on_cancel ON public.orders;
CREATE TRIGGER trigger_restore_stock_on_cancel
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.restore_stock_on_cancel();

-- ============================================
-- Tabla: inventory_movements (Movimientos de inventario)
-- ============================================
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    quantity_change INTEGER NOT NULL, -- Positivo para entrada, negativo para salida
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('manual_adjustment', 'order', 'order_cancelled', 'restock', 'return', 'damage', 'other')),
    reference_id UUID, -- ID de orden u otra referencia
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para inventory_movements
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_store ON public.inventory_movements(store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON public.inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON public.inventory_movements(created_at DESC);

-- RLS para inventory_movements
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Propietarios pueden ver movimientos de su tienda
CREATE POLICY "Owners can view their inventory movements" ON public.inventory_movements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = inventory_movements.store_id
            AND stores.user_id = auth.uid()
        )
    );

-- Propietarios pueden crear movimientos
CREATE POLICY "Owners can create inventory movements" ON public.inventory_movements
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = inventory_movements.store_id
            AND stores.user_id = auth.uid()
        )
    );

-- ============================================
-- Función: Registrar movimiento de inventario
-- ============================================
CREATE OR REPLACE FUNCTION public.log_inventory_movement()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo registrar si el stock cambió y el producto rastrea inventario
    IF OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity AND NEW.track_inventory = true THEN
        INSERT INTO public.inventory_movements (
            product_id,
            store_id,
            quantity_change,
            previous_quantity,
            new_quantity,
            movement_type,
            notes
        ) VALUES (
            NEW.id,
            NEW.store_id,
            NEW.stock_quantity - OLD.stock_quantity,
            OLD.stock_quantity,
            NEW.stock_quantity,
            'manual_adjustment',
            'Ajuste manual de inventario'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar movimientos de inventario
DROP TRIGGER IF EXISTS trigger_log_inventory_movement ON public.products;
CREATE TRIGGER trigger_log_inventory_movement
    AFTER UPDATE ON public.products
    FOR EACH ROW
    WHEN (OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity)
    EXECUTE FUNCTION public.log_inventory_movement();

-- ============================================
-- Vista: Productos con stock bajo
-- ============================================
CREATE OR REPLACE VIEW public.low_stock_products AS
SELECT
    p.id,
    p.store_id,
    p.name,
    p.sku,
    p.stock_quantity,
    p.low_stock_threshold,
    p.image_url,
    s.business_name as store_name,
    s.email as store_email
FROM public.products p
JOIN public.stores s ON s.id = p.store_id
WHERE p.track_inventory = true
    AND p.stock_quantity <= p.low_stock_threshold
    AND p.stock_quantity > 0
ORDER BY p.stock_quantity ASC;

-- ============================================
-- Vista: Productos sin stock
-- ============================================
CREATE OR REPLACE VIEW public.out_of_stock_products AS
SELECT
    p.id,
    p.store_id,
    p.name,
    p.sku,
    p.stock_quantity,
    p.image_url,
    s.business_name as store_name,
    s.email as store_email
FROM public.products p
JOIN public.stores s ON s.id = p.store_id
WHERE p.track_inventory = true
    AND p.stock_quantity <= 0
ORDER BY p.name ASC;
