import { test, expect } from '@playwright/test';

test.describe('Row Level Security Policies', () => {
  // Admin credentials for testing
  const adminEmail = 'admin@example.com';
  const adminPassword = 'secureAdminPassword123';
  
  // Non-admin credentials for testing
  const regularUserEmail = 'user@example.com';
  const regularUserPassword = 'userPassword123';
  
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
  
  // Helper function to execute a direct SQL query
  async function executeQuery(request, token, query) {
    const response = await request.post(`${process.env.SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_ANON_KEY || ''
      },
      data: {
        query
      }
    });
    
    return response;
  }
  
  test('admin should be able to access user_activity table', async ({ page, request }) => {
    // Get admin auth token
    const token = await getAuthToken(page, adminEmail, adminPassword);
    
    // Try to select from user_activity table
    const query = 'SELECT * FROM user_activity LIMIT 5';
    const response = await executeQuery(request, token, query);
    
    // Check response status
    expect(response.status()).toBe(200);
    
    // Parse response body
    const data = await response.json();
    
    // Verify that the query executed successfully
    expect(data).not.toHaveProperty('error');
    expect(data).toHaveProperty('result');
  });
  
  test('non-admin should not be able to access other users activity', async ({ page, request }) => {
    // Get regular user auth token
    const token = await getAuthToken(page, regularUserEmail, regularUserPassword);
    
    // Get user ID
    const userId = await page.evaluate(() => {
      const authDataStr = localStorage.getItem('supabase.auth.token');
      if (!authDataStr) throw new Error('Auth token not found');
      return JSON.parse(authDataStr).currentSession.user.id;
    });
    
    // Try to select another user's activity
    const query = `SELECT * FROM user_activity WHERE user_id != '${userId}' LIMIT 5`;
    const response = await executeQuery(request, token, query);
    
    // Parse response body
    const data = await response.json();
    
    // Verify that the query returned no rows or was denied
    if (response.status() === 200) {
      // If query was allowed but with RLS filtering
      expect(data.result.length).toBe(0);
    } else {
      // If query was denied entirely
      expect(data).toHaveProperty('error');
    }
  });
  
  test('non-admin should be able to access their own activity', async ({ page, request }) => {
    // Get regular user auth token
    const token = await getAuthToken(page, regularUserEmail, regularUserPassword);
    
    // Get user ID
    const userId = await page.evaluate(() => {
      const authDataStr = localStorage.getItem('supabase.auth.token');
      if (!authDataStr) throw new Error('Auth token not found');
      return JSON.parse(authDataStr).currentSession.user.id;
    });
    
    // Try to select own activity
    const query = `SELECT * FROM user_activity WHERE user_id = '${userId}' LIMIT 5`;
    const response = await executeQuery(request, token, query);
    
    // Check response status
    expect(response.status()).toBe(200);
    
    // Parse response body
    const data = await response.json();
    
    // Verify that the query executed successfully
    expect(data).not.toHaveProperty('error');
    expect(data).toHaveProperty('result');
  });
  
  test('non-admin should not be able to insert into user_activity table', async ({ page, request }) => {
    // Get regular user auth token
    const token = await getAuthToken(page, regularUserEmail, regularUserPassword);
    
    // Get user ID
    const userId = await page.evaluate(() => {
      const authDataStr = localStorage.getItem('supabase.auth.token');
      if (!authDataStr) throw new Error('Auth token not found');
      return JSON.parse(authDataStr).currentSession.user.id;
    });
    
    // Try to insert into user_activity table
    const query = `
      INSERT INTO user_activity (user_id, actor_id, activity_type, description)
      VALUES ('${userId}', '${userId}', 'test_activity', 'Testing RLS policies')
    `;
    const response = await executeQuery(request, token, query);
    
    // Parse response body
    const data = await response.json();
    
    // Verify that the query was denied
    expect(data).toHaveProperty('error');
  });
  
  test('admin should be able to insert into user_activity table', async ({ page, request }) => {
    // Get admin auth token
    const token = await getAuthToken(page, adminEmail, adminPassword);
    
    // Get admin user ID
    const adminId = await page.evaluate(() => {
      const authDataStr = localStorage.getItem('supabase.auth.token');
      if (!authDataStr) throw new Error('Auth token not found');
      return JSON.parse(authDataStr).currentSession.user.id;
    });
    
    // Try to insert into user_activity table
    const query = `
      INSERT INTO user_activity (user_id, actor_id, activity_type, description)
      VALUES ('${adminId}', '${adminId}', 'test_activity', 'Testing RLS policies')
      RETURNING id
    `;
    const response = await executeQuery(request, token, query);
    
    // Check response status
    expect(response.status()).toBe(200);
    
    // Parse response body
    const data = await response.json();
    
    // Verify that the query executed successfully
    expect(data).not.toHaveProperty('error');
    expect(data).toHaveProperty('result');
    
    // Clean up the inserted record
    if (data.result && data.result.length > 0) {
      const insertedId = data.result[0].id;
      await executeQuery(request, token, `DELETE FROM user_activity WHERE id = '${insertedId}'`);
    }
  });
  
  test('non-admin should not be able to update user roles', async ({ page, request }) => {
    // Get regular user auth token
    const token = await getAuthToken(page, regularUserEmail, regularUserPassword);
    
    // Try to update a user's role
    const query = `
      UPDATE profiles
      SET role = 'admin'
      WHERE email = '${regularUserEmail}'
      RETURNING id, role
    `;
    const response = await executeQuery(request, token, query);
    
    // Parse response body
    const data = await response.json();
    
    // Verify that the query was denied or had no effect
    if (response.status() === 200 && data.result && data.result.length > 0) {
      // If query was allowed but with RLS filtering
      expect(data.result[0].role).not.toBe('admin');
    } else {
      // If query was denied entirely
      expect(data).toHaveProperty('error');
    }
  });
  
  test('admin should be able to update user roles', async ({ page, request }) => {
    // Get admin auth token
    const token = await getAuthToken(page, adminEmail, adminPassword);
    
    // Get regular user's current role
    const getUserQuery = `
      SELECT id, role FROM profiles
      WHERE email = '${regularUserEmail}'
    `;
    const getUserResponse = await executeQuery(request, token, getUserQuery);
    const userData = await getUserResponse.json();
    
    if (userData.result && userData.result.length > 0) {
      const userId = userData.result[0].id;
      const originalRole = userData.result[0].role;
      
      // Change role to something different
      const newRole = originalRole === 'student' ? 'guardian' : 'student';
      
      // Update the role
      const updateQuery = `
        UPDATE profiles
        SET role = '${newRole}'
        WHERE id = '${userId}'
        RETURNING id, role
      `;
      const updateResponse = await executeQuery(request, token, updateQuery);
      
      // Check response status
      expect(updateResponse.status()).toBe(200);
      
      // Parse response body
      const updateData = await updateResponse.json();
      
      // Verify that the query executed successfully
      expect(updateData).not.toHaveProperty('error');
      expect(updateData.result[0].role).toBe(newRole);
      
      // Restore original role
      await executeQuery(request, token, `
        UPDATE profiles
        SET role = '${originalRole}'
        WHERE id = '${userId}'
      `);
    }
  });
});