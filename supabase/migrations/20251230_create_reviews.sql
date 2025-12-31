-- ============================================
-- MIGRACIÓN: Crear tabla de reviews/calificaciones
-- Fecha: 2024-12-30
-- ============================================

-- Tabla de reviews de productos
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,  -- Opcional: vincular a orden

    -- Información del reviewer
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,

    -- Review
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),  -- 1-5 estrellas
    title TEXT,                                                    -- Título opcional
    comment TEXT,                                                  -- Comentario opcional

    -- Moderación
    is_approved BOOLEAN DEFAULT false,   -- Requiere aprobación del vendedor
    is_visible BOOLEAN DEFAULT true,     -- El vendedor puede ocultar

    -- Respuesta del vendedor
    seller_response TEXT,
    seller_response_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Un cliente solo puede dejar una review por producto por orden
    UNIQUE(product_id, customer_email, order_id)
);

-- Agregar campos de estadísticas a products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2, 1) DEFAULT 0;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;

-- Índices
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_email ON public.reviews(customer_email);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON public.reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_average_rating ON public.products(average_rating DESC);

-- Habilitar RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para reviews

-- Público puede ver reviews aprobadas y visibles
CREATE POLICY "Public can view approved reviews" ON public.reviews
    FOR SELECT USING (is_approved = true AND is_visible = true);

-- Propietarios pueden ver todas las reviews de sus productos
CREATE POLICY "Owners can view all reviews of their products" ON public.reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.products
            JOIN public.stores ON stores.id = products.store_id
            WHERE products.id = reviews.product_id
            AND stores.user_id = auth.uid()
        )
    );

-- Cualquiera puede crear reviews (verificación por email en frontend)
CREATE POLICY "Anyone can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (true);

-- Propietarios pueden aprobar/responder reviews de sus productos
CREATE POLICY "Owners can update reviews of their products" ON public.reviews
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.products
            JOIN public.stores ON stores.id = products.store_id
            WHERE products.id = reviews.product_id
            AND stores.user_id = auth.uid()
        )
    );

-- Propietarios pueden eliminar reviews de sus productos
CREATE POLICY "Owners can delete reviews of their products" ON public.reviews
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.products
            JOIN public.stores ON stores.id = products.store_id
            WHERE products.id = reviews.product_id
            AND stores.user_id = auth.uid()
        )
    );

-- Función para actualizar estadísticas de producto
CREATE OR REPLACE FUNCTION public.update_product_review_stats()
RETURNS TRIGGER AS $$
DECLARE
    product_uuid UUID;
    avg_rating DECIMAL(2, 1);
    total_reviews INTEGER;
BEGIN
    -- Determinar el product_id afectado
    IF TG_OP = 'DELETE' THEN
        product_uuid := OLD.product_id;
    ELSE
        product_uuid := NEW.product_id;
    END IF;

    -- Calcular nuevas estadísticas (solo reviews aprobadas)
    SELECT
        COALESCE(AVG(rating)::DECIMAL(2, 1), 0),
        COUNT(*)
    INTO avg_rating, total_reviews
    FROM public.reviews
    WHERE product_id = product_uuid
    AND is_approved = true;

    -- Actualizar producto
    UPDATE public.products
    SET
        average_rating = avg_rating,
        reviews_count = total_reviews,
        updated_at = timezone('utc'::text, now())
    WHERE id = product_uuid;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar estadísticas
DROP TRIGGER IF EXISTS trigger_update_product_review_stats_insert ON public.reviews;
CREATE TRIGGER trigger_update_product_review_stats_insert
    AFTER INSERT ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_product_review_stats();

DROP TRIGGER IF EXISTS trigger_update_product_review_stats_update ON public.reviews;
CREATE TRIGGER trigger_update_product_review_stats_update
    AFTER UPDATE OF is_approved, rating ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_product_review_stats();

DROP TRIGGER IF EXISTS trigger_update_product_review_stats_delete ON public.reviews;
CREATE TRIGGER trigger_update_product_review_stats_delete
    AFTER DELETE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_product_review_stats();

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Comentarios
COMMENT ON TABLE public.reviews IS 'Reviews y calificaciones de productos';
COMMENT ON COLUMN public.reviews.is_approved IS 'Las reviews requieren aprobación del vendedor para ser públicas';
COMMENT ON COLUMN public.reviews.seller_response IS 'Respuesta opcional del vendedor a la review';
COMMENT ON COLUMN public.products.average_rating IS 'Promedio de calificaciones (1-5), calculado automáticamente';
COMMENT ON COLUMN public.products.reviews_count IS 'Número total de reviews aprobadas, calculado automáticamente';
