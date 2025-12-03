-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    total_amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
    payment_id TEXT, -- MercadoPago Payment ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create order items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL, -- Snapshot of name in case product is deleted
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL, -- Snapshot of price at time of purchase
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policies for Orders

-- Merchants can view orders for their stores
CREATE POLICY "Merchants can view orders for their stores" ON public.orders
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE public.stores.id = public.orders.store_id
            AND public.stores.user_id = auth.uid()
        )
    );

-- Merchants can update status of their orders
CREATE POLICY "Merchants can update orders for their stores" ON public.orders
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE public.stores.id = public.orders.store_id
            AND public.stores.user_id = auth.uid()
        )
    );

-- Anyone can create an order (public checkout)
CREATE POLICY "Anyone can create orders" ON public.orders
    FOR INSERT
    WITH CHECK (true);

-- Policies for Order Items

-- Merchants can view items for their orders
CREATE POLICY "Merchants can view order items" ON public.order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            JOIN public.stores ON public.stores.id = public.orders.store_id
            WHERE public.orders.id = public.order_items.order_id
            AND public.stores.user_id = auth.uid()
        )
    );

-- Anyone can insert order items (public checkout)
CREATE POLICY "Anyone can create order items" ON public.order_items
    FOR INSERT
    WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
