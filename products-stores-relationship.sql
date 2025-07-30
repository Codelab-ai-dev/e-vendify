-- Script para establecer la relación entre products y stores
-- Este script actualiza la tabla products para relacionarla correctamente con stores

-- PASO 1: Verificar estructura actual de products y hacer respaldo
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
        -- Crear respaldo de products si tiene datos
        IF (SELECT COUNT(*) FROM products) > 0 THEN
            DROP TABLE IF EXISTS products_backup;
            CREATE TABLE products_backup AS SELECT * FROM products;
            RAISE NOTICE 'Respaldo creado: products_backup con % registros', (SELECT COUNT(*) FROM products_backup);
        END IF;
    END IF;
END $$;

-- PASO 2: Actualizar tabla products para relacionarla con stores
-- Si la tabla products ya existe, la modificamos; si no, la creamos

-- Verificar si products existe y tiene la columna store_id
DO $$
BEGIN
    -- Si la tabla products no existe, la creamos
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
        CREATE TABLE products (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL DEFAULT 0,
            image_url TEXT,
            category TEXT,
            is_available BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabla products creada con relación a stores';
    ELSE
        -- Si existe, verificar y agregar store_id si no existe
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'store_id'
        ) THEN
            -- Agregar columna store_id
            ALTER TABLE products ADD COLUMN store_id UUID;
            RAISE NOTICE 'Columna store_id agregada a products';
            
            -- Si había una columna business_id, migrar los datos
            IF EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'products' AND column_name = 'business_id'
            ) THEN
                -- Migrar business_id a store_id usando la relación user_id
                UPDATE products 
                SET store_id = (
                    SELECT s.id 
                    FROM stores s 
                    WHERE s.user_id = products.business_id
                    LIMIT 1
                );
                RAISE NOTICE 'Datos migrados de business_id a store_id';
                
                -- Eliminar columna business_id después de la migración
                ALTER TABLE products DROP COLUMN business_id;
                RAISE NOTICE 'Columna business_id eliminada';
            END IF;
            
            -- Hacer store_id NOT NULL y agregar foreign key
            ALTER TABLE products ALTER COLUMN store_id SET NOT NULL;
            ALTER TABLE products ADD CONSTRAINT fk_products_store 
                FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
            RAISE NOTICE 'Restricción de clave foránea agregada';
        ELSE
            RAISE NOTICE 'La tabla products ya tiene la columna store_id';
        END IF;
    END IF;
END $$;

-- PASO 3: Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- PASO 4: Crear trigger para actualizar updated_at en products
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- PASO 5: Habilitar RLS en products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- PASO 6: Crear políticas de seguridad para products
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Admins can view all products" ON products;
DROP POLICY IF EXISTS "Store owners can view their products" ON products;
DROP POLICY IF EXISTS "Store owners can insert their products" ON products;
DROP POLICY IF EXISTS "Store owners can update their products" ON products;
DROP POLICY IF EXISTS "Store owners can delete their products" ON products;
DROP POLICY IF EXISTS "Admins can manage all products" ON products;

-- Los admins pueden ver todos los productos
CREATE POLICY "Admins can view all products" ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Los propietarios de tienda pueden ver sus propios productos
CREATE POLICY "Store owners can view their products" ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE id = products.store_id AND user_id = auth.uid()
    )
  );

-- Los propietarios pueden insertar productos en su tienda
CREATE POLICY "Store owners can insert their products" ON products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE id = products.store_id AND user_id = auth.uid()
    )
  );

-- Los propietarios pueden actualizar sus productos
CREATE POLICY "Store owners can update their products" ON products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE id = products.store_id AND user_id = auth.uid()
    )
  );

-- Los propietarios pueden eliminar sus productos
CREATE POLICY "Store owners can delete their products" ON products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE id = products.store_id AND user_id = auth.uid()
    )
  );

