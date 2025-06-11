-- Add admin role to profiles table role check constraint
ALTER TABLE profiles
DROP CONSTRAINT profiles_role_check,
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('guardian', 'student', 'admin'));

-- Add policy for admin access
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);