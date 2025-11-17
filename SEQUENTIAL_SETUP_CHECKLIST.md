# ✅ Sequential Setup Checklist - Do These Steps IN ORDER

## 🎯 **MINIMUM REQUIRED SETUP** (To Make It Work)

### ✅ Step 1: Run Database Migrations (5 minutes)

1. Go to: **Supabase Dashboard** → **SQL Editor**
2. Copy and paste this SQL:

```sql
-- Migration 1: Add Availability Date
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS availability_date TIMESTAMPTZ;

-- Migration 2: Create Browsing History Table
CREATE TABLE IF NOT EXISTS public.browsing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  view_duration INTEGER DEFAULT 0,
  UNIQUE(user_id, product_id, viewed_at)
);

ALTER TABLE public.browsing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own browsing history"
  ON public.browsing_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own browsing history"
  ON public.browsing_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_browsing_history_user_product 
  ON public.browsing_history(user_id, product_id, viewed_at DESC);
```

3. Click **Run**
4. ✅ Verify: Check Table Editor - you should see `browsing_history` table

---

### ✅ Step 2: Enable Realtime (2 minutes)

1. Go to: **Supabase Dashboard** → **Database** → **Replication**
2. Find `orders` table
3. Toggle the switch to **ON**
4. ✅ Verify: Orders table shows "Replication: ON"

---

### ✅ Step 3: Test Your Application (10 minutes)

1. Visit: https://mart-connectnow.vercel.app
2. Test these features:
   - [ ] Sign up with email/OTP
   - [ ] Browse products
   - [ ] Use filters
   - [ ] View product details
   - [ ] Add to cart and place order
   - [ ] Check stock decreases
   - [ ] Submit feedback
   - [ ] View recommendations (after browsing)

**✅ If all above work, your app is functional!**

---

## 🚀 **OPTIONAL ENHANCEMENTS** (For Full Features)

### ⚙️ Step 4: Facebook Login (10 minutes)

1. Go to: https://developers.facebook.com/
2. Create App → Choose "Consumer"
3. Get **App ID** and **App Secret**
4. Add redirect URI: `https://waaxlkauxlblxqlfjune.supabase.co/auth/v1/callback`
5. Go to: **Supabase Dashboard** → **Authentication** → **Providers** → **Facebook**
6. Enable and enter credentials
7. ✅ Test: Try Facebook login on your site

---

### ⚙️ Step 5: Email Notifications (15 minutes)

**Option A: Using Resend (Recommended)**

1. Sign up at: https://resend.com
2. Get API key from dashboard
3. Go to: **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**
4. Add: `VITE_RESEND_API_KEY` = `your_key_here`
5. Redeploy application
6. ✅ Test: Place an order and check email

---

### ⚙️ Step 6: Google Maps (10 minutes)

1. Go to: https://console.cloud.google.com/
2. Create project → Enable **Maps JavaScript API** and **Maps Embed API**
3. Create API Key
4. Go to: **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**
5. Add: `VITE_GOOGLE_MAPS_API_KEY` = `your_key_here`
6. Redeploy application
7. ✅ Test: View product with seller location - map should appear

---

## 📊 **PROGRESS TRACKER**

### Required Steps:
- [ ] Step 1: Database Migrations
- [ ] Step 2: Enable Realtime
- [ ] Step 3: Test Application

### Optional Steps:
- [ ] Step 4: Facebook Login
- [ ] Step 5: Email Notifications
- [ ] Step 6: Google Maps

---

## 🎯 **QUICK REFERENCE**

### What Works WITHOUT Additional Setup:
✅ OTP Authentication
✅ Google Login
✅ Product Browsing & Filtering
✅ Order Placement
✅ Stock Management
✅ Feedback System
✅ Real-time Order Updates
✅ Personalized Recommendations
✅ Calendar for Offline Orders

### What Needs Configuration:
⚠️ Facebook Login (needs OAuth setup)
⚠️ Email Notifications (needs email service)
⚠️ Interactive Google Maps (needs API key - static map works without it)

---

## ⚡ **FASTEST PATH TO FUNCTIONAL APP**

**Just do Steps 1-3** and your app will be fully functional!

Steps 4-6 are optional enhancements that improve user experience.

---

## 📝 **VERIFICATION CHECKLIST**

After completing setup, verify:

- [ ] Can register new users
- [ ] Can login with OTP
- [ ] Can browse and filter products
- [ ] Can place orders
- [ ] Stock decreases on order
- [ ] Can submit reviews
- [ ] Recommendations appear
- [ ] Order status updates in real-time
- [ ] Calendar works for offline orders

**If all checked ✅, you're done!**

---

## 🆘 **NEED HELP?**

1. Check `COMPLETE_SETUP_GUIDE.md` for detailed instructions
2. Check browser console for errors
3. Check Supabase Dashboard → Logs
4. Verify environment variables in Vercel

---

**🎉 Your project is ready! Follow Steps 1-3 to get started!**

