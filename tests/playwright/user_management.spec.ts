import { test, expect } from '@playwright/test';

test.describe('User Management System', () => {
  // Admin credentials for testing
  const adminEmail = 'admin@example.com';
  const adminPassword = 'secureAdminPassword123';
  
  // Test user credentials
  const testUserEmail = 'testuser@example.com';
  const testUserPassword = 'secureUserPassword123';

  // Setup admin login before each test in this describe block
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill in admin credentials
    await page.locator('input[name="email"]').fill(adminEmail);
    await page.locator('input[name="password"]').fill(adminPassword);

    // Click login button
    await page.locator('button[type="submit"]').click();

    // Wait for navigation to the admin dashboard
    await expect(page).toHaveURL('/admin/dashboard');
    
    // Navigate to user management section
    await page.getByRole('link', { name: /user management/i }).click();
    await expect(page).toHaveURL('/admin/users');
    await expect(page.locator('h2')).toContainText('User Management');
  });

  test('should display the user management interface with search filters', async ({ page }) => {
    // Verify search filters are present
    await expect(page.locator('[data-testid="user-search-filters"]')).toBeVisible();
    
    // Verify filter inputs
    await expect(page.getByPlaceholder('Search by name')).toBeVisible();
    await expect(page.getByPlaceholder('Search by email')).toBeVisible();
    await expect(page.locator('select[name="role"]')).toBeVisible();
    await expect(page.locator('select[name="status"]')).toBeVisible();
    
    // Verify search button
    await expect(page.getByRole('button', { name: /search/i })).toBeVisible();
  });

  test('should display user list with correct columns', async ({ page }) => {
    // Verify user list is present
    await expect(page.locator('[data-testid="user-list"]')).toBeVisible();
    
    // Verify column headers
    const headers = page.locator('table th');
    await expect(headers).toContainText(['Name', 'Email', 'Role', 'Status', 'Created', 'Actions']);
  });

  test('should filter users by name', async ({ page }) => {
    // Enter search term in name field
    await page.getByPlaceholder('Search by name').fill('Admin');
    
    // Click search button
    await page.getByRole('button', { name: /search/i }).click();
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Verify filtered results
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    
    // If there are results, verify they contain the search term
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const nameCell = rows.nth(i).locator('td').nth(0);
        await expect(nameCell).toContainText(/admin/i);
      }
    }
  });

  test('should filter users by email', async ({ page }) => {
    // Enter search term in email field
    await page.getByPlaceholder('Search by email').fill('admin');
    
    // Click search button
    await page.getByRole('button', { name: /search/i }).click();
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Verify filtered results
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    
    // If there are results, verify they contain the search term
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const emailCell = rows.nth(i).locator('td').nth(1);
        await expect(emailCell).toContainText(/admin/i);
      }
    }
  });

  test('should filter users by role', async ({ page }) => {
    // Select role filter
    await page.locator('select[name="role"]').selectOption('admin');
    
    // Click search button
    await page.getByRole('button', { name: /search/i }).click();
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Verify filtered results
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    
    // If there are results, verify they have the correct role
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const roleCell = rows.nth(i).locator('td').nth(2);
        await expect(roleCell).toContainText('admin');
      }
    }
  });

  test('should filter users by status', async ({ page }) => {
    // Select status filter
    await page.locator('select[name="status"]').selectOption('active');
    
    // Click search button
    await page.getByRole('button', { name: /search/i }).click();
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Verify filtered results
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    
    // If there are results, verify they have the correct status
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const statusCell = rows.nth(i).locator('td').nth(3);
        await expect(statusCell).toContainText('active');
      }
    }
  });

  test('should sort users by column', async ({ page }) => {
    // Get initial order of emails
    const emailCells = page.locator('table tbody tr td:nth-child(2)');
    const initialEmails = await emailCells.allTextContents();
    
    // Click on email header to sort
    await page.locator('table th').nth(1).click();
    
    // Wait for sorting to apply
    await page.waitForTimeout(500);
    
    // Get new order of emails
    const sortedEmails = await emailCells.allTextContents();
    
    // Verify order has changed (this is a simple check, might need refinement)
    expect(sortedEmails).not.toEqual(initialEmails);
  });

  test('should paginate through users', async ({ page }) => {
    // Check if pagination exists
    const pagination = page.locator('[data-testid="pagination"]');
    const isPaginationVisible = await pagination.isVisible();
    
    if (isPaginationVisible) {
      // Get current page users
      const initialRows = page.locator('table tbody tr');
      const firstUserEmail = await initialRows.first().locator('td').nth(1).textContent();
      
      // Click next page button
      await page.locator('[data-testid="pagination"] button').nth(-1).click();
      
      // Wait for page change
      await page.waitForTimeout(500);
      
      // Get new page users
      const newRows = page.locator('table tbody tr');
      const newFirstUserEmail = await newRows.first().locator('td').nth(1).textContent();
      
      // Verify different users are shown
      expect(newFirstUserEmail).not.toEqual(firstUserEmail);
    }
  });

  test('should open user role dialog and update role', async ({ page }) => {
    // Find a non-admin user to update
    const rows = page.locator('table tbody tr');
    let userIndex = -1;
    
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const roleCell = rows.nth(i).locator('td').nth(2);
      const role = await roleCell.textContent();
      if (role !== 'admin') {
        userIndex = i;
        break;
      }
    }
    
    // Skip test if no suitable user found
    if (userIndex === -1) {
      test.skip();
      return;
    }
    
    // Click edit role button for the user
    await rows.nth(userIndex).locator('[data-testid="edit-role-button"]').click();
    
    // Verify role dialog is open
    await expect(page.locator('[data-testid="user-role-dialog"]')).toBeVisible();
    
    // Select new role
    await page.locator('[data-testid="user-role-dialog"] select').selectOption('guardian');
    
    // Click update button
    await page.locator('[data-testid="user-role-dialog"] button[type="submit"]').click();
    
    // Wait for update to complete
    await page.waitForTimeout(1000);
    
    // Verify success notification
    await expect(page.locator('[role="alert"]')).toContainText(/success/i);
    
    // Verify role was updated
    const updatedRoleCell = rows.nth(userIndex).locator('td').nth(2);
    await expect(updatedRoleCell).toContainText('guardian');
  });

  test('should open user status dialog and update status', async ({ page }) => {
    // Find a non-admin user to update
    const rows = page.locator('table tbody tr');
    let userIndex = -1;
    
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const roleCell = rows.nth(i).locator('td').nth(2);
      const role = await roleCell.textContent();
      if (role !== 'admin') {
        userIndex = i;
        break;
      }
    }
    
    // Skip test if no suitable user found
    if (userIndex === -1) {
      test.skip();
      return;
    }
    
    // Click edit status button for the user
    await rows.nth(userIndex).locator('[data-testid="edit-status-button"]').click();
    
    // Verify status dialog is open
    await expect(page.locator('[data-testid="user-status-dialog"]')).toBeVisible();
    
    // Select new status
    await page.locator('[data-testid="user-status-dialog"] select').selectOption('suspended');
    
    // Add reason for suspension
    await page.locator('[data-testid="user-status-dialog"] textarea').fill('Testing status change');
    
    // Click update button
    await page.locator('[data-testid="user-status-dialog"] button[type="submit"]').click();
    
    // Wait for update to complete
    await page.waitForTimeout(1000);
    
    // Verify success notification
    await expect(page.locator('[role="alert"]')).toContainText(/success/i);
    
    // Verify status was updated
    const updatedStatusCell = rows.nth(userIndex).locator('td').nth(3);
    await expect(updatedStatusCell).toContainText('suspended');
  });

  test('should view user profile and activity', async ({ page }) => {
    // Click view profile button for the first user
    await page.locator('table tbody tr').first().locator('[data-testid="view-profile-button"]').click();
    
    // Verify profile view is open
    await expect(page.locator('h3')).toContainText('User Profile');
    
    // Verify profile information is displayed
    await expect(page.locator('h4')).toBeVisible(); // User name
    await expect(page.locator('svg + span')).toBeVisible(); // Email
    
    // Verify activity log section
    await expect(page.getByText('Activity Log')).toBeVisible();
    
    // Test activity filter if activities exist
    const activityItems = page.locator('[data-testid="activity-item"]');
    const hasActivities = await activityItems.count() > 0;
    
    if (hasActivities) {
      // Select an activity type filter
      await page.locator('select').nth(1).selectOption({ index: 1 });
      
      // Wait for filter to apply
      await page.waitForTimeout(500);
      
      // Verify filtered activities
      await expect(activityItems).toBeVisible();
    }
    
    // Close profile view
    await page.getByRole('button', { name: 'Close' }).click();
    
    // Verify profile view is closed
    await expect(page.locator('h3')).not.toContainText('User Profile');
  });

  test.describe('Security Tests', () => {
    test('should prevent non-admin users from accessing user management', async ({ page }) => {
      // Logout admin
      await page.getByRole('button', { name: /logout/i }).click();
      
      // Login as regular user
      await page.goto('/login');
      await page.locator('input[name="email"]').fill(testUserEmail);
      await page.locator('input[name="password"]').fill(testUserPassword);
      await page.locator('button[type="submit"]').click();
      
      // Wait for login to complete
      await page.waitForTimeout(1000);
      
      // Try to access user management page
      await page.goto('/admin/users');
      
      // Verify redirect away from admin page
      await expect(page).not.toHaveURL('/admin/users');
    });
    
    test('should prevent admin from changing their own role', async ({ page }) => {
      // Find the admin user in the list
      const rows = page.locator('table tbody tr');
      let adminIndex = -1;
      
      const count = await rows.count();
      for (let i = 0; i < count; i++) {
        const emailCell = rows.nth(i).locator('td').nth(1);
        const email = await emailCell.textContent();
        if (email === adminEmail) {
          adminIndex = i;
          break;
        }
      }
      
      // Skip test if admin not found in list
      if (adminIndex === -1) {
        test.skip();
        return;
      }
      
      // Click edit role button for the admin
      await rows.nth(adminIndex).locator('[data-testid="edit-role-button"]').click();
      
      // Verify role dialog is open
      await expect(page.locator('[data-testid="user-role-dialog"]')).toBeVisible();
      
      // Select new role
      await page.locator('[data-testid="user-role-dialog"] select').selectOption('guardian');
      
      // Click update button
      await page.locator('[data-testid="user-role-dialog"] button[type="submit"]').click();
      
      // Wait for response
      await page.waitForTimeout(1000);
      
      // Verify error notification
      await expect(page.locator('[role="alert"]')).toContainText(/cannot change your own role/i);
    });
    
    test('should prevent admin from changing their own status', async ({ page }) => {
      // Find the admin user in the list
      const rows = page.locator('table tbody tr');
      let adminIndex = -1;
      
      const count = await rows.count();
      for (let i = 0; i < count; i++) {
        const emailCell = rows.nth(i).locator('td').nth(1);
        const email = await emailCell.textContent();
        if (email === adminEmail) {
          adminIndex = i;
          break;
        }
      }
      
      // Skip test if admin not found in list
      if (adminIndex === -1) {
        test.skip();
        return;
      }
      
      // Click edit status button for the admin
      await rows.nth(adminIndex).locator('[data-testid="edit-status-button"]').click();
      
      // Verify status dialog is open
      await expect(page.locator('[data-testid="user-status-dialog"]')).toBeVisible();
      
      // Select new status
      await page.locator('[data-testid="user-status-dialog"] select').selectOption('suspended');
      
      // Click update button
      await page.locator('[data-testid="user-status-dialog"] button[type="submit"]').click();
      
      // Wait for response
      await page.waitForTimeout(1000);
      
      // Verify error notification
      await expect(page.locator('[role="alert"]')).toContainText(/cannot change your own status/i);
    });
  });
});