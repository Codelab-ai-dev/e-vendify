-- ============================================================================
-- E-VENDIFY: WhatsApp Store Code
-- Agrega código único para vincular clientes de WhatsApp a tiendas
-- ============================================================================

-- 1. Agregar campo whatsapp_code a stores
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS whatsapp_code VARCHAR(10) UNIQUE;

-- 2. Crear índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_stores_whatsapp_code
ON stores(whatsapp_code)
WHERE whatsapp_code IS NOT NULL;

-- 3. Función para generar código único
CREATE OR REPLACE FUNCTION generate_whatsapp_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  nums TEXT := '0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  -- Formato: 3 letras + 3 números (ej: ABC123)
  FOR i IN 1..3 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  FOR i IN 1..3 LOOP
    result := result || substr(nums, floor(random() * length(nums) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para auto-generar código al crear tienda
CREATE OR REPLACE FUNCTION auto_generate_whatsapp_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  attempts INTEGER := 0;
BEGIN
  -- Solo generar si no tiene código
  IF NEW.whatsapp_code IS NULL THEN
    LOOP
      new_code := generate_whatsapp_code();
      -- Verificar que no exista
      IF NOT EXISTS (SELECT 1 FROM stores WHERE whatsapp_code = new_code) THEN
        NEW.whatsapp_code := new_code;
        EXIT;
      END IF;
      attempts := attempts + 1;
      IF attempts > 100 THEN
        RAISE EXCEPTION 'No se pudo generar código único después de 100 intentos';
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger (si no existe)
DROP TRIGGER IF EXISTS trigger_auto_whatsapp_code ON stores;
CREATE TRIGGER trigger_auto_whatsapp_code
  BEFORE INSERT ON stores
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_whatsapp_code();

-- 5. Generar códigos para tiendas existentes que no tienen
UPDATE stores
SET whatsapp_code = generate_whatsapp_code()
WHERE whatsapp_code IS NULL;

-- 6. Asegurar que todos los códigos sean únicos (por si hay colisiones)
DO $$
DECLARE
  store_record RECORD;
  new_code TEXT;
BEGIN
  FOR store_record IN
    SELECT id, whatsapp_code, COUNT(*) OVER (PARTITION BY whatsapp_code) as cnt
    FROM stores
    WHERE whatsapp_code IS NOT NULL
  LOOP
    IF store_record.cnt > 1 THEN
      -- Regenerar código si hay duplicado
      LOOP
        new_code := generate_whatsapp_code();
        IF NOT EXISTS (SELECT 1 FROM stores WHERE whatsapp_code = new_code AND id != store_record.id) THEN
          UPDATE stores SET whatsapp_code = new_code WHERE id = store_record.id;
          EXIT;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- Verificación
SELECT id, name, whatsapp_code FROM stores;
