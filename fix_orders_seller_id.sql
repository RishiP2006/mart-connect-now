-- Fix orders that might be missing seller_id
-- This ensures all orders have seller_id set correctly

-- First, check if there are any orders with NULL seller_id
SELECT COUNT(*) as orders_without_seller_id 
FROM public.orders 
WHERE seller_id IS NULL;

-- Update any orders that are missing seller_id
UPDATE public.orders
SET seller_id = products.seller_id
FROM public.products
WHERE public.orders.product_id = products.id
  AND public.orders.seller_id IS NULL;

-- Verify the update
SELECT 
  o.id,
  o.seller_id,
  o.customer_id,
  o.status,
  p.seller_id as product_seller_id
FROM public.orders o
JOIN public.products p ON o.product_id = p.id
WHERE o.seller_id IS NULL OR o.seller_id != p.seller_id
LIMIT 10;

