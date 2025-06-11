/*
  # User Management Enhancements

  1. Updates
     - Add status column to profiles table
     - Create user_activity table for audit purposes
     - Add necessary indexes and constraints

  2. Security
     - Add RLS policies for user_activity table
     - Ensure only admins can access certain operations
*/

-- Add status column to profiles table
ALTER TABLE profiles
ADD COLUMN status text NOT NULL DEFAULT 'active' 
CHECK (status IN ('active', 'suspended', 'pending', 'deactivated'));

-- Create user_activity table for audit purposes
CREATE TABLE user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  actor_id uuid REFERENCES auth.users(id) NOT NULL,
  activity_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_actor_id ON user_activity(actor_id);
CREATE INDEX idx_user_activity_activity_type ON user_activity(activity_type);
CREATE INDEX idx_user_activity_created_at ON user_activity(created_at);
CREATE INDEX idx_profiles_status ON profiles(status);

-- Enable RLS on user_activity table
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Policies for user_activity
CREATE POLICY "Admins can view all user activity"
  ON user_activity
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own activity"
  ON user_activity
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Only admins can insert user activity"
  ON user_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id uuid,
  p_activity_type text,
  p_description text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_id uuid;
BEGIN
  INSERT INTO user_activity (user_id, actor_id, activity_type, description, metadata)
  VALUES (p_user_id, auth.uid(), p_activity_type, p_description, p_metadata)
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$;

-- Create trigger to log profile status changes
CREATE OR REPLACE FUNCTION log_profile_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM log_user_activity(
      NEW.id,
      'status_change',
      format('Status changed from %s to %s', OLD.status, NEW.status),
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profile_status_change_trigger
AFTER UPDATE OF status ON profiles
FOR EACH ROW
EXECUTE FUNCTION log_profile_status_change();

-- Create trigger to log profile role changes
CREATE OR REPLACE FUNCTION log_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    PERFORM log_user_activity(
      NEW.id,
      'role_change',
      format('Role changed from %s to %s', OLD.role, NEW.role),
      jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profile_role_change_trigger
AFTER UPDATE OF role ON profiles
FOR EACH ROW
EXECUTE FUNCTION log_profile_role_change();