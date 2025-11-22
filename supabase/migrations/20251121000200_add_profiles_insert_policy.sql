-- Add INSERT policy for profiles table
-- This allows users to create their own profile during signup
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

