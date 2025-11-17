-- Add availability_date column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS availability_date TIMESTAMPTZ;

-- Add comment to explain the field
COMMENT ON COLUMN public.products.availability_date IS 'Expected date when product will be available for delivery';

