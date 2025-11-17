-- Create browsing_history table for tracking user product views
CREATE TABLE IF NOT EXISTS public.browsing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  view_duration INTEGER DEFAULT 0, -- in seconds
  UNIQUE(user_id, product_id, viewed_at)
);

ALTER TABLE public.browsing_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for browsing_history
CREATE POLICY "Users can view their own browsing history"
  ON public.browsing_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own browsing history"
  ON public.browsing_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_browsing_history_user_product 
  ON public.browsing_history(user_id, product_id, viewed_at DESC);

