-- ============================================
-- MIGRACIÓN: Crear tabla de cupones/descuentos
-- Fecha: 2024-12-30
-- ============================================

-- Tabla de cupones
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

    -- Información del cupón
    code TEXT NOT NULL,                          -- Código del cupón (ej: VERANO20)
    description TEXT,                            -- Descripción opcional

    -- Tipo y valor del descuento
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL,      -- Porcentaje (0-100) o monto fijo

    -- Restricciones
    min_purchase_amount DECIMAL(10, 2),          -- Monto mínimo de compra
    max_discount_amount DECIMAL(10, 2),          -- Descuento máximo (para porcentajes)
    max_uses INTEGER,                            -- Usos máximos totales (NULL = ilimitado)
    max_uses_per_customer INTEGER DEFAULT 1,    -- Usos por cliente
    current_uses INTEGER DEFAULT 0,              -- Contador de usos actuales

    -- Vigencia
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMP WITH TIME ZONE,         -- NULL = no expira

    -- Estado
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- El código debe ser único por tienda
    UNIQUE(store_id, code)
);

-- Tabla para tracking de uso de cupones
CREATE TABLE IF NOT EXISTS public.coupon_uses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_email TEXT NOT NULL,
    discount_applied DECIMAL(10, 2) NOT NULL,    -- Monto real descontado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Agregar referencia de cupón a orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- Índices
CREATE INDEX IF NOT EXISTS idx_coupons_store_id ON public.coupons(store_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_coupon_id ON public.coupon_uses(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_customer_email ON public.coupon_uses(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON public.orders(coupon_id);

-- Habilitar RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;

-- Políticas para coupons

-- Propietarios pueden ver sus cupones
CREATE POLICY "Owners can view their coupons" ON public.coupons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = coupons.store_id
            AND stores.user_id = auth.uid()
        )
    );

-- Propietarios pueden crear cupones
CREATE POLICY "Owners can create coupons" ON public.coupons
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = coupons.store_id
            AND stores.user_id = auth.uid()
        )
    );

-- Propietarios pueden actualizar sus cupones
CREATE POLICY "Owners can update their coupons" ON public.coupons
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = coupons.store_id
            AND stores.user_id = auth.uid()
        )
    );

-- Propietarios pueden eliminar sus cupones
CREATE POLICY "Owners can delete their coupons" ON public.coupons
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = coupons.store_id
            AND stores.user_id = auth.uid()
        )
    );

-- Público puede verificar cupones (solo activos y vigentes)
CREATE POLICY "Public can verify active coupons" ON public.coupons
    FOR SELECT USING (
        is_active = true
        AND (expires_at IS NULL OR expires_at > now())
        AND starts_at <= now()
    );

-- Políticas para coupon_uses

-- Propietarios pueden ver usos de sus cupones
CREATE POLICY "Owners can view coupon uses" ON public.coupon_uses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.coupons
            JOIN public.stores ON stores.id = coupons.store_id
            WHERE coupons.id = coupon_uses.coupon_id
            AND stores.user_id = auth.uid()
        )
    );

-- Sistema puede registrar uso de cupones (checkout)
CREATE POLICY "System can create coupon uses" ON public.coupon_uses
    FOR INSERT WITH CHECK (true);

-- Función para incrementar el contador de usos
CREATE OR REPLACE FUNCTION public.increment_coupon_uses()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.coupons
    SET current_uses = current_uses + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = NEW.coupon_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_coupon_uses ON public.coupon_uses;
CREATE TRIGGER trigger_increment_coupon_uses
    AFTER INSERT ON public.coupon_uses
    FOR EACH ROW EXECUTE FUNCTION public.increment_coupon_uses();

-- Trigger para updated_at en coupons
DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Comentarios
COMMENT ON TABLE public.coupons IS 'Cupones de descuento por tienda';
COMMENT ON TABLE public.coupon_uses IS 'Registro de uso de cupones';
COMMENT ON COLUMN public.coupons.discount_type IS 'percentage = porcentaje (0-100), fixed = monto fijo';
COMMENT ON COLUMN public.orders.coupon_id IS 'Cupón aplicado a la orden';
COMMENT ON COLUMN public.orders.discount_amount IS 'Monto total del descuento aplicado';
