import { test, expect, Page, APIRequestContext } from '@playwright/test';

test.describe('admin-get-users Edge Function', () => {
  // Admin credentials for testing
  const adminEmail = 'admin@example.com';
  const adminPassword = 'secureAdminPassword123';
  
  // Non-admin credentials for testing
  const regularUserEmail = 'user@example.com';
  const regularUserPassword = 'userPassword123';
  
  // Helper function to get auth token
  async function getAuthToken(page: Page, email: string, password: string) {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill in credentials
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    
    // Click login button
    await page.locator('button[type="submit"]').click();
    
    // Wait for login to complete
    await page.waitForTimeout(1000);
    
    // Get auth token from localStorage
    const token = await page.evaluate(() => localStorage.getItem('supabase.auth.token'));
    if (!token) throw new Error('No auth token found in localStorage');
    return JSON.parse(token).currentSession.access_token;
  }
  
  test('should return users with pagination when called by admin', async ({ page, request }: { page: Page, request: APIRequestContext }) => {
    // Get admin auth token
    const token = await getAuthToken(page, adminEmail, adminPassword);
    
    // Call the edge function
    const response = await request.get(`${process.env.SUPABASE_URL}/functions/v1/admin-get-users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Check response status
    expect(response.status()).toBe(200);
    
    // Parse response body
    const data = await response.json();
    
    // Verify response structure
    expect(data).toHaveProperty('users');
    expect(data).toHaveProperty('pagination');
    expect(data.pagination).toHaveProperty('page');
    expect(data.pagination).toHaveProperty('pageSize');
    expect(data.pagination).toHaveProperty('totalCount');
    expect(data.pagination).toHaveProperty('totalPages');
    
    // Verify users array structure if there are users
    if (data.users.length > 0) {
      const user = data.users[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('status');
      expect(user).toHaveProperty('created_at');
    }
  });
  
  test('should filter users by email', async ({ page, request }: { page: Page, request: APIRequestContext }) => {
    // Get admin auth token
    const token = await getAuthToken(page, adminEmail, adminPassword);
    
    // Call the edge function with email filter
    const response = await request.get(`${process.env.SUPABASE_URL}/functions/v1/admin-get-users?email=admin`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Check response status
    expect(response.status()).toBe(200);
    
    // Parse response body
    const data = await response.json();
    
    // Verify filtered results
    if (data.users.length > 0) {
      for (const user of data.users) {
        expect(user.email).toContain('admin');
      }
    }
  });
  
  test('should filter users by role', async ({ page, request }: { page: Page, request: APIRequestContext }) => {
    // Get admin auth token
    const token = await getAuthToken(page, adminEmail, adminPassword);
    
    // Call the edge function with role filter
    const response = await request.get(`${process.env.SUPABASE_URL}/functions/v1/admin-get-users?role=admin`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Check response status
    expect(response.status()).toBe(200);
    
    // Parse response body
    const data = await response.json();
    
    // Verify filtered results
    if (data.users.length > 0) {
      for (const user of data.users) {
        expect(user.role).toBe('admin');
      }
    }
  });
  
  test('should filter users by status', async ({ page, request }: { page: Page, request: APIRequestContext }) => {
    // Get admin auth token
    const token = await getAuthToken(page, adminEmail, adminPassword);
    
    // Call the edge function with status filter
    const response = await request.get(`${process.env.SUPABASE_URL}/functions/v1/admin-get-users?status=active`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Check response status
    expect(response.status()).toBe(200);
    
    // Parse response body
    const data = await response.json();
    
    // Verify filtered results
    if (data.users.length > 0) {
      for (const user of data.users) {
        expect(user.status).toBe('active');
      }
    }
  });
  
  test('should sort users by specified column', async ({ page, request }: { page: Page, request: APIRequestContext }) => {
    // Get admin auth token
    const token = await getAuthToken(page, adminEmail, adminPassword);
    
    // Call the edge function with sorting parameters
    const response = await request.get(`${process.env.SUPABASE_URL}/functions/v1/admin-get-users?sortBy=email&sortOrder=asc`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Check response status
    expect(response.status()).toBe(200);
    
    // Parse response body
    const data = await response.json();
    
    // Verify sorting if there are multiple users
    if (data.users.length > 1) {
      const emails = data.users.map(user => user.email);
      const sortedEmails = [...emails].sort();
      expect(emails).toEqual(sortedEmails);
    }
  });
  
  test('should paginate results correctly', async ({ page, request }: { page: Page, request: APIRequestContext }) => {
    // Get admin auth token
    const token = await getAuthToken(page, adminEmail, adminPassword);
    
    // Call the edge function with pagination parameters
    const response = await request.get(`${process.env.SUPABASE_URL}/functions/v1/admin-get-users?page=1&pageSize=2`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Check response status
    expect(response.status()).toBe(200);
    
    // Parse response body
    const data = await response.json();
    
    // Verify pagination
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.pageSize).toBe(2);
    
    // Verify that we have at most 2 users per page
    expect(data.users.length).toBeLessThanOrEqual(2);
  });
  
  test('should return 401 for unauthenticated requests', async ({ request }: { request: APIRequestContext }) => {
    // Call the edge function without auth token
    const response = await request.get(`${process.env.SUPABASE_URL}/functions/v1/admin-get-users`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Check response status
    expect(response.status()).toBe(401);
    
    // Parse response body
    const data = await response.json();
    
    // Verify error message
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Unauthorized');
  });
  
  test('should return 403 for non-admin users', async ({ page, request }: { page: Page, request: APIRequestContext }) => {
    // Get regular user auth token
    const token = await getAuthToken(page, regularUserEmail, regularUserPassword);
    
    // Call the edge function
    const response = await request.get(`${process.env.SUPABASE_URL}/functions/v1/admin-get-users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Check response status
    expect(response.status()).toBe(403);
    
    // Parse response body
    const data = await response.json();
    
    // Verify error message
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Admin access required');
  });
});