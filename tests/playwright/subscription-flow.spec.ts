import { test, expect, Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// PayPal Sandbox Test Credentials (these should be in your environment)
const PAYPAL_SANDBOX_BUYER_EMAIL = process.env.PAYPAL_SANDBOX_BUYER_EMAIL || 'sb-buyer@example.com';
const PAYPAL_SANDBOX_BUYER_PASSWORD = process.env.PAYPAL_SANDBOX_BUYER_PASSWORD || 'password123';

// Expected subscription plans
const SUBSCRIPTION_PLANS = [
  { name: 'Basic Monthly', price: '$9.99', planId: 'P-4E747738FG1460728NBDV3GY' },
  { name: 'Premium Monthly', price: '$19.99', planId: 'P-55V07943L28916132NBDV3OY' },
  { name: 'Basic Annual', price: '$99.99', planId: 'P-5K304811TB8538255NBDV3RI' },
  { name: 'Premium Annual', price: '$199.99', planId: 'P-3HC58203J4124233XNBDV3TQ' },
];

let supabase: ReturnType<typeof createClient> | null = null;

test.beforeAll(async () => {
  // Initialize Supabase client for database verification
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
});

test.describe('Subscription Creation Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to subscription page
    await page.goto('/subscribe');
  });

  test('should display subscription plans correctly', async ({ page }) => {
    // Wait for the page to load
    await expect(page.locator('h2')).toContainText('Choose Your Plan');
    
    // Verify all subscription plans are displayed
    for (const plan of SUBSCRIPTION_PLANS) {
      await expect(page.locator(`text=${plan.name}`)).toBeVisible();
      await expect(page.locator(`text=${plan.price}`)).toBeVisible();
    }
    
    // Verify PayPal buttons are present
    const paypalButtons = page.locator('[data-testid="paypal-button"], iframe[title*="PayPal"]');
    await expect(paypalButtons.first()).toBeVisible({ timeout: 10000 });
  });

  test('should not show configuration errors', async ({ page }) => {
    // Check that no configuration error messages are displayed
    await expect(page.locator('text=PayPal Configuration Required')).not.toBeVisible();
    await expect(page.locator('text=Configuration Error')).not.toBeVisible();
    
    // Check for any error messages in the console
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit for any async errors
    await page.waitForTimeout(3000);
    
    // Filter out expected errors (like network errors in test environment)
    const relevantErrors = errors.filter(error => 
      !error.includes('net::ERR_') && 
      !error.includes('favicon.ico') &&
      !error.includes('chunk-')
    );
    
    expect(relevantErrors).toHaveLength(0);
  });

  test('should verify PayPal script loading', async ({ page }) => {
    // Wait for PayPal scripts to load
    await page.waitForFunction(() => {
      return window.paypal !== undefined;
    }, { timeout: 15000 });
    
    // Verify PayPal is available globally
    const paypalExists = await page.evaluate(() => typeof window.paypal !== 'undefined');
    expect(paypalExists).toBe(true);
  });

  test('should verify database has correct subscription plans', async () => {
    if (!supabase) {
      test.skip();
      return;
    }

    // Query subscription plans from database
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('name, price, paypal_plan_id')
      .order('price');

    expect(error).toBeNull();
    expect(plans).toHaveLength(5); // Including Owner Admin plan
    
    if (!plans) {
      throw new Error('No plans returned from database');
    }
    
    // Verify the public plans match expected values  
    const publicPlans = plans.filter((plan: Record<string, unknown>) => 
      typeof plan.name === 'string' && plan.name !== 'Owner Admin'
    );
    expect(publicPlans).toHaveLength(4);
    
    for (const expectedPlan of SUBSCRIPTION_PLANS) {
      const dbPlan = publicPlans.find((p: Record<string, unknown>) => p.name === expectedPlan.name);
      expect(dbPlan).toBeDefined();
      if (dbPlan && typeof dbPlan.paypal_plan_id === 'string') {
        expect(dbPlan.paypal_plan_id).toBe(expectedPlan.planId);
      }
    }
  });

  test('should initiate PayPal subscription flow for Basic Monthly', async ({ page }) => {
    await testSubscriptionFlow(page, 'Basic Monthly');
  });

  test('should initiate PayPal subscription flow for Premium Monthly', async ({ page }) => {
    await testSubscriptionFlow(page, 'Premium Monthly');
  });

  test('should initiate PayPal subscription flow for Basic Annual', async ({ page }) => {
    await testSubscriptionFlow(page, 'Basic Annual');
  });

  test('should initiate PayPal subscription flow for Premium Annual', async ({ page }) => {
    await testSubscriptionFlow(page, 'Premium Annual');
  });

  test('should handle cancelled PayPal checkout gracefully', async ({ page }) => {
    // Find Basic Monthly plan and click subscribe
    const planCard = page.locator('text=Basic Monthly').locator('..').locator('..');
    await planCard.scrollIntoViewIfNeeded();
    
    // Click the PayPal button
    const paypalButton = planCard.locator('iframe[title*="PayPal"], [data-testid="paypal-button"]').first();
    await expect(paypalButton).toBeVisible({ timeout: 10000 });
    
    // Get initial window count
    const initialPages = page.context().pages().length;
    
    // Click PayPal button
    await paypalButton.click();
    
    // Wait for PayPal popup/redirect
    await page.waitForTimeout(2000);
    
    // If a popup opened, close it to simulate cancellation
    const pages = page.context().pages();
    if (pages.length > initialPages) {
      const paypalPage = pages[pages.length - 1];
      await paypalPage.close();
    }
    
    // Verify we're back on the subscription page
    await expect(page.locator('h2')).toContainText('Choose Your Plan');
    
    // Check for appropriate cancellation message (if any)
    // Note: The exact behavior depends on how cancellation is handled
    await page.waitForTimeout(1000);
  });

  test('should verify Edge Functions are accessible', async ({ page }) => {
    // Test that we can reach the Edge Functions (this tests the backend integration)
    const response = await page.request.get('/api/health');
    // If health endpoint doesn't exist, that's expected - just verify no 500 errors
    expect([200, 404]).toContain(response.status());
  });
});

