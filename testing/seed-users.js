#!/usr/bin/env node

/**
 * Test User Seeding Script for HomeSchool Tracker
 * 
 * Usage: SUPABASE_SERVICE_ROLE_KEY=your_key node testing/seed-users.js
 * 
 * This script creates test users for subscription flow testing.
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ SUPABASE_URL not found in environment');
  console.error('   Set VITE_SUPABASE_URL or SUPABASE_URL');
  process.exit(1);
}

if (!SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  console.error('   Run: SUPABASE_SERVICE_ROLE_KEY=your_key node testing/seed-users.js');
  console.error('   Get your service role key from Supabase Dashboard → Settings → API');
  process.exit(1);
}

// Create admin client
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
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

async function createUser(userData) {
  console.log(`\n🔧 Creating: ${userData.email}`);
  
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: { role: userData.role, name: userData.name }
    });

    if (authError) {
      console.error(`❌ Auth error: ${authError.message}`);
      return false;
    }

    console.log(`✅ Auth user created: ${authData.user.id}`);

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: userData.email,
        role: userData.role,
        name: userData.name
      });

    if (profileError) {
      console.error(`❌ Profile error: ${profileError.message}`);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return false;
    }

    console.log(`✅ Profile created successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Unexpected error: ${error.message}`);
    return false;
  }
}

async function cleanupExisting() {
  console.log('🧹 Cleaning up existing test users...');
  
  const emails = testUsers.map(u => u.email);
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('email', emails);

  if (profiles && profiles.length > 0) {
    for (const profile of profiles) {
      console.log(`   Deleting: ${profile.email}`);
      await supabase.auth.admin.deleteUser(profile.id);
    }
  }
}

async function verifyUsers() {
  console.log('\n🔍 Verifying users...');
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('email, role, name')
    .in('email', testUsers.map(u => u.email))
    .order('email');

  console.log('\n📋 Created Users:');
  console.table(profiles);
  
  return profiles?.length === testUsers.length;
}

async function main() {
  console.log('🚀 HomeSchool Tracker Test User Setup');
  console.log('=====================================');
  
  try {
    await cleanupExisting();
    
    console.log('\n📝 Creating test users...');
    let success = 0;
    
    for (const user of testUsers) {
      if (await createUser(user)) success++;
    }
    
    console.log(`\n📊 Summary: ${success}/${testUsers.length} users created`);
    
    if (success === testUsers.length) {
      await verifyUsers();
      
      console.log('\n🎉 Test users ready for subscription testing!');
      console.log('\n📖 Login Credentials:');
      testUsers.forEach(u => {
        console.log(`   ${u.email} / ${u.password} (${u.role})`);
      });
      
      console.log('\n✅ You can now run Playwright tests with these users!');
    } else {
      console.log('\n❌ Some users failed to create');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  }
}

main(); 