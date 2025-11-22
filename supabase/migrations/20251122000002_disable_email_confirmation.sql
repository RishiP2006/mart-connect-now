-- Disable email confirmation requirement for new user signups
-- This allows users to sign up and use the app immediately without email verification

-- Note: This migration updates the auth configuration
-- You may also need to disable email confirmation in Supabase Dashboard:
-- Authentication → Settings → Email Auth → "Enable email confirmations" → OFF

-- Create a function to auto-confirm users on signup (if trigger-based approach is needed)
-- However, the recommended approach is to disable email confirmation in Supabase Dashboard

-- This SQL will help verify the current email confirmation setting
-- Run this to check if email confirmation is enabled:
-- SELECT * FROM auth.config WHERE key = 'ENABLE_SIGNUP' OR key LIKE '%EMAIL%';

-- To disable email confirmation via SQL (requires superuser/admin access):
-- UPDATE auth.config SET value = 'false' WHERE key = 'MAILER_SECURE_EMAIL_CHANGE_ENABLED';
-- Note: Direct SQL updates to auth.config may not work - use Dashboard instead

