import { test, expect } from '@playwright/test';

test.describe('admin-get-user-activity Edge Function', () => {
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
    const token = await page.evaluate(() => {
      const authDataStr = localStorage.getItem('supabase.auth.token');
      if (!authDataStr) throw new Error('Auth token not found');
      return JSON.parse(authDataStr).currentSession.access_token;
    });
    
    return token;
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
  
  test('should return user activity when called by admin', async ({ page, request }) => {
    // Get admin auth token
    const token = await getAuthToken(page, adminEmail, adminPassword);
    
    // Call the edge function
    const response = await request.get(`${process.env.SUPABASE_URL}/functions/v1/admin-get-user-activity?userId=${testUserId}`, {
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
    expect(data).toHaveProperty('activities');
    expect(data).toHaveProperty('activityTypes');
    expect(data).toHaveProperty('pagination');
    expect(data.pagination).toHaveProperty('page');
    expect(data.pagination).toHaveProperty('pageSize');
    expect(data.pagination).toHaveProperty('totalCount');
    expect(data.pagination).toHaveProperty('totalPages');
    
    // Verify activities array structure if there are activities
    if (data.activities.length > 0) {
      const activity = data.activities[0];
      expect(activity).toHaveProperty('id');
      expect(activity).toHaveProperty('user_id');
      expect(activity).toHaveProperty('activity_type');
      expect(activity).toHaveProperty('description');
      expect(activity).toHaveProperty('created_at');
    }
    
    // Verify activityTypes array
    expect(Array.isArray(data.activityTypes)).toBe(true);
  });
  
  test('should filter activities by activity type', async ({ page, request }) => {
    // Get admin auth token
    const token = await getAuthToken(page, adminEmail, adminPassword);
    
    // First, get all activities to find an activity type
    const allActivitiesResponse = await request.get(`${process.env.SUPABASE_URL}/functions/v1/admin-get-user-activity?userId=${testUserId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const allActivitiesData = await allActivitiesResponse.json();
    
    // Skip test if no activities or activity types found
    if (allActivitiesData.activityTypes.length === 0) {
      test.skip();
      return;
    }
    
    // Use the first activity type for filtering
    const activityType = allActivitiesData.activityTypes[0];
    
    // Call the edge function with activity type filter
    const response = await request.get(`${process.env.SUPABASE_URL}/functions/v1/admin-get-user-activity?userId=${testUserId}&activityType=${activityType}`, {
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
    if (data.activities.length > 0) {
      for (const activity of data.activities) {
        expect(activity.activity_type).toBe(activityType);
      }
    }
  });
  
  test('should filter activities by date range', async ({ page, request }) => {
    // Get admin auth token
    const token = await getAuthToken(page, adminEmail, adminPassword);
    
    // Define date range (last 30 days)
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Call the edge function with date range filter
    const response = await request.get(`${process.env.SUPABASE_URL}/functions/v1/admin-get-user-activity?userId=${testUserId}&startDate=${startDate}&endDate=${endDate}`, {
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
    if (data.activities.length > 0) {
      for (const activity of data.activities) {
        const activityDate = new Date(activity.created_at);
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        expect(activityDate >= startDateObj).toBe(true);
        expect(activityDate <= endDateObj).toBe(true);
      }
    }
  });
  
  test('should paginate results correctly', async ({ page, request }) => {
    // Get admin auth token
    const token = await getAuthToken(page, adminEmail, adminPassword);
    
    // Call the edge function with pagination parameters
    const response = await request.get(`${process.env.SUPABASE_URL}/functions/v1/admin-get-user-activity?userId=${testUserId}&page=1&pageSize=5`, {
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
    expect(data.pagination.pageSize).toBe(5);
    
    // Verify that we have at most 5 activities per page
    expect(data.activities.length).toBeLessThanOrEqual(5);
  });
  
  test('should return 400 for missing userId', async ({ page, request }) => {
    // Get admin auth token
    const token = await getAuthToken(page, adminEmail, adminPassword);
    
    // Call the edge function without userId
    const response = await request.get(`${process.env.SUPABASE_URL}/functions/v1/admin-get-user-activity`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Check response status - should be 400 or similar error code
    expect(response.status()).not.toBe(200);
  });
  
  test('should return 401 for unauthenticated requests', async ({ request }) => {
    // Call the edge function without auth token
    const response = await request.get(`${process.env.SUPABASE_URL}/functions/v1/admin-get-user-activity?userId=${testUserId}`, {
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
  
  test('should return 403 for non-admin users', async ({ page, request }) => {
    // Get regular user auth token
    const token = await getAuthToken(page, regularUserEmail, regularUserPassword);
    
    // Call the edge function
    const response = await request.get(`${process.env.SUPABASE_URL}/functions/v1/admin-get-user-activity?userId=${testUserId}`, {
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