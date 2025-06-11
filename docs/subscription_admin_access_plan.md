# Subscription and Admin Access Improvement Plan

## Overview
This document outlines the plan to address two key issues in the HomeSchool Transcript Management System:
1. Adding a subscription link to the CourseManagement component
2. Providing admin access to the owner for subscription management

## Issue 1: No Subscription Link in Course Management

**Problem:** When users see the "Subscription Required" message, there's no way to navigate to the subscription page.

**Solution:**
1. Modify the CourseManagement.tsx component to add a link to the subscription page
2. Uncomment and enable the commented-out link on line 49

**Implementation Details:**
```diff
// In CourseManagement.tsx
<p className="text-gray-700 mb-4">
  Adding courses requires an active subscription or trial. Please subscribe to continue.
</p>
- {/* Optionally add a link to the subscription page */}
- {/* <Link to="/subscribe" className="text-blue-600 hover:underline">View Subscription Plans</Link> */}
+ <a href="/subscribe" className="text-blue-600 hover:underline block mb-4">View Subscription Plans</a>
```

## Issue 2: Owner Needs Admin Access

**Problem:** As the owner, you should have admin access to manage subscriptions, including setting your own subscription to free.

**Solution:**
1. Create a function to check if the current user is the owner (based on email or other identifier)
2. Modify the AdminProtectedRoute component to allow access if the user is the owner
3. Add a link to the admin panel in the GuardianDashboard for owner/admin users
4. Ensure the admin panel has functionality to manage user subscriptions

**Implementation Details:**

### Step 1: Modify AdminProtectedRoute for Owner Access
```diff
// In App.tsx
function AdminProtectedRoute({ children, user }: { children: JSX.Element; user: User | null }) {
-  if (!user || user.profile.role !== 'admin') {
+  // Check if user is owner (using email or other identifier)
+  const isOwner = user?.email === 'owner@example.com'; // Replace with actual owner email
+  if (!user || (user.profile.role !== 'admin' && !isOwner)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
```

### Step 2: Add Admin Panel Link in GuardianDashboard
```diff
// In GuardianHeader.tsx or GuardianDashboard.tsx
+ // Check if user is admin or owner
+ const isAdminOrOwner = user.profile.role === 'admin' || user.email === 'owner@example.com';
+ 
+ {isAdminOrOwner && (
+   <a href="/admin" className="text-blue-600 hover:underline ml-4">
+     Admin Panel
+   </a>
+ )}
```

### Step 3: Enhance Admin Subscription Dashboard
Ensure the AdminSubscriptionDashboard component allows:
1. Viewing all user subscriptions
2. Setting subscription status (active, trial, etc.)
3. Adding a "Set Free" button for the owner's account

## Implementation Tasks
1. Add subscription link to CourseManagement.tsx
2. Modify AdminProtectedRoute in App.tsx for owner access
3. Add admin panel link in GuardianHeader.tsx or GuardianDashboard.tsx
4. Enhance AdminSubscriptionDashboard.tsx with subscription management features

## Timeline
- Estimated completion: 1-2 days
- Priority: High (affects user experience and owner functionality)