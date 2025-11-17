# 🚀 Complete Setup Guide - Live MART

## Step-by-Step Instructions to Make Everything Fully Functional

Follow these steps **in order** to set up your project completely.

---

## 📋 **STEP 1: Database Setup (REQUIRED)**

### 1.1 Run Database Migrations

Go to your **Supabase Dashboard** → **SQL Editor** and run these migrations:

#### Migration 1: Add Availability Date
```sql
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS availability_date TIMESTAMPTZ;

COMMENT ON COLUMN public.products.availability_date IS 'Expected date when product will be available for delivery';
```

#### Migration 2: Add Browsing History Table
```sql
-- Create browsing_history table for tracking user product views
CREATE TABLE IF NOT EXISTS public.browsing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  view_duration INTEGER DEFAULT 0,
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
```

**✅ Check**: After running migrations, verify tables exist in Supabase Dashboard → Table Editor

---

## 📋 **STEP 2: Enable Supabase Realtime (REQUIRED for Real-time Updates)**

### 2.1 Enable Realtime for Orders Table

1. Go to **Supabase Dashboard** → **Database** → **Replication**
2. Find the `orders` table
3. Toggle **ON** the replication switch
4. This enables real-time order status updates

**✅ Check**: Orders table should show "Replication: ON"

---

## 📋 **STEP 3: Configure Facebook OAuth (OPTIONAL but Recommended)**

### 3.1 Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Choose **"Consumer"** app type
4. Fill in app details and create app

### 3.2 Get Facebook Credentials

1. In your Facebook App dashboard:
   - Go to **Settings** → **Basic**
   - Note your **App ID** and **App Secret**
   - Add **Valid OAuth Redirect URIs**:
     ```
     https://waaxlkauxlblxqlfjune.supabase.co/auth/v1/callback
     ```

### 3.3 Configure in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **Facebook** and click to configure
3. Enable Facebook provider
4. Enter:
   - **Facebook App ID**: (from step 3.2)
   - **Facebook App Secret**: (from step 3.2)
5. Click **Save**

**✅ Check**: Try logging in with Facebook on your website

---

## 📋 **STEP 4: Set Up Email Service (OPTIONAL but Recommended)**

### Option A: Using Resend (Easiest)

#### 4.1 Create Resend Account
1. Go to [resend.com](https://resend.com)
2. Sign up for free account
3. Verify your email
4. Go to **API Keys** section
5. Create a new API key
6. Copy the API key

#### 4.2 Add to Environment Variables

1. In your project root, create `.env` file (if it doesn't exist):
   ```env
   VITE_RESEND_API_KEY=your_resend_api_key_here
   ```

2. **For Vercel Deployment**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `VITE_RESEND_API_KEY` = `your_resend_api_key_here`
   - Redeploy your application

#### 4.3 Update Email Code (if needed)

The email notification code is already in `src/pages/Checkout.tsx`. You can enhance it by:

1. Installing Resend package:
   ```bash
   npm install resend
   ```

2. Creating an API route or Edge Function to send emails securely

**✅ Check**: Place a test order and verify email is sent

---

### Option B: Using Supabase Edge Functions

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Create a new function for sending emails
3. Use Supabase's built-in email or integrate with SendGrid/Mailgun
4. Call the function from Checkout.tsx

---

## 📋 **STEP 5: Configure Google Maps API (OPTIONAL)**

### 5.1 Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Maps JavaScript API** and **Maps Embed API**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy your API key
6. (Optional) Restrict the API key to your domain for security

### 5.2 Add to Environment Variables

1. Add to your `.env` file:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

2. **For Vercel Deployment**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `VITE_GOOGLE_MAPS_API_KEY` = `your_google_maps_api_key_here`
   - Redeploy your application

**✅ Check**: View a product detail page with seller location - map should display

**Note**: Without API key, a static map and "Open in Google Maps" link will be shown

---

## 📋 **STEP 6: Test All Features**

### 6.1 Test Authentication
- [ ] Sign up with email/password
- [ ] Sign up with OTP
- [ ] Sign in with Google
- [ ] Sign in with Facebook (if configured)
- [ ] Verify role assignment works

### 6.2 Test Product Features
- [ ] Browse products
- [ ] Use enhanced filters (price, stock, distance)
- [ ] View product details
- [ ] Check availability date display
- [ ] View seller location map (if location set)
- [ ] Submit product feedback/review
- [ ] View real reviews on product pages

### 6.3 Test Order Management
- [ ] Add products to cart
- [ ] Place online order
- [ ] Place offline order with calendar date
- [ ] Verify stock decreases automatically
- [ ] Check real-time order status updates
- [ ] View order history

### 6.4 Test Recommendations
- [ ] Browse several products
- [ ] Place an order
- [ ] Check "Recommended for You" section on dashboard
- [ ] Verify recommendations match your browsing/purchase history

---

## 📋 **STEP 7: Deploy to Production**

### 7.1 Push All Changes
```bash
git add .
git commit -m "Complete implementation with all features"
git push
```

### 7.2 Vercel Auto-Deployment
- Vercel should automatically deploy when you push
- Check Vercel Dashboard for deployment status
- Wait for deployment to complete (2-5 minutes)

### 7.3 Verify Production
- [ ] Visit your live site: https://mart-connectnow.vercel.app
- [ ] Test all features on production
- [ ] Verify environment variables are set in Vercel

---

## 📋 **STEP 8: Final Configuration Checklist**

### Required (Must Do):
- [x] Run database migrations (Step 1)
- [x] Enable Supabase Realtime (Step 2)
- [x] Test all features (Step 6)

### Optional (Recommended):
- [ ] Configure Facebook OAuth (Step 3)
- [ ] Set up email service (Step 4)
- [ ] Configure Google Maps API (Step 5)

---

## 🎯 **QUICK START (Minimal Setup)**

If you want to get started quickly with minimal setup:

1. **Run Database Migrations** (Step 1) - **REQUIRED**
2. **Enable Realtime** (Step 2) - **REQUIRED**
3. **Test the application** - Everything else works without additional setup!

Facebook login, email notifications, and Google Maps are optional enhancements.

---

## 🐛 **TROUBLESHOOTING**

### Issue: Facebook login not working
- **Solution**: Check Facebook OAuth configuration in Supabase Dashboard
- Verify redirect URI is correct
- Check Facebook App settings

### Issue: Email not sending
- **Solution**: Check if email service is configured
- Verify API key in environment variables
- Check browser console for errors

### Issue: Google Maps not showing
- **Solution**: Add `VITE_GOOGLE_MAPS_API_KEY` to environment variables
- Verify API key is valid and has correct permissions
- Static map will show as fallback

### Issue: Real-time updates not working
- **Solution**: Verify Realtime is enabled in Supabase Dashboard
- Check browser console for connection errors
- Ensure you're logged in

### Issue: Recommendations not showing
- **Solution**: Browse some products first to build history
- Check if browsing_history table exists
- Verify user is logged in

---

## 📞 **SUPPORT**

If you encounter issues:
1. Check browser console for errors
2. Check Supabase Dashboard → Logs
3. Verify all environment variables are set
4. Ensure database migrations are run

---

## ✅ **SUCCESS CRITERIA**

Your project is fully functional when:
- ✅ Users can register/login with multiple methods
- ✅ Products can be browsed, filtered, and searched
- ✅ Orders can be placed and tracked in real-time
- ✅ Feedback system works
- ✅ Stock updates automatically
- ✅ Recommendations appear based on history
- ✅ Maps show seller locations (if API key set)

**🎉 Congratulations! Your Live MART platform is ready!**

