-- Update Database with Real PayPal Plan IDs
-- This migration inserts all 5 subscription plans with verified PayPal Plan IDs
-- Generated from Task 004: Extract and Document PayPal Plan IDs

-- Insert all subscription plans with real PayPal Plan IDs
INSERT INTO public.subscription_plans (name, description, price, currency, paypal_plan_id)
VALUES 
  -- Public Monthly Plans
  (
    'Basic Monthly',
    'Perfect for small families with up to 2 students. Includes 30-day free trial.',
    9.99,
    'USD',
    'P-4E747738FG1460728NBDV3GY'
  ),
  (
    'Premium Monthly',
    'Ideal for larger families with unlimited students and advanced features. Includes 30-day free trial.',
    19.99,
    'USD',
    'P-55V07943L28916132NBDV3OY'
  ),
  
  -- Public Annual Plans (with savings)
  (
    'Basic Annual',
    'Basic plan billed annually with 2 months savings. Includes 30-day free trial.',
    99.99,
    'USD',
    'P-5K304811TB8538255NBDV3RI'
  ),
  (
    'Premium Annual',
    'Premium plan billed annually with 2 months savings. Includes 30-day free trial.',
    199.99,
    'USD',
    'P-3HC58203J4124233XNBDV3TQ'
  ),
  
  -- Administrative Plan (unlisted)
  (
    'Owner Admin',
    'Owner/Administrator plan for netgleb@gmail.com - Unlisted plan with full access.',
    0.01,
    'USD',
    'P-71T62477MK683012GNBDV3XQ'
  )
ON CONFLICT (paypal_plan_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  updated_at = now();

-- Update the table comment to reflect completion
COMMENT ON TABLE public.subscription_plans IS 'Subscription plans table with verified PayPal Plan IDs. Ready for production use.';

-- Add helpful comments for each plan type
COMMENT ON COLUMN public.subscription_plans.paypal_plan_id IS 'Verified PayPal Plan ID from PayPal Developer Dashboard. All IDs confirmed active as of 2025-06-09.'; 