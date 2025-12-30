-- ============================================
-- E-VENDIFY - STORAGE BUCKET PARA IMAGENES
-- Ejecutar en SQL Editor de Supabase
-- ============================================

-- 1. Crear bucket para imagenes de tiendas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-images',
  'store-images',
  true,  -- Publico para que las imagenes sean accesibles
  5242880,  -- 5MB limite
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Politica: Cualquiera puede ver imagenes (son publicas)
CREATE POLICY "Public can view store images"
ON storage.objects FOR SELECT
USING (bucket_id = 'store-images');

-- 3. Politica: Usuarios autenticados pueden subir imagenes a su carpeta
CREATE POLICY "Users can upload images to their folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'store-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Politica: Usuarios pueden actualizar sus propias imagenes
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'store-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Politica: Usuarios pueden eliminar sus propias imagenes
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'store-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- NOTAS:
-- - Las imagenes se organizan por usuario: {user_id}/products/{filename}
-- - Las imagenes son publicas para mostrar en la tienda
-- - Solo el propietario puede subir/editar/eliminar
-- ============================================
