-- Complete fix for retailer orders visibility
-- Run this in Supabase SQL Editor

BEGIN;

-- 1. Ensure seller_id column exists
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Update all orders to have seller_id (fix any missing or incorrect seller_id)
UPDATE public.orders
SET seller_id = products.seller_id
FROM public.products
WHERE public.orders.product_id = products.id
  AND (public.orders.seller_id IS NULL OR public.orders.seller_id != products.seller_id);

-- 3. Make seller_id NOT NULL if all orders have it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.orders WHERE seller_id IS NULL
  ) THEN
    ALTER TABLE public.orders
    ALTER COLUMN seller_id SET NOT NULL;
  END IF;
END $$;

-- 4. Ensure RLS policies exist and are correct
DROP POLICY IF EXISTS "Sellers can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update their orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can view orders for their products" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update order status" ON public.orders;

-- Create new policies using seller_id
CREATE POLICY "Sellers can view their orders"
  ON public.orders FOR SELECT
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can update their orders"
  ON public.orders FOR UPDATE
  USING (seller_id = auth.uid());

COMMIT;

-- Verify the fix
SELECT 
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE seller_id IS NOT NULL) as orders_with_seller_id,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_orders
FROM public.orders;