-- Los admins pueden hacer todo con products
CREATE POLICY "Admins can manage all products" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- PASO 7: Crear función para actualizar products_count en stores automáticamente
CREATE OR REPLACE FUNCTION update_store_products_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar contador cuando se inserta un producto
    IF TG_OP = 'INSERT' THEN
        UPDATE stores 
        SET products_count = (
            SELECT COUNT(*) FROM products WHERE store_id = NEW.store_id
        ),
        updated_at = NOW()
        WHERE id = NEW.store_id;
        RETURN NEW;
    END IF;
    
    -- Actualizar contador cuando se elimina un producto
    IF TG_OP = 'DELETE' THEN
        UPDATE stores 
        SET products_count = (
            SELECT COUNT(*) FROM products WHERE store_id = OLD.store_id
        ),
        updated_at = NOW()
        WHERE id = OLD.store_id;
        RETURN OLD;
    END IF;
    
    -- Actualizar contador cuando se cambia de tienda
    IF TG_OP = 'UPDATE' AND OLD.store_id != NEW.store_id THEN
        -- Actualizar tienda anterior
        UPDATE stores 
        SET products_count = (
            SELECT COUNT(*) FROM products WHERE store_id = OLD.store_id
        ),
        updated_at = NOW()
        WHERE id = OLD.store_id;
        
        -- Actualizar tienda nueva
        UPDATE stores 
        SET products_count = (
            SELECT COUNT(*) FROM products WHERE store_id = NEW.store_id
        ),
        updated_at = NOW()
        WHERE id = NEW.store_id;
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 8: Crear triggers para mantener products_count actualizado
DROP TRIGGER IF EXISTS trigger_update_store_products_count ON products;
CREATE TRIGGER trigger_update_store_products_count
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_store_products_count();

-- PASO 9: Actualizar products_count existente en stores
UPDATE stores 
SET products_count = (
    SELECT COUNT(*) 
    FROM products 
    WHERE store_id = stores.id
),
updated_at = NOW();

-- PASO 10: Insertar productos de ejemplo si no hay datos
INSERT INTO products (store_id, name, description, price, category, is_available)
SELECT 
    s.id as store_id,
    sample_products.name,
    sample_products.description,
    sample_products.price,
    sample_products.category,
    sample_products.is_available
FROM stores s
CROSS JOIN (
    VALUES 
        ('Pan Integral', 'Pan integral artesanal horneado diariamente', 3500, 'Panadería', true),
        ('Croissant', 'Croissant francés con mantequilla', 2800, 'Panadería', true),
        ('Leche Entera', 'Leche entera fresca 1 litro', 4200, 'Lácteos', true),
        ('Manzanas Rojas', 'Manzanas rojas frescas por kilo', 6800, 'Frutas', true),
        ('Carne de Res', 'Carne de res premium por kilo', 28000, 'Carnes', true),
        ('Pollo Entero', 'Pollo entero fresco', 15000, 'Carnes', true),
        ('Bandeja Paisa', 'Plato típico colombiano completo', 18000, 'Comida', true),
        ('Sancocho', 'Sancocho tradicional para 2 personas', 25000, 'Comida', true)
) AS sample_products(name, description, price, category, is_available)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE store_id = s.id)
AND s.name IN ('Panadería San José', 'Tienda Don Carlos', 'Carnicería El Buen Corte', 'Restaurante Mi Sabor')
LIMIT 20; -- Limitar a 20 productos de ejemplo

-- PASO 11: Verificar la relación
SELECT 
    'Relación products-stores establecida' as resultado,
    (SELECT COUNT(*) FROM products) as total_productos,
    (SELECT COUNT(*) FROM stores) as total_tiendas,
    (SELECT COUNT(DISTINCT store_id) FROM products) as tiendas_con_productos;

-- PASO 12: Mostrar resumen por tienda
SELECT 
    s.name as tienda,
    s.category as categoria_tienda,
    COUNT(p.id) as productos,
    COALESCE(AVG(p.price), 0)::DECIMAL(10,2) as precio_promedio,
    s.products_count as contador_actualizado
FROM stores s
LEFT JOIN products p ON s.id = p.store_id
GROUP BY s.id, s.name, s.category, s.products_count
ORDER BY productos DESC;
