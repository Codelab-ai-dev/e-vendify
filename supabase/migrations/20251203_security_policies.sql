-- Enable RLS on tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- STORES POLICIES

-- 1. Public can view active stores
CREATE POLICY "Public can view active stores"
ON stores FOR SELECT
USING (is_active = true);

-- 2. Owners can view their own stores (even if inactive)
CREATE POLICY "Owners can view their own stores"
ON stores FOR SELECT
USING (auth.uid() = user_id);

-- 3. Owners can insert their own stores
CREATE POLICY "Owners can insert their own stores"
ON stores FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Owners can update their own stores
CREATE POLICY "Owners can update their own stores"
ON stores FOR UPDATE
USING (auth.uid() = user_id);

-- 5. Owners can delete their own stores
CREATE POLICY "Owners can delete their own stores"
ON stores FOR DELETE
USING (auth.uid() = user_id);


-- PRODUCTS POLICIES

-- 1. Public can view available products from active stores
CREATE POLICY "Public can view available products"
ON products FOR SELECT
USING (
  is_available = true AND
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = products.store_id
    AND stores.is_active = true
  )
);

-- 2. Owners can view all their products
CREATE POLICY "Owners can view their own products"
ON products FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = products.store_id
    AND stores.user_id = auth.uid()
  )
);

-- 3. Owners can insert products into their own stores
CREATE POLICY "Owners can insert products"
ON products FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = products.store_id
    AND stores.user_id = auth.uid()
  )
);

-- 4. Owners can update their own products
CREATE POLICY "Owners can update their own products"
ON products FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = products.store_id
    AND stores.user_id = auth.uid()
  )
);

-- 5. Owners can delete their own products
CREATE POLICY "Owners can delete their own products"
ON products FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = products.store_id
    AND stores.user_id = auth.uid()
  )
);
