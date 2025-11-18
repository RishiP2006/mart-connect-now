# Environment Variables Setup Guide

This file documents all the environment variables needed for the Mart Connect application.

## Required Environment Variables

Create a `.env` file in the root of your project with the following variables:

```env
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Email Service (Step 5: Email Notifications) - OPTIONAL but Recommended
# Sign up at https://resend.com and get your API key
VITE_RESEND_API_KEY=your_resend_api_key_here

# OR use SendGrid instead:
# VITE_SENDGRID_API_KEY=your_sendgrid_api_key_here

# Google Maps API (Step 6: Google Maps) - OPTIONAL
# Get your API key from https://console.cloud.google.com/
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## Step 5: Email Notifications Setup (15 min)

### Using Resend (Recommended)

1. **Sign up for Resend**
   - Go to [https://resend.com](https://resend.com)
   - Create a free account
   - Verify your email address

2. **Get your API key**
   - Navigate to **API Keys** in your Resend dashboard
   - Click **Create API Key**
   - Copy the API key

3. **Add to environment variables**
   - Add `VITE_RESEND_API_KEY=your_api_key_here` to your `.env` file
   - **For Vercel**: Go to Project Settings → Environment Variables → Add `VITE_RESEND_API_KEY`
   - Redeploy your application

4. **Update sender email (Important)**
   - In `src/lib/email.ts`, update the `from` field:
     ```typescript
     from: 'Mart Connect <onboarding@resend.dev>', // Change to your verified domain
     ```
   - Or verify your domain in Resend dashboard and use your own domain

### Using SendGrid (Alternative)

1. **Sign up for SendGrid**
   - Go to [https://sendgrid.com](https://sendgrid.com)
   - Create a free account
   - Verify your email address

2. **Get your API key**
   - Navigate to **Settings** → **API Keys**
   - Click **Create API Key**
   - Copy the API key

3. **Add to environment variables**
   - Add `VITE_SENDGRID_API_KEY=your_api_key_here` to your `.env` file
   - **For Vercel**: Go to Project Settings → Environment Variables → Add `VITE_SENDGRID_API_KEY`
   - Redeploy your application

4. **Update sender email**
   - In `src/lib/email.ts`, update the `from` field in `sendOrderConfirmationEmailSendGrid`:
     ```typescript
     email: 'noreply@martconnect.com', // Change to your verified sender
     ```

## Step 6: Google Maps Setup (10 min)

1. **Get Google Maps API key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - **Maps JavaScript API**
     - **Maps Embed API**
     - **Maps Static API** (optional, for fallback)
   - Navigate to **Credentials** → **Create Credentials** → **API Key**
   - Copy your API key

2. **Add to environment variables**
   - Add `VITE_GOOGLE_MAPS_API_KEY=your_api_key_here` to your `.env` file
   - **For Vercel**: Go to Project Settings → Environment Variables → Add `VITE_GOOGLE_MAPS_API_KEY`
   - Redeploy your application

3. **Optional: Restrict API key (Recommended for production)**
   - In Google Cloud Console, go to **Credentials**
   - Click on your API key
   - Under **API restrictions**, select **Restrict key**
   - Choose the APIs you enabled (Maps JavaScript API, Maps Embed API)
   - Under **Application restrictions**, you can restrict by HTTP referrer for web apps

## Testing

### Test Email Notifications
1. Place a test order through the checkout process
2. Check your email inbox for the order confirmation
3. Check the browser console for any errors

### Test Google Maps
1. Navigate to a product detail page that has a seller location
2. The map should display interactively if the API key is configured
3. Without the API key, a static map and "Open in Google Maps" link will be shown

## Troubleshooting

### Email not sending
- Verify your API key is correct in environment variables
- Check that the API key has the correct permissions
- For Resend: Make sure you've verified your domain or use the default `onboarding@resend.dev`
- Check browser console for error messages
- Verify the email service is properly configured in Vercel (if deployed)

### Google Maps not showing
- Verify `VITE_GOOGLE_MAPS_API_KEY` is set in environment variables
- Check that the required APIs are enabled in Google Cloud Console
- Verify the API key has not exceeded its quota
- Check browser console for API errors
- The component will show a static map as fallback if the API key is missing

## Notes

- Environment variables prefixed with `VITE_` are exposed to the client-side code
- Never commit your `.env` file to version control (it's already in `.gitignore`)
- For production, always set environment variables in your hosting platform (Vercel, Netlify, etc.)
- The email service will gracefully fail if not configured - orders will still be placed successfully

