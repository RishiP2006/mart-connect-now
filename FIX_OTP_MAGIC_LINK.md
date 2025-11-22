# Fix OTP - Getting Magic Link Instead of Code

## Problem
When signing in with OTP, users are receiving magic links instead of 6-digit verification codes.

## Solution: Update Supabase Email Template

The issue is in your Supabase Dashboard email template configuration. Here's how to fix it:

### Step 1: Access Email Templates
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/waaxlkauxlblxqlfjune
2. Navigate to **Authentication** → **Email Templates** (in the left sidebar)

### Step 2: Update the Magic Link Template
1. Find the **"Magic Link"** email template
2. Click to edit it
3. **Replace** `{{ .ConfirmationURL }}` with `{{ .Token }}`
4. Update the email content to show the code instead of a link

### Example Template:
```html
<h2>Your Verification Code</h2>
<p>Please use the following code to sign in:</p>
<h1 style="font-size: 32px; letter-spacing: 8px; text-align: center;">{{ .Token }}</h1>
<p>This code will expire in 1 hour.</p>
```

### Step 3: Save Changes
- Click **Save** to apply the changes

### Step 4: Test
1. Try signing in with OTP again
2. Check your email - you should now receive a 6-digit code instead of a magic link

## Alternative: Use OTP Template
If there's a separate "OTP" template:
1. Make sure it uses `{{ .Token }}` 
2. Ensure it's set as the default for OTP authentication

## Code is Already Correct
The code in `src/pages/Auth.tsx` is already configured correctly - it doesn't include `emailRedirectTo`, which means it should send OTP codes. The issue is purely in the Supabase email template configuration.

---

**Note:** After updating the template, it may take a few minutes for changes to propagate. Try again after 2-3 minutes.

