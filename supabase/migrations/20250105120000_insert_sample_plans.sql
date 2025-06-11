-- Insert sample subscription plans
-- Note: Replace the paypal_plan_id values with actual PayPal Plan IDs from your PayPal Developer Dashboard

INSERT INTO public.subscription_plans (name, description, price, currency, paypal_plan_id)
VALUES 
  (
    'Basic Monthly',
    'Perfect for small families with up to 2 students',
    9.99,
    'USD',
    'P-REPLACE-WITH-REAL-BASIC-PLAN-ID' -- Replace with actual PayPal Plan ID
  ),
  (
    'Premium Monthly',
    'Ideal for larger families with unlimited students and advanced features',
    19.99,
    'USD',
    'P-REPLACE-WITH-REAL-PREMIUM-PLAN-ID' -- Replace with actual PayPal Plan ID
  )
ON CONFLICT (paypal_plan_id) DO NOTHING;

-- Add a comment explaining what needs to be done
COMMENT ON TABLE public.subscription_plans IS 'Subscription plans table. PayPal Plan IDs must be updated with real values from PayPal Developer Dashboard before going live.'; 