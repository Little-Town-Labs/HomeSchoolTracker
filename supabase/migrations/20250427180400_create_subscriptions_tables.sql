-- Add role column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles
        ADD COLUMN role text DEFAULT 'user';
        RAISE NOTICE 'Column profiles.role added.';
    ELSE
        RAISE NOTICE 'Column profiles.role already exists.';
    END IF;
END
$$;

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    description text,
    price numeric NOT NULL CHECK (price >= 0), -- Ensure price is non-negative
    currency text NOT NULL,
    paypal_plan_id text UNIQUE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);

COMMENT ON TABLE public.subscription_plans IS 'Stores details about available subscription plans.';
COMMENT ON COLUMN public.subscription_plans.paypal_plan_id IS 'The corresponding Plan ID in PayPal.';

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    paypal_subscription_id text UNIQUE NOT NULL,
    status text NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending', 'trial')), -- Added 'pending', 'trial'
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone, -- Can be null for ongoing subscriptions
    trial_end_date timestamp with time zone, -- Added for trial periods
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);

COMMENT ON TABLE public.user_subscriptions IS 'Tracks user subscriptions to specific plans.';
COMMENT ON COLUMN public.user_subscriptions.status IS 'Current status of the user''s subscription.';
COMMENT ON COLUMN public.user_subscriptions.paypal_subscription_id IS 'The corresponding Subscription ID in PayPal.';

-- Add indexes for foreign keys and common lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON public.user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_paypal_id ON public.user_subscriptions(paypal_subscription_id);

-- Note: RLS policies should be added in a separate migration or via the Supabase UI
-- after confirming the roles and access patterns.
-- Example (DO NOT RUN IN THIS MIGRATION):
-- ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access" ON public.subscription_plans FOR SELECT USING (true);
-- ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow individual user read access" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Allow admin full access" ON public.user_subscriptions FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid())); -- Assumes an is_admin function