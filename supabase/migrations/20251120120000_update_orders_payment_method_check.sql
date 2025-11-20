-- Allow cash-on-delivery strings and keep backwards compatibility
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('online', 'offline', 'cod', 'cash_on_delivery'));


