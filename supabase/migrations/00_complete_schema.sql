-- ============================================
-- E-VENDIFY - MIGRACION COMPLETA
-- Ejecutar en SQL Editor de Supabase
-- ============================================

-- ============================================
-- 1. TABLA: stores (Tiendas)
-- ============================================
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    business_name TEXT,
    owner TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    description TEXT,
    website TEXT,
    logo_url TEXT,
    category TEXT,
    registered_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    is_active BOOLEAN DEFAULT true,
    products_count INTEGER DEFAULT 0,
    monthly_revenue DECIMAL(10, 2) DEFAULT 0,
    last_login TIMESTAMP WITH TIME ZONE,
    plan TEXT DEFAULT 'basic' CHECK (plan IN ('basic', 'premium')),
    theme TEXT DEFAULT 'modern',
    slug TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indice para busqueda por usuario
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores(status);

-- ============================================
-- 2. TABLA: products (Productos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    category TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indices para products
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);

-- ============================================
-- 3. TABLA: orders (Ordenes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    total_amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
    payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indice para orders
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- ============================================
-- 4. TABLA: order_items (Items de Orden)
-- ============================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indice para order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- ============================================
-- 5. TABLA: admin_users (Administradores)
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);

-- ============================================
-- 6. HABILITAR ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. POLITICAS RLS - STORES
-- ============================================

-- Publico puede ver tiendas activas
CREATE POLICY "Public can view active stores" ON public.stores
    FOR SELECT USING (is_active = true AND status = 'active');

-- Propietarios pueden ver sus tiendas
CREATE POLICY "Owners can view their own stores" ON public.stores
    FOR SELECT USING (auth.uid() = user_id);

-- Propietarios pueden crear tiendas
CREATE POLICY "Owners can insert their own stores" ON public.stores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Propietarios pueden actualizar sus tiendas
CREATE POLICY "Owners can update their own stores" ON public.stores
    FOR UPDATE USING (auth.uid() = user_id);

-- Propietarios pueden eliminar sus tiendas
CREATE POLICY "Owners can delete their own stores" ON public.stores
    FOR DELETE USING (auth.uid() = user_id);

-- Admins pueden ver todas las tiendas
CREATE POLICY "Admins can view all stores" ON public.stores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- ============================================
-- 8. POLITICAS RLS - PRODUCTS
-- ============================================

-- Publico puede ver productos disponibles de tiendas activas
CREATE POLICY "Public can view available products" ON public.products
    FOR SELECT USING (
        is_available = true AND
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = products.store_id
            AND stores.is_active = true
        )
    );

-- Propietarios pueden ver todos sus productos
CREATE POLICY "Owners can view their own products" ON public.products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = products.store_id
            AND stores.user_id = auth.uid()
        )
    );

-- Propietarios pueden crear productos
CREATE POLICY "Owners can insert products" ON public.products
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = products.store_id
            AND stores.user_id = auth.uid()
        )
    );

-- Propietarios pueden actualizar sus productos
CREATE POLICY "Owners can update their own products" ON public.products
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = products.store_id
            AND stores.user_id = auth.uid()
        )
    );

-- Propietarios pueden eliminar sus productos
CREATE POLICY "Owners can delete their own products" ON public.products
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = products.store_id
            AND stores.user_id = auth.uid()
        )
    );

-- ============================================
-- 9. POLITICAS RLS - ORDERS
-- ============================================

-- Cualquiera puede crear ordenes (checkout publico)
CREATE POLICY "Anyone can create orders" ON public.orders
    FOR INSERT WITH CHECK (true);

-- Comerciantes pueden ver ordenes de sus tiendas
CREATE POLICY "Merchants can view orders for their stores" ON public.orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = orders.store_id
            AND stores.user_id = auth.uid()
        )
    );

-- Comerciantes pueden actualizar ordenes de sus tiendas
CREATE POLICY "Merchants can update orders for their stores" ON public.orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = orders.store_id
            AND stores.user_id = auth.uid()
        )
    );

-- ============================================
-- 10. POLITICAS RLS - ORDER_ITEMS
-- ============================================

-- Cualquiera puede crear items de orden (checkout publico)
CREATE POLICY "Anyone can create order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

-- Comerciantes pueden ver items de sus ordenes
CREATE POLICY "Merchants can view order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders
            JOIN public.stores ON stores.id = orders.store_id
            WHERE orders.id = order_items.order_id
            AND stores.user_id = auth.uid()
        )
    );

-- ============================================
-- 11. POLITICAS RLS - ADMIN_USERS
-- ============================================

-- Solo admins pueden ver la tabla de admins
CREATE POLICY "Admins can view admin_users" ON public.admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

-- ============================================
-- 12. FUNCION: Actualizar updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_stores_updated_at ON public.stores;
CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON public.stores
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 13. FUNCION: Actualizar contador de productos
-- ============================================
CREATE OR REPLACE FUNCTION public.update_store_products_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.stores
        SET products_count = products_count + 1
        WHERE id = NEW.store_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.stores
        SET products_count = products_count - 1
        WHERE id = OLD.store_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_store_products_count ON public.products;
CREATE TRIGGER trigger_update_store_products_count
    AFTER INSERT OR DELETE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_store_products_count();

-- ============================================
-- 14. FUNCION: Generar slug unico
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_slug(name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convertir a minusculas y reemplazar espacios con guiones
    base_slug := lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'));
    -- Remover guiones al inicio y final
    base_slug := trim(both '-' from base_slug);

    final_slug := base_slug;

    -- Verificar unicidad y agregar numero si es necesario
    WHILE EXISTS (SELECT 1 FROM public.stores WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;

    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar slug automaticamente
CREATE OR REPLACE FUNCTION public.set_store_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := public.generate_slug(NEW.name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_store_slug ON public.stores;
CREATE TRIGGER trigger_set_store_slug
    BEFORE INSERT ON public.stores
    FOR EACH ROW EXECUTE FUNCTION public.set_store_slug();

-- ============================================
-- FIN DE LA MIGRACION
-- ============================================
