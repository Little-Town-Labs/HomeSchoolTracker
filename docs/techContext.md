# Technical Context

## Frontend
- React 18.3.1
- TypeScript 5.5.3
- Tailwind CSS 3.4.1
- React Router 6.22.2
- Lucide React 0.344.0
- React PDF Renderer 3.4.0
- Custom Hooks:
  - `useUserManagement` (user search, filtering, role/status management)
  - `useUserSubscription` (enhanced with subscription status checks)
  - `useAdminSubscriptions` (enhanced with subscription management functions)
- UI Components:
  - User Management:
    - `UserSearchFilters` (search and filtering interface)
    - `UserList` with `Pagination` (efficient user data display)
    - `UserRoleDialog` (role management interface)
    - `UserStatusDialog` (account status controls)
    - `UserProfileView` (detailed user information)
  - Subscription: `SubscriptionPlans`, `SubscribeButton`, `SubscriptionManagementPanel` (with cancellation modal)
  - Admin: `AdminLayout` (with role-based and owner access), `AdminSubscriptionDashboard` (enhanced with subscription management features), `UserSubscriptionList`
  - CourseManagement: Added subscription link for easier navigation to subscription plans
  - GuardianHeader: Added admin panel link for owner/admin users

## Backend
- Supabase (PostgreSQL, Auth, RLS, real-time)
- Supabase Edge Functions (Deno runtime) for server-side logic and external API interactions
- New Edge Functions for User Management:
  - `admin-get-users`: Fetch and filter user data
  - `admin-update-user-role`: Manage role assignments
  - `admin-update-user-status`: Control account status
  - `admin-get-user-activity`: Track user actions

## Payment Integration
- PayPal REST API for subscription processing
- Environment variables for PayPal credentials (client ID, secret) stored securely (e.g., in Supabase Vault or environment variables)
- **PayPal Webhook Integration (Task 011)**:
  - Webhook URL: `https://vlvamfplfqgmosokuxqm.supabase.co/functions/v1/webhook-handler`
  - Webhook ID: `9WJ79363RW477184E`
  - Events: `BILLING.SUBSCRIPTION.ACTIVATED`, `CANCELLED`, `SUSPENDED`, `EXPIRED`
  - Signature verification implemented for security
  - Database update logic for subscription lifecycle events
- Supabase Edge Functions for PayPal interactions:
   - `create-paypal-product-plan`
   - `create-paypal-subscription`
   - `get-paypal-subscription-details`
   - `cancel-paypal-subscription` (Handles subscription cancellation)
   - `webhook-handler` (Handles PayPal events) - **CONFIGURED AND TESTED**
   - `admin-get-user-subscriptions`

## Tooling
- Vite 5.4.2 (build/dev)
  - Path aliases configured in vite.config.ts (`@/` resolves to `src/`)
  - Matches path aliases in tsconfig.app.json
- ESLint, PostCSS, Autoprefixer
- React Testing Library (unit/component tests; Jest tests removed)
- Playwright (integration/E2E tests)
- Netlify (hosting, CI/CD)

## Development Setup
- Environment variables:
  - VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (Supabase connection)
  - VITE_PAYPAL_CLIENT_ID, VITE_PAYPAL_SECRET (PayPal integration)
  - VITE_OWNER_EMAIL (Owner access to admin panel)
- Key commands:
  - npm install
  - npm run dev
  - npm run build
  - npm run test:e2e
  - npm run lint
  - npm run format

## Backend Supabase Client Initialization
- Refactored Supabase client initialization to use a function that returns a new client instance instead of a direct export
- This change improves flexibility and supports multiple client instances if needed

## Database Schema
- Migrations in supabase/migrations
- New migration (20250505172400_add_user_management.sql):
  - Added status column to profiles table
  - Created user_activity table for tracking actions
- Key tables:
  - profiles (enhanced with status)
  - user_activity (new)
  - students
  - schools
  - courses
  - test_scores
  - student_guardians
  - subscriptions
  - subscription_plans
- RLS policies for secure access, including specific policies for:
  - User data access
  - Role management
  - Status updates
  - Activity tracking
  - Subscription data

## Authentication
- Email/password with Supabase
- Role-based access (guardian/student/admin)
- Owner access to admin panel via VITE_OWNER_EMAIL environment variable
- Session management
- Enhanced user status management:
  - Active
  - Suspended
  - Pending
  - Deactivated

## Testing
- Test files co-located with components and in src/__tests__/
- New test files:
  - Component tests:
    - UserSearchFilters.test.tsx
    - UserList.test.tsx
    - UserDialogs.test.tsx
    - UserProfileView.test.tsx
  - E2E tests:
    - user_management.spec.ts
  - Edge Function tests:
    - admin-get-users.spec.ts
    - admin-update-user-role.spec.ts
    - admin-update-user-status.spec.ts
    - admin-get-user-activity.spec.ts
  - RLS policy tests:
    - rls-policies.spec.ts
- Tests for filtering/searching subscriptions in admin dashboard
- Standardized mock implementations for Supabase

## Deployment
- Netlify auto-deploys from main branch
- Environment variables managed in Netlify dashboard
