# How to Verify RLS Policies in Supabase

## Method 1: Using Supabase Dashboard (Easiest)

### Step 1: Access Authentication Policies
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/waaxlkauxlblxqlfjune
2. In the left sidebar, click on **"Authentication"**
3. Click on **"Policies"** (or look for "Row Level Security" / "RLS")

### Step 2: Select the Table
1. In the policies page, you'll see a dropdown or list of tables
2. Select **"orders"** table from the list
3. You should see all policies for the orders table

### Step 3: Check for Required Policies
Look for these policies:

**For Retailers to View Orders:**
- Policy Name: "Sellers can view their orders" (or similar)
- Operation: SELECT
- Definition: Should contain `seller_id = auth.uid()`

**For Retailers to Update Orders:**
- Policy Name: "Sellers can update their orders" (or similar)
- Operation: UPDATE
- Definition: Should contain `seller_id = auth.uid()`

**For Customers to View Orders:**
- Policy Name: "Customers can view their own orders" (or similar)
- Operation: SELECT
- Definition: Should contain `customer_id = auth.uid()`

---

## Method 2: Using SQL Editor (More Detailed)

### Step 1: Open SQL Editor
1. Go to Supabase Dashboard
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### Step 2: Run This Query to See All Policies

```sql
-- View all RLS policies for the orders table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY cmd, policyname;
```

### Step 3: Check Specific Policy Details

```sql
-- Check if a specific policy exists
SELECT 
  policyname,
  cmd as operation,
  qual as policy_definition
FROM pg_policies
WHERE tablename = 'orders'
  AND policyname LIKE '%Sellers%view%orders%';
```

### Step 4: Verify RLS is Enabled

```sql
-- Check if RLS is enabled on the orders table
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'orders';
```

**Expected Result**: `rls_enabled` should be `true`

---

## Method 3: Test Policies Directly

### Test as Retailer (Using Service Role Key)

**⚠️ Warning**: Only use this for testing. Never expose service role key in client code.

1. Get your Service Role Key:
   - Go to Supabase Dashboard → Settings → API
   - Copy the **"service_role"** key (NOT the anon key)

2. Test Query (run in SQL Editor with service role):

```sql
-- Simulate querying as a retailer
-- Replace 'RETAILER_USER_ID' with actual retailer user ID

SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claim.sub = 'RETAILER_USER_ID';

SELECT 
  id,
  seller_id,
  customer_id,
  status,
  total_price
FROM public.orders
WHERE seller_id = 'RETAILER_USER_ID';
```

---

## Method 4: Check Policy Definitions

### View Full Policy SQL

```sql
-- Get the exact SQL definition of policies
SELECT 
  'CREATE POLICY "' || policyname || '"' || E'\n' ||
  '  ON ' || schemaname || '.' || tablename || E'\n' ||
  '  FOR ' || cmd || E'\n' ||
  '  USING (' || qual || ')' ||
  CASE 
    WHEN with_check IS NOT NULL THEN E'\n' || '  WITH CHECK (' || with_check || ')'
    ELSE ''
  END || ';' as policy_sql
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY cmd, policyname;
```

---

## Expected Policies for Orders Table

### For Retailers (Sellers):

```sql
-- Policy 1: View orders
CREATE POLICY "Sellers can view their orders"
  ON public.orders FOR SELECT
  USING (seller_id = auth.uid());

-- Policy 2: Update orders
CREATE POLICY "Sellers can update their orders"
  ON public.orders FOR UPDATE
  USING (seller_id = auth.uid());
```

### For Customers:

```sql
-- Policy 1: View own orders
CREATE POLICY "Customers can view their own orders"
  ON public.orders FOR SELECT
  USING (customer_id = auth.uid());

-- Policy 2: Create orders
CREATE POLICY "Customers can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (customer_id = auth.uid());
```

---

## Quick Verification Checklist

- [ ] RLS is enabled on `orders` table (`rls_enabled = true`)
- [ ] Policy exists: "Sellers can view their orders" (SELECT operation)
- [ ] Policy exists: "Sellers can update their orders" (UPDATE operation)
- [ ] Policy uses: `seller_id = auth.uid()` (not `products.seller_id`)
- [ ] No conflicting policies that might block access

---

## Common Issues

### Issue 1: RLS Not Enabled
**Symptom**: Policies exist but don't work
**Fix**: 
```sql
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
```

### Issue 2: Wrong Policy Definition
**Symptom**: Retailers can't see orders
**Fix**: Policy should use `seller_id = auth.uid()`, not `products.seller_id = auth.uid()`

### Issue 3: Missing Policy
**Symptom**: Error "new row violates row-level security policy"
**Fix**: Create the missing policy using the SQL from "Expected Policies" section above

---

## How to Fix Policies

If policies are missing or incorrect, run this in SQL Editor:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Sellers can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update their orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can view orders for their products" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update order status" ON public.orders;

-- Create correct policies
CREATE POLICY "Sellers can view their orders"
  ON public.orders FOR SELECT
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can update their orders"
  ON public.orders FOR UPDATE
  USING (seller_id = auth.uid());
```

---

## Testing After Verification

1. **As Retailer**: 
   - Log in as retailer
   - Go to retailer dashboard
   - Should see orders where `seller_id` matches retailer's user ID

2. **As Customer**:
   - Log in as customer
   - Go to "My Orders"
   - Should only see orders where `customer_id` matches customer's user ID

3. **Check Browser Console**:
   - Open DevTools (F12)
   - Look for any RLS policy errors
   - Should see "Orders found: X" in console

