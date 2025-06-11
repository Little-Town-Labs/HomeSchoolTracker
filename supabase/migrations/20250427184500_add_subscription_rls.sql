-- Enable Row Level Security (RLS) for subscription tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
-- Allow public read access to all plans
CREATE POLICY "Allow public read access to plans"
ON public.subscription_plans
FOR SELECT
USING (true);

-- RLS Policies for user_subscriptions
-- Allow users to select their own subscription details
CREATE POLICY "Allow individual user read access"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users with the 'admin' role to perform all actions on any subscription
-- This assumes the 'role' column exists in the 'profiles' table and is populated.
CREATE POLICY "Allow admin full access to subscriptions"
ON public.user_subscriptions
FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Optional: Policy for service_role bypass (often useful for backend functions)
-- CREATE POLICY "Allow service_role full access"
-- ON public.user_subscriptions
-- FOR ALL
-- USING (auth.role() = 'service_role');

COMMENT ON POLICY "Allow admin full access to subscriptions" ON public.user_subscriptions IS 'Ensures only users with the admin role can manage all subscriptions.';