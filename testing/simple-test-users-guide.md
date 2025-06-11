# Test User Setup Guide for Subscription Testing

Since we need both auth users and profiles, here's a hybrid approach:

## Step 1: Create Auth Users (Manual - Supabase Dashboard)

Go to your Supabase Dashboard → Authentication → Users and create these users:

### Admin User
- **Email**: `admin@example.com`
- **Password**: `secureAdminPassword123`
- **Confirm Email**: ✅ (check this box to auto-confirm)

### Test User 
- **Email**: `testuser@example.com`
- **Password**: `secureUserPassword123`
- **Confirm Email**: ✅ (check this box to auto-confirm)

### Automation User
- **Email**: `test.automation@example.com`
- **Password**: `AutoTest123!`
- **Confirm Email**: ✅ (check this box to auto-confirm)

## Step 2: Get User IDs

After creating the auth users, copy their UUIDs from the dashboard.

## Step 3: Create Profiles (Automated)

Run the following in your browser console or Node.js to create the profiles:

```javascript
// Use the actual UUIDs from step 2
const userProfiles = [
  {
    id: 'ADMIN_USER_UUID_HERE',
    email: 'admin@example.com',
    role: 'admin',
    name: 'Test Admin User',
    status: 'active'
  },
  {
    id: 'TEST_USER_UUID_HERE', 
    email: 'testuser@example.com',
    role: 'guardian',
    name: 'Test User',
    status: 'active'
  },
  {
    id: 'AUTOMATION_USER_UUID_HERE',
    email: 'test.automation@example.com',
    role: 'guardian', 
    name: 'Test Automation User',
    status: 'active'
  }
];

// Create profiles via API (replace with actual Supabase client)
```

## Alternative: Quick Profile Creation

I can use the Supabase MCP tools to create the profiles once you have the auth user IDs. 