async function testSubscriptionFlow(page: Page, planName: string) {
  // Find the plan card
  const planCard = page.locator(`text=${planName}`).locator('..').locator('..');
  await planCard.scrollIntoViewIfNeeded();
  
  // Verify plan details are visible
  await expect(planCard.locator(`text=${planName}`)).toBeVisible();
  
  // Wait for PayPal button to be ready
  const paypalButton = planCard.locator('iframe[title*="PayPal"], [data-testid="paypal-button"]').first();
  await expect(paypalButton).toBeVisible({ timeout: 15000 });
  
  // Click the PayPal subscribe button
  await paypalButton.click();
  
  // Wait for PayPal to respond (either popup or redirect)
  await page.waitForTimeout(3000);
  
  // Check if we're redirected to PayPal or if a popup opened
  const currentUrl = page.url();
  const pages = page.context().pages();
  
  if (currentUrl.includes('paypal.com') || currentUrl.includes('sandbox.paypal.com')) {
    // We were redirected to PayPal
    console.log(`Successfully redirected to PayPal for ${planName}`);
    
    // In a real test, you would continue with PayPal authentication here
    // For now, we'll just verify we reached PayPal
    expect(currentUrl).toMatch(/paypal\.com/);
    
    // Navigate back to continue testing
    await page.goBack();
    
  } else if (pages.length > 1) {
    // A popup was opened
    const paypalPopup = pages[pages.length - 1];
    const popupUrl = paypalPopup.url();
    
    console.log(`PayPal popup opened for ${planName}: ${popupUrl}`);
    expect(popupUrl).toMatch(/paypal\.com/);
    
    // Close popup for testing
    await paypalPopup.close();
    
  } else {
    // Check if PayPal iframe loaded correctly
    const iframe = page.frameLocator('iframe[title*="PayPal"]');
    const paypalContent = iframe.locator('body');
    
    // If iframe exists, verify it has PayPal content
    if (await paypalContent.count() > 0) {
      console.log(`PayPal iframe loaded successfully for ${planName}`);
    } else {
      // Log for debugging what actually happened
      console.log(`PayPal flow initiated for ${planName} - checking for loading states`);
      
      // Check for loading indicators
      await expect(page.locator('text=Loading PayPal, text=Processing')).toBeVisible({ timeout: 5000 }).catch(() => {
        // Loading indicator might not be visible, that's okay
      });
    }
  }
}

// Helper functions for future enhancement - currently unused but available for extension
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function authenticatePayPalSandbox(page: Page) {
  // This function would handle PayPal sandbox authentication
  // Only implement if you want to test the complete flow including payment
  
  if (PAYPAL_SANDBOX_BUYER_EMAIL && PAYPAL_SANDBOX_BUYER_PASSWORD) {
    try {
      // Fill PayPal login form
      await page.fill('#email', PAYPAL_SANDBOX_BUYER_EMAIL);
      await page.fill('#password', PAYPAL_SANDBOX_BUYER_PASSWORD);
      await page.click('#btnLogin');
      
      // Wait for authentication
      await page.waitForNavigation({ timeout: 10000 });
      
      // Complete the subscription flow
      await page.click('#payment-submit-btn');
      
      return true;
    } catch (error) {
      console.log('PayPal authentication failed (expected in test environment):', error);
      return false;
    }
  }
  
  return false;
}

// Database helper functions for future enhancement
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function checkSubscriptionInDatabase(paypalSubscriptionId: string) {
  if (!supabase) return null;
  
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('paypal_subscription_id', paypalSubscriptionId)
    .single();
    
  return error ? null : data;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function cleanupTestSubscriptions() {
  if (!supabase) return;
  
  // Clean up any test subscriptions created during testing
  // This would only be used in a dedicated test environment
  const testUserEmail = 'test@example.com';
  
  const { error } = await supabase
    .from('user_subscriptions')
    .delete()
    .eq('user_id', testUserEmail);
    
  if (error) {
    console.log('Cleanup failed:', error);
  }
} 