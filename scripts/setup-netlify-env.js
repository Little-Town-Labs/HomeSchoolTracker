#!/usr/bin/env node

/**
 * Netlify Environment Variables Setup Script
 * 
 * This script helps configure environment variables for your Netlify site.
 * It can be used as an alternative to the CLI when PowerShell has issues.
 * 
 * Usage:
 * 1. Install dependencies: npm install netlify
 * 2. Set NETLIFY_AUTH_TOKEN environment variable
 * 3. Run: node scripts/setup-netlify-env.js
 */

const { NetlifyAPI } = require('netlify');

const SITE_ID = 'ef25c9b7-068c-4aa0-a384-86fce327ddba';

// Environment variables that should be marked as secrets
const SECRET_VARS = [
  'PAYPAL_CLIENT_SECRET',
  'VITE_PAYPAL_SECRET', 
  'VITE_RESEND_API_KEY'
];

// Production URLs (already set, but included for reference)
const PRODUCTION_VARS = {
  'FRONTEND_PAYPAL_CANCEL_URL': 'https://homeschooltracker.netlify.app/subscribe/cancel',
  'FRONTEND_PAYPAL_RETURN_URL': 'https://homeschooltracker.netlify.app/subscribe/success'
};

async function setupNetlifyEnvironment() {
  const authToken = process.env.NETLIFY_AUTH_TOKEN;
  
  if (!authToken) {
    console.error('❌ NETLIFY_AUTH_TOKEN environment variable is required');
    console.log('Get your token from: https://app.netlify.com/user/applications#personal-access-tokens');
    process.exit(1);
  }

  const client = new NetlifyAPI(authToken);

  try {
    console.log('🔧 Setting up Netlify environment variables...');

    // Get current environment variables
    const envVars = await client.getEnvVars({ account_slug: 'little-town-labs', site_id: SITE_ID });
    console.log(`📋 Found ${envVars.length} existing environment variables`);

    // Mark secrets as secret (if they exist)
    for (const secretVar of SECRET_VARS) {
      const existingVar = envVars.find(v => v.key === secretVar);
      if (existingVar && !existingVar.is_secret) {
        console.log(`🔒 Marking ${secretVar} as secret...`);
        
        await client.updateEnvVar({
          account_slug: 'little-town-labs',
          site_id: SITE_ID,
          key: secretVar,
          is_secret: true
        });
        
        console.log(`✅ ${secretVar} marked as secret`);
      } else if (existingVar) {
        console.log(`✅ ${secretVar} already marked as secret`);
      } else {
        console.log(`⚠️  ${secretVar} not found`);
      }
    }

    console.log('🎉 Environment setup complete!');

  } catch (error) {
    console.error('❌ Error setting up environment:', error.message);
    
    if (error.status === 401) {
      console.log('Check your NETLIFY_AUTH_TOKEN is valid');
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupNetlifyEnvironment();
}

module.exports = { setupNetlifyEnvironment }; 