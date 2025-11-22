# How to Disable Email Confirmation in Supabase

## ✅ **CODE FIXES APPLIED**

1. **OTP now sends codes instead of magic links** - Removed `emailRedirectTo` from OTP requests
2. **Password signup updated** - Removed email redirect, will work once confirmation is disabled

## 🔧 **STEP 1: Disable Email Confirmation in Supabase Dashboard**

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/waaxlkauxlblxqlfjune
2. Navigate to **Authentication** → **Settings** (in the left sidebar)
3. Scroll down to the **"Email Auth"** section
4. Find the toggle for **"Enable email confirmations"**
5. **Turn it OFF** (disable it)
6. Click **"Save"** at the bottom of the page

**Result**: Users can now sign up with password immediately without email confirmation.

## 📋 **STEP 2: Apply RLS Policy Fix**

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

### Test OTP Signup (Recommended - Works Immediately):
1. Go to signup page
2. Enter email and full name
3. Click "Send Verification Code"
4. Check your email for **6-digit code** (not a magic link)
5. Enter the code
6. Account created immediately!

### Test Password Signup (After disabling email confirmation):
1. Go to signup page
2. Click "Sign up with Password"
3. Enter email, full name, and password
4. Click "Create Account"
5. Account created immediately (no email confirmation needed)!

## 🎯 **What Changed**

- ✅ OTP now sends **6-digit codes** instead of magic links
- ✅ Password signup will work immediately after disabling email confirmation
- ✅ Better error messages guide users if email confirmation is still enabled
- ✅ Default signup method is OTP (most reliable)

