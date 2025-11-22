-- Verify the actual policy definitions for orders table
-- Run this in Supabase SQL Editor to see the exact policy logic

SELECT 
  policyname as "Policy Name",
  cmd as "Operation",
  roles as "Applied To",
  qual as "Policy Definition (USING clause)",
  with_check as "With Check Clause"
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY cmd, policyname;

-- This will show you the actual SQL conditions used in each policy
-- For "Sellers can view their orders", the qual should be: (seller_id = auth.uid())
-- For "Sellers can update their orders", the qual should be: (seller_id = auth.uid())

