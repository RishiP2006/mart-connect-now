-- Fix RLS policy for user_roles INSERT to allow role assignment during signup
-- This fixes the issue where wholesaler (and other roles) signup fails due to RLS policy violation

-- Drop the existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert their own roles during signup" ON public.user_roles;

-- Recreate the INSERT policy with proper permissions
-- This allows authenticated users to insert their own role during signup
CREATE POLICY "Users can insert their own roles during signup"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

