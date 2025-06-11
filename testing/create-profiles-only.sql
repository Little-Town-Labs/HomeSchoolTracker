-- Create Profiles for Existing Auth Users
-- Run this in Supabase SQL Editor after the auth users are created

-- Get the user IDs and create profiles
INSERT INTO public.profiles (id, email, role, name, created_at)
SELECT 
    u.id,
    u.email,
    CASE 
        WHEN u.email = 'admin@example.com' THEN 'admin'
        ELSE 'guardian'
    END as role,
    CASE 
        WHEN u.email = 'admin@example.com' THEN 'Test Admin User'
        WHEN u.email = 'testuser@example.com' THEN 'Test User'
        WHEN u.email = 'test.automation@example.com' THEN 'Test Automation User'
    END as name,
    NOW() as created_at
FROM auth.users u
WHERE u.email IN (
    'admin@example.com',
    'testuser@example.com', 
    'test.automation@example.com'
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    name = EXCLUDED.name;

-- Verify the profiles were created
SELECT 
    p.id,
    p.email,
    p.role,
    p.name,
    p.created_at
FROM public.profiles p
WHERE p.email IN (
    'admin@example.com',
    'testuser@example.com', 
    'test.automation@example.com'
)
ORDER BY p.email; 