ALTER TABLE public.suppliers ADD COLUMN type text NOT NULL DEFAULT 'supplier';

-- Update existing column comment
COMMENT ON COLUMN public.suppliers.type IS 'Type of entity: supplier or client';