# PayPal Subscription Setup Guide

## Overview
This guide walks you through setting up PayPal subscription functionality for HomeSchoolTracker.

## Prerequisites
- PayPal Developer Account
- Supabase project setup
- Local development environment

## Step 1: PayPal Developer Setup

### 1.1 Create PayPal App
1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/home/)
2. Log in with your PayPal account
3. Click "Create App"
4. Choose "Default Application" and select "Sandbox" for testing
5. Note down your **Client ID** and **Client Secret**

### 1.2 Create Subscription Plans
1. In PayPal Developer Dashboard, go to "Products & Plans"
2. Create a new Product:
   - Name: "HomeSchoolTracker Subscription"
   - Type: "Service"
   - Category: "Education"
3. Create Plans under this product:
   - **Basic Plan**: $9.99/month
   - **Premium Plan**: $19.99/month
4. Note down the **Plan IDs** (they start with `P-`)

### 1.3 Set Up Webhooks
1. Go to "Webhooks" in PayPal Developer Dashboard
2. Create a new webhook
3. Webhook URL: `https://your-supabase-project.supabase.co/functions/v1/webhook-handler`
4. Select these events:
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.SUSPENDED`
   - `BILLING.SUBSCRIPTION.EXPIRED`
5. Note down the **Webhook ID**

## Step 2: Environment Variables

### 2.1 Local Development (.env.local)
Create a `.env.local` file in your project root:

```bash
# PayPal Configuration (Frontend)
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id_here

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Admin Access
VITE_OWNER_EMAIL=your_admin_email@example.com
```

### 2.2 Supabase Edge Functions Environment Variables
In your Supabase Dashboard → Settings → Edge Functions, add:

```bash
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
PAYPAL_API_URL=https://api-m.sandbox.paypal.com
PAYPAL_WEBHOOK_ID=your_webhook_id_here
FRONTEND_PAYPAL_RETURN_URL=http://localhost:5173/subscribe/success
FRONTEND_PAYPAL_CANCEL_URL=http://localhost:5173/subscribe/cancel
```

## Step 3: Database Setup

### 3.1 Run Migrations
```bash
npx supabase db push
```

### 3.2 Update Subscription Plans
1. Go to your Supabase Dashboard → Table Editor
2. Open the `subscription_plans` table
3. Update the `paypal_plan_id` values with your real PayPal Plan IDs:
   - Replace `P-REPLACE-WITH-REAL-BASIC-PLAN-ID` with your Basic Plan ID
   - Replace `P-REPLACE-WITH-REAL-PREMIUM-PLAN-ID` with your Premium Plan ID

## Step 4: Testing

### 4.1 Test Subscription Flow
1. Start your local development server: `npm run dev`
2. Navigate to the subscription page
3. Click "Subscribe" on a plan
4. Use PayPal sandbox test accounts to complete payment
5. Verify the subscription appears in your Supabase database

### 4.2 Test Webhooks
1. Make a test subscription
2. Cancel it from PayPal sandbox
3. Verify the status updates in your database

## Step 5: Production Deployment

### 5.1 PayPal Production Setup
1. Create a new PayPal app for production
2. Use production PayPal API URL: `https://api-m.paypal.com`
3. Create production subscription plans
4. Update webhook URLs to production

### 5.2 Update Environment Variables
1. Update all PayPal credentials to production values
2. Update frontend URLs to production domains
3. Test thoroughly in production environment

## Troubleshooting

### Common Issues

#### "INVALID_PARAMETER_SYNTAX" Error
- **Cause**: Using placeholder PayPal Plan IDs
- **Solution**: Replace with real Plan IDs from PayPal Dashboard

#### "Configuration Error" Button
- **Cause**: Missing `VITE_PAYPAL_CLIENT_ID` environment variable
- **Solution**: Add the variable to your `.env.local` file

#### Subscription Not Recording in Database
- **Cause**: Missing Supabase environment variables for Edge Functions
- **Solution**: Add all required variables in Supabase Dashboard

#### Webhook Events Not Processing
- **Cause**: Incorrect webhook URL or missing webhook verification
- **Solution**: Verify webhook URL and ensure `PAYPAL_WEBHOOK_ID` is set

### Support
- PayPal Developer Documentation: https://developer.paypal.com/docs/subscriptions/
- Supabase Edge Functions: https://supabase.com/docs/guides/functions

## Security Notes
- Never commit real PayPal credentials to version control
- Use sandbox credentials for development and testing
- Rotate credentials regularly in production
- Implement proper error handling and logging 