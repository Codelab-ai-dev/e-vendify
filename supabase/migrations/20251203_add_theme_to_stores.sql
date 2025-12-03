-- Add theme column to stores table
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'modern';

-- Update existing rows to have default theme
UPDATE stores 
SET theme = 'modern' 
WHERE theme IS NULL;
