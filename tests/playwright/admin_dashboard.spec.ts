import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  // Setup admin login before each test in this describe block
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login'); // Adjust path as needed

    // Fill in admin credentials (use environment variables or a config file in real tests)
    await page.locator('input[name="email"]').fill('admin@example.com');
    await page.locator('input[name="password"]').fill('secureAdminPassword123');

    // Click login button
    await page.locator('button[type="submit"]').click();

    // Wait for navigation to the admin dashboard or check for a dashboard element
    await expect(page).toHaveURL('/admin/dashboard'); // Verify redirect
    await expect(page.locator('h1')).toContainText('Admin Dashboard'); // Verify dashboard loaded
  });

  test('should display the admin dashboard for admin users', async ({ page }) => {
    // Login is handled in beforeEach, so we should already be on the dashboard
    // or can navigate safely if needed (though beforeEach should ensure it)
    // await page.goto('/admin/dashboard'); // Usually not needed if beforeEach worked

    // Verify key elements are present
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    await expect(page.locator('[data-testid="user-subscription-list"]')).toBeVisible();
    // Add more specific checks if needed, e.g., checking for specific table headers
    await expect(page.locator('table th')).toContainText(['User Email', 'Plan', 'Status', 'Expires']); // Example headers
  });

  // This test needs to run independently or handle logout/login differently
  // Grouping tests requiring different auth states is better practice
  test.describe('Non-Admin Access', () => {
    // No beforeEach admin login here
    test('should restrict access for non-admin users', async ({ page }) => {
      // 1. Ensure no admin is logged in (or log in as a non-admin)
      //    For simplicity, we'll assume no one is logged in initially for this test.
      //    A better approach: programmatically log in as a non-admin user.
      await page.goto('/login'); // Start at login page
      await page.locator('input[name="email"]').fill('user@example.com');
      await page.locator('input[name="password"]').fill('userPassword123');
      await page.locator('button[type="submit"]').click();
      // Wait for login redirect (e.g., to user dashboard)
      await expect(page).toHaveURL('/dashboard'); // Assuming non-admin redirect path

      // 2. Attempt to access admin dashboard directly
      await page.goto('/admin/dashboard');

      // 3. Verify redirection away from admin dashboard
      await expect(page).not.toHaveURL('/admin/dashboard');
      // Verify redirection to a specific page (e.g., home or user dashboard)
      await expect(page).toHaveURL('/dashboard'); // Or '/' or '/login' depending on app logic

      // 4. (Optional) Check for an "Access Denied" message if the app shows one
      // await expect(page.locator('[data-testid="access-denied-message"]')).toBeVisible();
    });
  });


  test('should display user subscription list', async ({ page }) => {
    // Login handled by outer describe's beforeEach
    // await page.goto('/admin/dashboard'); // Likely already here

    // Verify the list component is present and potentially has rows
    const listLocator = page.locator('[data-testid="user-subscription-list"]');
    await expect(listLocator).toBeVisible();

    // Check if the table within the list has at least one data row (header row + data row)
    // This depends heavily on test data being present
    // await expect(listLocator.locator('table tbody tr')).toHaveCountGreaterThan(0);
    // For now, just check visibility
  });

  test('should filter subscriptions by status', async ({ page }) => {
    // Login handled by outer describe's beforeEach
    
    // Verify the filter component exists
    const filterComponent = page.locator('[data-testid="subscription-filter"]');
    await expect(filterComponent).toBeVisible();
    
    // Test filtering by 'active' status
    await filterComponent.locator('select').selectOption('active');
    await page.waitForTimeout(500); // Allow time for filtering to apply
    
    // Verify filtered results only show active subscriptions
    const statusCells = page.locator('[data-testid="subscription-status-cell"]');
    const count = await statusCells.count();
    
    // If there are results, verify they all have the correct status
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await expect(statusCells.nth(i)).toContainText('Active');
      }
    }
  });

  test('should search subscriptions by user email', async ({ page }) => {
    // Login handled by outer describe's beforeEach
    
    // Verify the search component exists
    const searchInput = page.locator('[data-testid="subscription-search"]');
    await expect(searchInput).toBeVisible();
    
    // Test searching for a specific email
    const testEmail = 'test@example.com';
    await searchInput.fill(testEmail);
    await searchInput.press('Enter');
    await page.waitForTimeout(500); // Allow time for search to apply
    
    // Verify search results contain the email
    const emailCells = page.locator('[data-testid="subscription-email-cell"]');
    const count = await emailCells.count();
    
    // If there are results, verify they match the search term
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await expect(emailCells.nth(i)).toContainText(testEmail);
      }
    } else {
      // If no results, verify the "no results" message is displayed
      await expect(page.locator('[data-testid="no-results-message"]')).toBeVisible();
    }
  });
});