#!/usr/bin/env node

/**
 * Test User Creation Script for HomeSchool Tracker
 * 
 * This script creates the necessary test users for automated testing.
 * It uses Supabase Admin SDK to create both auth users and profiles.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test users to create
const testUsers = [
  {
    email: 'admin@example.com',
    password: 'secureAdminPassword123',
    role: 'admin',
    name: 'Test Admin User'
  },
  {
    email: 'testuser@example.com', 
    password: 'secureUserPassword123',
    role: 'guardian',
    name: 'Test User'
  },
  {
    email: 'test.automation@example.com',
    password: 'AutoTest123!',
    role: 'guardian',
    name: 'Test Automation User'
  }
];

async function createTestUser(userData) {
  console.log(`\n🔧 Creating test user: ${userData.email}`);
  
  try {
    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: userData.role,
        name: userData.name
      }
    });

    if (authError) {
      console.error(`❌ Failed to create auth user for ${userData.email}:`, authError.message);
      return false;
    }

    console.log(`✅ Auth user created with ID: ${authData.user.id}`);

    // Step 2: Create profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: userData.email,
        role: userData.role,
        name: userData.name,
        status: 'active'
      })
      .select()
      .single();

    if (profileError) {
      console.error(`❌ Failed to create profile for ${userData.email}:`, profileError.message);
      // Try to clean up auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return false;
    }

    console.log(`✅ Profile created successfully`);
    console.log(`   - ID: ${profileData.id}`);
    console.log(`   - Email: ${profileData.email}`);
    console.log(`   - Role: ${profileData.role}`);
    console.log(`   - Name: ${profileData.name}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Unexpected error creating user ${userData.email}:`, error.message);
    return false;
  }
}

async function cleanupExistingTestUsers() {
  console.log('🧹 Cleaning up existing test users...');
  
  const testEmails = testUsers.map(u => u.email);
  
  try {
    // Get existing profiles to find user IDs
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('email', testEmails);

    if (existingProfiles && existingProfiles.length > 0) {
      console.log(`Found ${existingProfiles.length} existing test users to clean up`);
      
      for (const profile of existingProfiles) {
        console.log(`   Deleting user: ${profile.email}`);
        
        // Delete auth user (this will cascade to profile due to FK constraint)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(profile.id);
        if (deleteError) {
          console.error(`   ❌ Failed to delete ${profile.email}:`, deleteError.message);
        } else {
          console.log(`   ✅ Deleted ${profile.email}`);
        }
      }
    } else {
      console.log('✅ No existing test users found');
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
}

async function verifyTestUsers() {
  console.log('\n🔍 Verifying created test users...');
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, role, name, status, created_at')
    .in('email', testUsers.map(u => u.email))
    .order('email');

  if (error) {
    console.error('❌ Error verifying users:', error.message);
    return false;
  }

  console.log('\n📋 Test Users Created:');
  console.table(profiles);
  
  return profiles.length === testUsers.length;
}

async function main() {
  console.log('🚀 HomeSchool Tracker Test User Setup');
  console.log('=====================================');
  
  try {
    // Step 1: Cleanup existing test users
    await cleanupExistingTestUsers();
    
    // Step 2: Create test users
    console.log('\n📝 Creating test users...');
    let successCount = 0;
    
    for (const userData of testUsers) {
      const success = await createTestUser(userData);
      if (success) successCount++;
    }
    
    console.log(`\n📊 Creation Summary: ${successCount}/${testUsers.length} users created successfully`);
    
    if (successCount === testUsers.length) {
      // Step 3: Verify all users
      const allVerified = await verifyTestUsers();
      
      if (allVerified) {
        console.log('\n🎉 All test users created and verified successfully!');
        console.log('\n📖 Test Credentials:');
        testUsers.forEach(user => {
          console.log(`   ${user.email} / ${user.password} (${user.role})`);
        });
        
        console.log('\n✅ Ready for automated testing!');
        process.exit(0);
      } else {
        console.log('\n❌ User verification failed');
        process.exit(1);
      }
    } else {
      console.log('\n❌ Not all users were created successfully');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
main(); 