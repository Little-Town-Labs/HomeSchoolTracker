/**
 * Database Subscription Checker
 * Usage: node testing/check-subscriptions.js
 * 
 * This script helps verify subscription creation during testing
 */

import { createClient } from '@supabase/supabase-js';

// Note: Update these with your actual Supabase credentials
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSubscriptionPlans() {
  console.log('🔍 Checking subscription plans...');
  
  const { data: plans, error } = await supabase
    .from('subscription_plans')
    .select('id, name, price, currency, paypal_plan_id')
    .order('price');
    
  if (error) {
    console.error('❌ Error fetching plans:', error);
    return;
  }
  
  console.log('✅ Available subscription plans:');
  console.table(plans);
}

async function checkUserSubscriptions() {
  console.log('\n🔍 Checking user subscriptions...');
  
  const { data: subscriptions, error } = await supabase
    .from('user_subscriptions')
    .select(`
      id,
      user_id,
      subscription_plan_id,
      paypal_subscription_id,
      status,
      current_period_start,
      current_period_end,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('❌ Error fetching subscriptions:', error);
    return;
  }
  
  if (subscriptions.length === 0) {
    console.log('📄 No user subscriptions found yet.');
    return;
  }
  
  console.log('✅ Recent user subscriptions:');
  console.table(subscriptions);
}

async function checkRecentActivity() {
  console.log('\n🔍 Checking recent subscription activity (last 24 hours)...');
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const { data: recent, error } = await supabase
    .from('user_subscriptions')
    .select(`
      id,
      paypal_subscription_id,
      status,
      created_at,
      subscription_plans(name, price)
    `)
    .gte('created_at', yesterday.toISOString())
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('❌ Error fetching recent activity:', error);
    return;
  }
  
  if (recent.length === 0) {
    console.log('📄 No subscription activity in the last 24 hours.');
    return;
  }
  
  console.log('✅ Recent subscription activity:');
  recent.forEach((sub, index) => {
    console.log(`${index + 1}. ${sub.subscription_plans?.name} - ${sub.status} - ${sub.created_at}`);
    console.log(`   PayPal ID: ${sub.paypal_subscription_id}`);
  });
}

async function main() {
  console.log('🚀 Subscription Database Checker\n');
  
  try {
    await checkSubscriptionPlans();
    await checkUserSubscriptions();
    await checkRecentActivity();
    
    console.log('\n✅ Database check complete!');
    console.log('\n💡 Tips:');
    console.log('- Run this script after each subscription test');
    console.log('- Check PayPal subscription IDs match PayPal sandbox');
    console.log('- Verify trial periods are correctly set');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { checkSubscriptionPlans, checkUserSubscriptions, checkRecentActivity }; 