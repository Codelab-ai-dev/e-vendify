-- Script para corregir slugs incompletos como "ruteria-a-speranza"
-- Este script mejora la función de generación de slugs para preservar palabras completas

-- PASO 1: Función mejorada que preserva palabras completas
CREATE OR REPLACE FUNCTION generate_complete_slug(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
  word TEXT;
  words TEXT[];
  clean_words TEXT[];
  i INTEGER;
BEGIN
  -- Verificar input
  IF input_text IS NULL OR TRIM(input_text) = '' THEN
    RETURN 'tienda-' || ROUND(EXTRACT(EPOCH FROM NOW()));
  END IF;
  
  -- Convertir a minúsculas y limpiar
  result := LOWER(TRIM(input_text));
  
  -- Reemplazar caracteres especiales del español ANTES de procesar palabras
  result := REPLACE(result, 'á', 'a');
  result := REPLACE(result, 'à', 'a');
  result := REPLACE(result, 'ä', 'a');
  result := REPLACE(result, 'â', 'a');
  result := REPLACE(result, 'é', 'e');
  result := REPLACE(result, 'è', 'e');
  result := REPLACE(result, 'ë', 'e');
  result := REPLACE(result, 'ê', 'e');
  result := REPLACE(result, 'í', 'i');
  result := REPLACE(result, 'ì', 'i');
  result := REPLACE(result, 'ï', 'i');
  result := REPLACE(result, 'î', 'i');
  result := REPLACE(result, 'ó', 'o');
  result := REPLACE(result, 'ò', 'o');
  result := REPLACE(result, 'ö', 'o');
  result := REPLACE(result, 'ô', 'o');
  result := REPLACE(result, 'ú', 'u');
  result := REPLACE(result, 'ù', 'u');
  result := REPLACE(result, 'ü', 'u');
  result := REPLACE(result, 'û', 'u');
  result := REPLACE(result, 'ñ', 'n');
  result := REPLACE(result, 'ç', 'c');
  
  -- Separar en palabras y procesar cada una
  words := STRING_TO_ARRAY(result, ' ');
  clean_words := ARRAY[]::TEXT[];
  
  FOR i IN 1..ARRAY_LENGTH(words, 1) LOOP
    word := words[i];
    
    -- Limpiar cada palabra individualmente
    word := REGEXP_REPLACE(word, '[^a-z0-9]', '', 'g');
    
    -- Solo agregar palabras que tengan al menos 1 carácter
    IF LENGTH(word) > 0 THEN
      clean_words := ARRAY_APPEND(clean_words, word);
    END IF;
  END LOOP;
  
  -- Unir palabras con guiones
  result := ARRAY_TO_STRING(clean_words, '-');
  
  -- Fallback si está vacío
  IF result IS NULL OR LENGTH(result) < 2 THEN
    result := 'tienda-' || ROUND(EXTRACT(EPOCH FROM NOW()));
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- PASO 2: Función para generar slugs únicos usando la función mejorada
CREATE OR REPLACE FUNCTION generate_unique_complete_slug(base_name TEXT, exclude_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
  exists_count INTEGER;
BEGIN
  -- Generar slug base con la función mejorada
  base_slug := generate_complete_slug(base_name);
  final_slug := base_slug;
  
  -- Buscar slug único
  LOOP
    -- Verificar si el slug existe
    IF exclude_id IS NULL THEN
      SELECT COUNT(*) INTO exists_count 
      FROM stores 
      WHERE slug = final_slug;
    ELSE
      SELECT COUNT(*) INTO exists_count 
      FROM stores 
      WHERE slug = final_slug AND id != exclude_id;
    END IF;
    
    -- Si no existe, usar este slug
    IF exists_count = 0 THEN
      RETURN final_slug;
    END IF;
    
    -- Si existe, probar con número al final
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
    
    -- Evitar bucle infinito
    IF counter > 1000 THEN
      RETURN base_slug || '-' || ROUND(EXTRACT(EPOCH FROM NOW()));
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- PASO 3: Probar la función con ejemplos problemáticos
SELECT 
  'Pruebas de la función mejorada:' as info;

SELECT 
  test_name,
  generate_complete_slug(test_name) as improved_slug
FROM (
  VALUES 
    ('Frutería La Esperanza'),
    ('Panadería San José'),
    ('Café El Rincón'),
    ('Tienda de María & Cía.'),
    ('Restaurante El Sabor'),
    ('Supermercado Los Andes'),
    ('Farmacia Santa María'),
    ('Librería El Estudiante')
) AS test_data(test_name);

-- PASO 4: Actualizar slugs incompletos existentes
DO $$
DECLARE
  store_record RECORD;
  new_slug TEXT;
  old_slug TEXT;
BEGIN
  RAISE NOTICE 'Iniciando corrección de slugs incompletos...';
  
  -- Iterar sobre tiendas con slugs que parecen incompletos
  FOR store_record IN 
    SELECT id, business_name, name, slug
    FROM stores 
    WHERE slug IS NOT NULL 
    AND (
      -- Slugs muy cortos (menos de 5 caracteres)
      LENGTH(slug) < 5 
      OR 
      -- Slugs que contienen palabras de 1 letra seguidas de guión
      slug ~ '-[a-z]-'
      OR
      -- Slugs que empiezan con una sola letra
      slug ~ '^[a-z]-'
    )
    ORDER BY created_at
  LOOP
    old_slug := store_record.slug;
    
    -- Generar nuevo slug con la función mejorada
    new_slug := generate_unique_complete_slug(
      COALESCE(store_record.business_name, store_record.name), 
      store_record.id
    );
    
    -- Solo actualizar si el nuevo slug es diferente y mejor
    IF new_slug != old_slug AND LENGTH(new_slug) > LENGTH(old_slug) THEN
      UPDATE stores 
      SET slug = new_slug, updated_at = NOW()
      WHERE id = store_record.id;
      
      RAISE NOTICE 'Actualizado: % -> %', old_slug, new_slug;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Corrección de slugs completada.';
END $$;

-- PASO 5: Actualizar triggers para usar la función mejorada
DROP TRIGGER IF EXISTS trigger_auto_generate_slug ON stores;
DROP TRIGGER IF EXISTS trigger_update_slug_on_name_change ON stores;

-- Función para trigger con la lógica mejorada
CREATE OR REPLACE FUNCTION auto_generate_complete_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo generar slug si no se proporciona uno o está vacío
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_unique_complete_slug(COALESCE(NEW.business_name, NEW.name), NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualización de nombres
CREATE OR REPLACE FUNCTION update_complete_slug_on_name_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Si cambió el nombre del negocio, regenerar el slug
  IF OLD.business_name != NEW.business_name OR OLD.name != NEW.name THEN
    NEW.slug := generate_unique_complete_slug(COALESCE(NEW.business_name, NEW.name), NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear triggers
CREATE TRIGGER trigger_auto_generate_slug
  BEFORE INSERT ON stores
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_complete_slug();

CREATE TRIGGER trigger_update_slug_on_name_change
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_complete_slug_on_name_change();

-- PASO 6: Verificación final
SELECT 
  'Verificación de slugs corregidos:' as info;

-- Mostrar slugs actualizados
SELECT 
  COALESCE(business_name, name) as store_name,
  slug,
  LENGTH(slug) as slug_length,
  CASE 
    WHEN LENGTH(slug) < 5 THEN 'Muy corto'
    WHEN slug ~ '-[a-z]-' THEN 'Contiene palabras de 1 letra'
    WHEN slug ~ '^[a-z]-' THEN 'Empieza con 1 letra'
    ELSE 'OK'
  END as quality_check
FROM stores 
WHERE slug IS NOT NULL
ORDER BY quality_check DESC, LENGTH(slug) ASC;
