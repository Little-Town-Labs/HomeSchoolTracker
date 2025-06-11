import { test, expect } from '@playwright/test';

test.describe('admin-update-user-role Edge Function', () => {
  // Admin credentials for testing
  const adminEmail = 'admin@example.com';
  const adminPassword = 'secureAdminPassword123';
  
  // Non-admin credentials for testing
  const regularUserEmail = 'user@example.com';
  const regularUserPassword = 'userPassword123';
  
  // Test user ID (to be updated during tests)
  let testUserId = '';
  
  // Helper function to get auth token
  async function getAuthToken(page, email, password) {
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
    return JSON.parse(token).currentSession.access_token;
  }
  
  // Helper function to find a suitable test user
  async function findTestUser(page, request, token) {
    // Call the get-users function to find a non-admin user
    const response = await request.get(`${process.env.SUPABASE_URL}/functions/v1/admin-get-users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    // Find a non-admin user that is not the current admin
    const testUser = data.users.find(user => 
      user.role !== 'admin' && 
      user.email !== adminEmail
    );
    
    if (testUser) {
      return testUser.id;
    }
    
    // If no suitable user found, create a test user
    // This would require additional setup that's beyond the scope of this test
    throw new Error('No suitable test user found. Please ensure a non-admin user exists in the database.');
  }
  
  test.beforeEach(async ({ page, request }) => {
    // Get admin auth token
    const token = await getAuthToken(page, adminEmail, adminPassword);
    
    // Find a suitable test user
    testUserId = await findTestUser(page, request, token);
  });
  
  test('should update user role when called by admin', async ({ page, request }) => {
    // Get admin auth token
    const token = await getAuthToken(page, adminEmail, adminPassword);
    
    // Call the edge function to update role to student
    const response = await request.post(`${process.env.SUPABASE_URL}/functions/v1/admin-update-user-role`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        userId: testUserId,
        role: 'student'
      }
    });
    
    // Check response status
    expect(response.status()).toBe(200);
    
    // Parse response body
    const data = await response.json();
    
    // Verify response structure
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('user');
    expect(data.message).toBe('User role updated successfully');
    expect(data.user.id).toBe(testUserId);
    expect(data.user.role).toBe('student');
    
    // Call the edge function again to update role to guardian (restore original state)
    await request.post(`${process.env.SUPABASE_URL}/functions/v1/admin-update-user-role`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        userId: testUserId,
        role: 'guardian'
      }
    });
  });
  
  test('should validate role values', async ({ page, request }) => {
    // Get admin auth token
    const token = await getAuthToken(page, adminEmail, adminPassword);
    
    // Call the edge function with invalid role
    const response = await request.post(`${process.env.SUPABASE_URL}/functions/v1/admin-update-user-role`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        userId: testUserId,
        role: 'invalid_role'
      }
    });
    
    // Check response status
    expect(response.status()).toBe(400);
    
    // Parse response body
    const data = await response.json();
    
    // Verify error message
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid role');
  });
  
  test('should prevent admin from changing their own role', async ({ page, request }) => {
    // Get admin auth token
    const token = await getAuthToken(page, adminEmail, adminPassword);
    
    // Get admin user ID
    const adminId = await page.evaluate(() => {
      const authDataStr = localStorage.getItem('supabase.auth.token');
      if (!authDataStr) throw new Error('Auth token not found');
      const authData = JSON.parse(authDataStr);
      return authData.currentSession.user.id;
    });
    
    // Call the edge function to try to change admin's own role
    const response = await request.post(`${process.env.SUPABASE_URL}/functions/v1/admin-update-user-role`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        userId: adminId,
        role: 'guardian'
      }
    });
    
    // Check response status
    expect(response.status()).toBe(403);
    
    // Parse response body
    const data = await response.json();
    
    // Verify error message
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Cannot change your own role');
  });
  
  test('should return 404 for non-existent user', async ({ page, request }) => {
    // Get admin auth token
    const token = await getAuthToken(page, adminEmail, adminPassword);
    
    // Call the edge function with non-existent user ID
    const response = await request.post(`${process.env.SUPABASE_URL}/functions/v1/admin-update-user-role`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        userId: '00000000-0000-0000-0000-000000000000',
        role: 'student'
      }
    });
    
    // Check response status
    expect(response.status()).toBe(404);
    
    // Parse response body
    const data = await response.json();
    
    // Verify error message
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('User not found');
  });
  
  test('should return 400 for missing required fields', async ({ page, request }) => {
    // Get admin auth token
    const token = await getAuthToken(page, adminEmail, adminPassword);
    
    // Call the edge function without userId
    const response = await request.post(`${process.env.SUPABASE_URL}/functions/v1/admin-update-user-role`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        role: 'student'
      }
    });
    
    // Check response status
    expect(response.status()).toBe(400);
    
    // Parse response body
    const data = await response.json();
    
    // Verify error message
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Missing required fields');
  });
  
  test('should return 401 for unauthenticated requests', async ({ request }) => {
    // Call the edge function without auth token
    const response = await request.post(`${process.env.SUPABASE_URL}/functions/v1/admin-update-user-role`, {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        userId: testUserId,
        role: 'student'
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
  
  test('should return 403 for non-admin users', async ({ page, request }) => {
    // Get regular user auth token
    const token = await getAuthToken(page, regularUserEmail, regularUserPassword);
    
    // Call the edge function
    const response = await request.post(`${process.env.SUPABASE_URL}/functions/v1/admin-update-user-role`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        userId: testUserId,
        role: 'student'
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
  
  test('should return 405 for non-POST requests', async ({ page, request }) => {
    // Get admin auth token
    const token = await getAuthToken(page, adminEmail, adminPassword);
    
    // Call the edge function with GET method
    const response = await request.get(`${process.env.SUPABASE_URL}/functions/v1/admin-update-user-role`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Check response status
    expect(response.status()).toBe(405);
    
    // Parse response body
    const data = await response.json();
    
    // Verify error message
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Method not allowed');
  });
});