-- Test para verificar la función generate_slug en PostgreSQL
-- Ejecutar después de aplicar add-slug-to-stores.sql

-- Crear la función si no existe (copia de la función corregida)
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- Verificar que el input no sea nulo o vacío
  IF input_text IS NULL OR TRIM(input_text) = '' THEN
    RETURN 'tienda-' || EXTRACT(EPOCH FROM NOW())::TEXT;
  END IF;
  
  -- Procesar el texto paso a paso
  result := LOWER(TRIM(input_text));
  
  -- Reemplazar caracteres especiales del español
  result := REGEXP_REPLACE(result, '[áàäâ]', 'a', 'g');
  result := REGEXP_REPLACE(result, '[éèëê]', 'e', 'g');
  result := REGEXP_REPLACE(result, '[íìïî]', 'i', 'g');
  result := REGEXP_REPLACE(result, '[óòöô]', 'o', 'g');
  result := REGEXP_REPLACE(result, '[úùüû]', 'u', 'g');
  result := REGEXP_REPLACE(result, 'ñ', 'n', 'g');
  result := REGEXP_REPLACE(result, 'ç', 'c', 'g');
  
  -- Eliminar caracteres especiales pero mantener letras, números, espacios y guiones
  result := REGEXP_REPLACE(result, '[^a-z0-9\s-]', '', 'g');
  
  -- Reemplazar espacios múltiples con uno solo
  result := REGEXP_REPLACE(result, '\s+', ' ', 'g');
  
  -- Reemplazar espacios con guiones
  result := REGEXP_REPLACE(result, '\s', '-', 'g');
  
  -- Eliminar guiones múltiples
  result := REGEXP_REPLACE(result, '-+', '-', 'g');
  
  -- Eliminar guiones al inicio y final
  result := REGEXP_REPLACE(result, '^-+|-+$', '', 'g');
  
  -- Si el resultado está vacío o es muy corto, usar un fallback
  IF result IS NULL OR LENGTH(result) < 2 THEN
    result := 'tienda-' || EXTRACT(EPOCH FROM NOW())::TEXT;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Pruebas de la función
SELECT 
  'Test de generación de slugs:' as info;

SELECT 
  input_name,
  generate_slug(input_name) as generated_slug,
  LENGTH(generate_slug(input_name)) as slug_length
FROM (
  VALUES 
    ('Panadería San José'),
    ('Café El Rincón'),
    ('Tienda de María & Cía.'),
    ('Supermercado Los Andes'),
    ('Restaurante La Fogata'),
    ('Restaurante El Sabor'),
    ('123 Store'),
    ('A'),
    (''),
    (NULL),
    ('Store with lots of !@#$%^&*() symbols'),
    ('   Tienda   con   espacios   múltiples   ')
) AS test_data(input_name);

-- Verificar que no hay slugs duplicados en una muestra
WITH test_slugs AS (
  SELECT 
    input_name,
    generate_slug(input_name) as slug
  FROM (
    VALUES 
      ('Panadería San José'),
      ('Panaderia San Jose'),
      ('Panadería San José 2'),
      ('Café El Rincón'),
      ('Cafe El Rincon')
  ) AS test_data(input_name)
)
SELECT 
  'Verificación de duplicados:' as info,
  COUNT(*) as total_tests,
  COUNT(DISTINCT slug) as unique_slugs,
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT slug) THEN 'PASS - No hay duplicados'
    ELSE 'FAIL - Hay slugs duplicados'
  END as result
FROM test_slugs;
