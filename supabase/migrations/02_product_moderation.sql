-- ============================================
-- E-VENDIFY - SISTEMA DE MODERACION DE PRODUCTOS
-- Ejecutar en SQL Editor de Supabase
-- ============================================

-- 1. Agregar campos de moderación a productos
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved'
  CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged'));

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS flagged_words TEXT[];

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id);

-- 2. Índice para búsqueda por estado de moderación
CREATE INDEX IF NOT EXISTS idx_products_moderation_status
ON public.products(moderation_status);

-- 3. Actualizar política RLS para productos públicos
-- Solo mostrar productos aprobados en la tienda pública
DROP POLICY IF EXISTS "Public can view available products" ON public.products;

CREATE POLICY "Public can view approved available products" ON public.products
    FOR SELECT USING (
        is_available = true AND
        moderation_status = 'approved' AND
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = products.store_id
            AND stores.is_active = true
        )
    );

-- 4. Los propietarios pueden ver TODOS sus productos (incluyendo pendientes/rechazados)
-- Esta política ya existe, pero la recreamos para asegurarnos
DROP POLICY IF EXISTS "Owners can view their own products" ON public.products;

CREATE POLICY "Owners can view all their own products" ON public.products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = products.store_id
            AND stores.user_id = auth.uid()
        )
    );

-- 5. Crear tabla de historial de moderación (opcional pero útil)
CREATE TABLE IF NOT EXISTS public.moderation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('created', 'approved', 'rejected', 'flagged', 'appealed')),
    previous_status TEXT,
    new_status TEXT,
    reason TEXT,
    flagged_words TEXT[],
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_product_id
ON public.moderation_logs(product_id);

-- 6. RLS para moderation_logs
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver los logs de moderación
CREATE POLICY "Admins can view moderation logs" ON public.moderation_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Solo admins pueden insertar logs
CREATE POLICY "Admins can insert moderation logs" ON public.moderation_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- 7. Función para obtener productos pendientes de moderación
CREATE OR REPLACE FUNCTION public.get_pending_products()
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    price DECIMAL,
    image_url TEXT,
    category TEXT,
    store_id UUID,
    store_name TEXT,
    flagged_words TEXT[],
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.category,
        p.store_id,
        s.name as store_name,
        p.flagged_words,
        p.created_at
    FROM public.products p
    JOIN public.stores s ON s.id = p.store_id
    WHERE p.moderation_status IN ('pending', 'flagged')
    ORDER BY
        CASE WHEN p.moderation_status = 'flagged' THEN 0 ELSE 1 END,
        p.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- NOTA: Por defecto, los productos existentes quedan como 'approved'
-- Los nuevos productos empezarán como 'pending' o serán rechazados
-- automáticamente si contienen palabras prohibidas.
-- ============================================
