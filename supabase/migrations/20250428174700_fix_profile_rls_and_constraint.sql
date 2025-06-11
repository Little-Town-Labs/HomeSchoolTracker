-- Migration to fix profile RLS update vulnerability and role constraint

-- 1. Drop the existing CHECK constraint on profiles.role
-- The original constraint only allowed 'guardian' or 'student'.
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Add a new CHECK constraint allowing 'admin' role
-- This is necessary for admin users managing subscriptions, etc.
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check CHECK (role IN ('guardian', 'student', 'admin'));

-- 3. Drop the existing vulnerable UPDATE policy
-- The original policy allowed users to update any column in their profile, including 'role'.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- 4. Create a new UPDATE policy that prevents users from updating their own role
-- Users can update their own profile row (checked by USING and WITH CHECK on id matching auth.uid())
-- but the WITH CHECK clause also ensures the 'role' column value remains the same as the existing row's value *before* the update attempt.
-- This effectively prevents users from changing their own role via an UPDATE statement.
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT p.role FROM public.profiles p WHERE p.id = public.profiles.id) -- Ensures role is not changed during update
  );

-- Note: This policy allows updates to any *other* column (like 'name') as long as the role remains unchanged.
-- A more granular approach using GRANT/REVOKE on specific columns might be preferred in other scenarios,
-- but this fulfills the requirement of modifying the *policy* to prevent role updates as requested in the task.