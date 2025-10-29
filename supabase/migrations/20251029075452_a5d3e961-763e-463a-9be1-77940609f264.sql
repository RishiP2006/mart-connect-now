-- Step 1: Drop all dependent policies and functions first
DROP POLICY IF EXISTS "Retailers and wholesalers can manage categories" ON categories;
DROP POLICY IF EXISTS "Retailers can manage their own products" ON products;
DROP POLICY IF EXISTS "Customers can create orders" ON orders;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;

-- Step 2: Rename old enum
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    ALTER TYPE app_role RENAME TO app_role_old;
  END IF;
END $$;

-- Step 3: Create new enum
CREATE TYPE app_role AS ENUM ('customer', 'retailer', 'wholesaler');

-- Step 4: Update user_roles table column
ALTER TABLE user_roles 
  ALTER COLUMN role TYPE app_role USING role::text::app_role;

-- Step 5: Drop old enum
DROP TYPE IF EXISTS app_role_old CASCADE;

-- Step 6: Recreate has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Step 7: Recreate policies
CREATE POLICY "Retailers and wholesalers can manage categories"
ON categories
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'retailer'::app_role) OR 
  has_role(auth.uid(), 'wholesaler'::app_role)
);

CREATE POLICY "Retailers can manage their own products"
ON products
FOR ALL
TO authenticated
USING (
  auth.uid() = seller_id AND 
  has_role(auth.uid(), 'retailer'::app_role)
)
WITH CHECK (
  auth.uid() = seller_id AND 
  has_role(auth.uid(), 'retailer'::app_role)
);

CREATE POLICY "Customers can create orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = customer_id AND
  (has_role(auth.uid(), 'customer'::app_role) OR has_role(auth.uid(), 'wholesaler'::app_role))
);