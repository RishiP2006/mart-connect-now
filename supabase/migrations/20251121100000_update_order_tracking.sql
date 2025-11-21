BEGIN;

-- Add seller_id to orders for direct retailer targeting
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

UPDATE public.orders
SET seller_id = products.seller_id
FROM public.products
WHERE public.orders.product_id = products.id
  AND public.orders.seller_id IS NULL;

ALTER TABLE public.orders
ALTER COLUMN seller_id SET NOT NULL;

-- Update allowed status values
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check
CHECK (status IN ('pending', 'dispatched', 'on_the_way', 'received'));

ALTER TABLE public.orders
ALTER COLUMN status SET DEFAULT 'pending';

-- Refresh policies to leverage seller_id
DROP POLICY IF EXISTS "Sellers can view orders for their products" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update order status" ON public.orders;
DROP POLICY IF EXISTS "Sellers can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update their orders" ON public.orders;

CREATE POLICY "Sellers can view their orders"
  ON public.orders FOR SELECT
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can update their orders"
  ON public.orders FOR UPDATE
  USING (seller_id = auth.uid());

COMMIT;

