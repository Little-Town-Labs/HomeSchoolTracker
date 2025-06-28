-- Add subscription exemption functionality to profiles table
-- This allows certain users (like the owner) to be exempted from subscription requirements

-- 1. Add subscription_exempt column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_exempt BOOLEAN DEFAULT false;

-- 2. Add comment for documentation
COMMENT ON COLUMN public.profiles.subscription_exempt IS 'Allows users to bypass subscription requirements. Only modifiable by admins.';

-- 3. Create index for efficient exemption queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_exempt ON public.profiles(subscription_exempt) WHERE subscription_exempt = true;

-- 4. Update RLS policy to prevent users from self-exempting
-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new update policy that prevents users from changing exemption status
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT p.role FROM public.profiles p WHERE p.id = public.profiles.id) AND
    subscription_exempt = (SELECT p.subscription_exempt FROM public.profiles p WHERE p.id = public.profiles.id)
  );

-- 5. Create admin-only policy for exemption management
CREATE POLICY "Admins can manage subscription exemptions" ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles admin_profile 
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles admin_profile 
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

-- 6. Create function to safely update exemption status (admin only)
CREATE OR REPLACE FUNCTION public.update_user_exemption(
  target_user_id UUID,
  exempt_status BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Check if current user is admin
  SELECT role INTO current_user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can update exemption status';
  END IF;
  
  -- Update the exemption status
  UPDATE public.profiles
  SET subscription_exempt = exempt_status
  WHERE id = target_user_id;
  
  RETURN FOUND;
END;
$$;

-- 7. Grant execute permission to authenticated users (function will check admin role internally)
GRANT EXECUTE ON FUNCTION public.update_user_exemption TO authenticated;

-- 8. Add RLS policy for the function
CREATE POLICY "Admins can execute exemption function" ON public.profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles admin_profile 
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  ); 