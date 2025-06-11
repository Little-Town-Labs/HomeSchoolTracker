-- HomeSchool Tracker - Test User Seeding Script
-- Run this directly in Supabase SQL Editor
-- 
-- This script creates test users for subscription flow testing
-- 
-- Instructions:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this entire script
-- 3. Click "Run"

-- Clean up existing test users first
DELETE FROM auth.users WHERE email IN (
  'admin@example.com',
  'testuser@example.com', 
  'test.automation@example.com'
);

-- Enable the auth.create_user function (in case it's not enabled)
-- This function is available in Supabase for creating users via SQL

-- Create Test Users
-- Note: Supabase uses auth.create_user() function for programmatic user creation

-- 1. Admin User
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Create auth user
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'admin@example.com',
        crypt('secureAdminPassword123', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"role": "admin", "name": "Test Admin User"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ) RETURNING id INTO admin_user_id;

    -- Create profile
    INSERT INTO public.profiles (id, email, role, name, created_at) VALUES (
        admin_user_id,
        'admin@example.com',
        'admin',
        'Test Admin User',
        NOW()
    );
    
    RAISE NOTICE 'Created admin user: %', admin_user_id;
END $$;

-- 2. Test User
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    -- Create auth user
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'testuser@example.com',
        crypt('secureUserPassword123', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"role": "guardian", "name": "Test User"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ) RETURNING id INTO test_user_id;

    -- Create profile
    INSERT INTO public.profiles (id, email, role, name, created_at) VALUES (
        test_user_id,
        'testuser@example.com',
        'guardian',
        'Test User',
        NOW()
    );
    
    RAISE NOTICE 'Created test user: %', test_user_id;
END $$;

-- 3. Automation User
DO $$
DECLARE
    auto_user_id uuid;
BEGIN
    -- Create auth user
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'test.automation@example.com',
        crypt('AutoTest123!', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"role": "guardian", "name": "Test Automation User"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ) RETURNING id INTO auto_user_id;

    -- Create profile
    INSERT INTO public.profiles (id, email, role, name, created_at) VALUES (
        auto_user_id,
        'test.automation@example.com',
        'guardian',
        'Test Automation User',
        NOW()
    );
    
    RAISE NOTICE 'Created automation user: %', auto_user_id;
END $$;

-- Verify the users were created
SELECT 
    u.id,
    u.email,
    p.role,
    p.name,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    u.created_at
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email IN (
    'admin@example.com',
    'testuser@example.com', 
    'test.automation@example.com'
)
ORDER BY u.email;

-- Show summary
DO $$
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ Test Users Created Successfully!';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Login Credentials:';
    RAISE NOTICE '• admin@example.com / secureAdminPassword123 (admin)';
    RAISE NOTICE '• testuser@example.com / secureUserPassword123 (guardian)';
    RAISE NOTICE '• test.automation@example.com / AutoTest123! (guardian)';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Ready for subscription testing!';
END $$; 