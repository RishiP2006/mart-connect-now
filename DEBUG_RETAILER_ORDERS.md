# Debug: Retailers Can't See Pending Orders

## Issue
Retailers cannot see pending orders even though customers can see their orders.

## Possible Causes

1. **Orders missing seller_id** - Old orders might not have seller_id set
2. **RLS Policy blocking access** - Row Level Security might be preventing retailers from seeing orders
3. **Query error** - The query might be failing silently

## Step 1: Check Browser Console

1. Open the retailer dashboard
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for error messages or logs starting with:
   - "Error fetching orders"
   - "Orders found:"
   - "No orders found for retailer:"

## Step 2: Run SQL to Check Orders

Go to Supabase Dashboard → SQL Editor and run:

```sql
-- Check if orders have seller_id set
SELECT 
  o.id,
  o.seller_id,
  o.customer_id,
  o.status,
  p.seller_id as product_seller_id,
  p.name as product_name
FROM public.orders o
JOIN public.products p ON o.product_id = p.id
WHERE o.status = 'pending'
ORDER BY o.created_at DESC
LIMIT 10;
```

## Step 3: Fix Missing seller_id

If you see orders with NULL seller_id or mismatched seller_id, run:

```sql
-- Fix orders missing seller_id
UPDATE public.orders
SET seller_id = products.seller_id
FROM public.products
WHERE public.orders.product_id = products.id
  AND (public.orders.seller_id IS NULL OR public.orders.seller_id != products.seller_id);
```

## Step 4: Verify RLS Policies

Check that the RLS policy exists:

```sql
-- Check RLS policies for orders
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'orders';
```

You should see a policy named "Sellers can view their orders" with:
- `cmd` = 'SELECT'
- `qual` should contain `seller_id = auth.uid()`

## Step 5: Test Query Directly

Run this query as the retailer user (replace USER_ID with actual retailer user ID):

```sql
-- Test query (replace USER_ID with retailer's user ID)
SELECT 
  id,
  seller_id,
  customer_id,
  status,
  total_price
FROM public.orders
WHERE seller_id = 'USER_ID_HERE'
ORDER BY created_at DESC;
```

## Step 6: Check if Migration Ran

Verify the migration that adds seller_id has been applied:

```sql
-- Check if seller_id column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
  AND column_name = 'seller_id';
```

If the column doesn't exist, run the migration:
- File: `supabase/migrations/20251121100000_update_order_tracking.sql`

## Quick Fix Script

Run this complete fix script in Supabase SQL Editor:

```sql
-- Complete fix for retailer orders visibility
BEGIN;

-- 1. Ensure seller_id column exists
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Update all orders to have seller_id
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

-- 4. Ensure RLS policy exists
DROP POLICY IF EXISTS "Sellers can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update their orders" ON public.orders;

CREATE POLICY "Sellers can view their orders"
  ON public.orders FOR SELECT
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can update their orders"
  ON public.orders FOR UPDATE
  USING (seller_id = auth.uid());

COMMIT;
```

## After Running Fix

1. Refresh the retailer dashboard
2. Check browser console for "Orders found: X" message
3. Pending orders should now appear

