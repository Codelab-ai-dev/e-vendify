-- Políticas RLS para la tabla stores
-- Este archivo configura las políticas de seguridad a nivel de fila para la tabla stores

-- PASO 1: Habilitar RLS en la tabla stores
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- PASO 2: Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Public can view active stores" ON stores;
DROP POLICY IF EXISTS "Users can view their own store" ON stores;
DROP POLICY IF EXISTS "Users can insert their own store" ON stores;
DROP POLICY IF EXISTS "Users can update their own store" ON stores;
DROP POLICY IF EXISTS "Admins can view all stores" ON stores;
DROP POLICY IF EXISTS "Admins can manage all stores" ON stores;

-- PASO 3: Crear políticas de acceso público y usuarios

-- ACCESO PÚBLICO: Cualquiera puede ver tiendas activas (para páginas públicas)
CREATE POLICY "Public can view active stores" ON stores
  FOR SELECT USING (
    is_active = true AND status = 'active'
  );

-- Los usuarios pueden ver su propia tienda (para dashboard)
CREATE POLICY "Users can view their own store" ON stores
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Los usuarios pueden insertar su propia tienda (para registro)
CREATE POLICY "Users can insert their own store" ON stores
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Los usuarios pueden actualizar su propia tienda
CREATE POLICY "Users can update their own store" ON stores
  FOR UPDATE USING (
    auth.uid() = user_id
  ) WITH CHECK (
    auth.uid() = user_id
  );

-- PASO 4: Crear políticas para administradores

-- Los admins pueden ver todas las tiendas
CREATE POLICY "Admins can view all stores" ON stores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Los admins pueden hacer todo con las tiendas (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage all stores" ON stores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- PASO 5: Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'stores';
