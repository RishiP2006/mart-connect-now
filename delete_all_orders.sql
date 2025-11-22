-- ⚠️ WARNING: This will delete ALL orders from ALL customer accounts
-- This action cannot be undone!
-- Make sure you have a backup if you need to restore this data later.

-- Delete all orders from the orders table
-- This will delete orders for all customers (customer_id references)
DELETE FROM public.orders;

-- Verify deletion (optional - uncomment to check)
-- SELECT COUNT(*) as remaining_orders FROM public.orders;
-- Should return 0 if deletion was successful

