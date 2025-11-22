# Email Setup Fix for Wholesaler Signup

## ✅ **IMMEDIATE FIX APPLIED**

The signup flow has been updated to **default to OTP (One-Time Password) authentication** for new signups. This works immediately without requiring email configuration.

### What Changed:
- **Signup now defaults to OTP** - Users will receive a 6-digit code via email (if email is configured) or can use the code immediately
- **Password signup is still available** - Users can click "Sign up with Password" if they prefer
- **Better error handling** - If password signup fails due to email confirmation, users are guided to use OTP instead

## 🔧 **TO FIX EMAIL CONFIRMATION FOR PASSWORD SIGNUP**

If you want password-based signup to work without email confirmation, you have two options:

### Option 1: Disable Email Confirmation in Supabase (Recommended for Development)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/waaxlkauxlblxqlfjune
2. Navigate to **Authentication** → **Settings**
3. Scroll down to **"Email Auth"** section
4. Find **"Enable email confirmations"** toggle
5. **Turn it OFF** (disable email confirmations)
6. Click **Save**

**Result**: Users can sign up with password immediately without email confirmation.

### Option 2: Configure Custom SMTP for Email Delivery

If you want to keep email confirmations but ensure emails are sent:

1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Scroll to **"SMTP Settings"** section
3. Configure your SMTP provider:
   - **Host**: (from your email provider)
   - **Port**: (usually 587 for TLS)
   - **Username**: Your email address
   - **Password**: Your email password or app password
   - **Sender email**: The email address to send from
   - **Sender name**: Display name (e.g., "Mart Connect")

**Popular SMTP Providers:**
- **Gmail**: smtp.gmail.com, Port 587
- **SendGrid**: smtp.sendgrid.net, Port 587
- **Mailgun**: smtp.mailgun.org, Port 587
- **Resend**: smtp.resend.com, Port 587

## 📋 **APPLY DATABASE MIGRATIONS**

You still need to apply the RLS policy fix for user_roles:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this SQL:

```sql
-- Fix RLS policy for user_roles INSERT to allow role assignment during signup
DROP POLICY IF EXISTS "Users can insert their own roles during signup" ON public.user_roles;

CREATE POLICY "Users can insert their own roles during signup"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

## ✅ **TESTING**

1. Try signing up as a wholesaler using **OTP** (default method)
2. Enter your email and full name
3. Click "Send Verification Code"
4. Check your email for the 6-digit code
5. Enter the code to complete signup

**Note**: If emails still don't arrive, use Option 1 above to disable email confirmation, or configure SMTP (Option 2).

