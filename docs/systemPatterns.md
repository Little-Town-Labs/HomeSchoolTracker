# System Patterns

## CI/CD and Deployment

- Version control: Git (local, reset as of current state)
- Hosting: Netlify (auto-deploys from main branch)
- Build tool: Vite
- Environment variables managed via Netlify dashboard and .env files

## Environment Configuration

- Vite environment variables for Supabase credentials
- Path aliases configured in both vite.config.ts and tsconfig.app.json
  - `@/` resolves to `src/` directory for consistent imports
- Separate configs for local and production
- Base URL configuration for asset loading

## Authentication & User Management

- Email/password authentication via Supabase
- Email verification and password recovery flows
- Role-based access (guardian/student/admin)
- Owner access to admin panel via environment variable configuration
- Secure session management
- User status management (active, suspended, pending, deactivated)
- User activity tracking and auditing
- Admin-specific operations secured by RLS policies
- Edge Functions for user management operations:
  - admin-get-users: Fetch and filter user data
  - admin-update-user-role: Manage role assignments
  - admin-update-user-status: Control account status
  - admin-get-user-activity: Track user actions
- Frontend components follow consistent patterns:
  - Search/filter components with controlled inputs
  - List components with pagination
  - Dialog components for user interactions
  - Profile view for detailed user information

## Error Handling

- ErrorBoundary component for React errors
- Centralized error handling utility in src/lib/errorHandling.ts
- User-friendly error messages and technical details for debugging
- Consistent error display via notifications
- Form validation with clear error states
- API error handling with appropriate user feedback

## Testing

- React Testing Library for unit/component tests (Jest tests removed)
- Playwright for integration and E2E tests
- Test files co-located with components and in src/__tests__/
- Standardized mock implementations for Supabase
- Pre-commit and pre-push hooks for linting, type checking, and tests (Husky, can be bypassed if needed)
- Comprehensive test coverage for user management:
  - Component tests for all UI elements
  - E2E tests for user workflows
  - Edge Function tests for admin operations
  - RLS policy tests for security validation

## Database

- Supabase PostgreSQL with Row Level Security (RLS)
- Migrations in supabase/migrations
- Key tables:
  - profiles (enhanced with status column)
  - user_activity (new table for tracking actions)
  - students
  - schools
  - courses
  - test_scores
  - student_guardians
  - subscriptions
  - subscription_plans
- Foreign key relationships and cascading deletes for data integrity
- Enhanced RLS policies for admin operations

## Subscriptions & Payments

- Integration with PayPal for subscription management
- Supabase Edge Functions handle interactions with the PayPal API:
    - `create-paypal-product-plan`: Creates products/plans in PayPal
    - `create-paypal-subscription`: Initiates the subscription process for a user
    - `get-paypal-subscription-details`: Fetches details of a user's subscription from PayPal
    - `cancel-paypal-subscription`: Handles subscription cancellation with PayPal and updates database
    - `webhook-handler`: Listens for PayPal webhook events (e.g., payment success, cancellation) to update subscription status in the database
    - `admin-get-user-subscriptions`: Allows admins to view user subscription data
- Database tables (`subscriptions`, `subscription_plans`) store subscription details and link users to their plans
- RLS policies ensure users can only manage their own subscriptions, while admins have broader access
- UI components provide plan selection, subscription initiation, management, and cancellation views for users and admins
- Role-based access control ensures only admins and the owner can access the admin dashboard and subscription management features
- Enhanced AdminSubscriptionDashboard allows admins to manage user subscriptions, including setting free subscriptions
- Subscription link in CourseManagement component for easy navigation to subscription plans
- Subscription cancellation follows a confirmation flow with clear user feedback

## Component Architecture

### 1. Feature-based Organization
- Components organized by feature domain (admin/, subscription/, course/, etc.)
- Co-located tests with components
- Shared utilities in dedicated folders

### 2. Hook-based State Management
- Custom hooks for feature-specific logic (`useUserManagement`, `useUserSubscription`, `useAdminSubscriptions`)
- Separation of API calls from UI components
- Reusable state logic across components

### 3. Role-based Access Control
- Protected routes based on user role (guardian/student/admin)
- Owner access via environment variable (VITE_OWNER_EMAIL)
- RLS policies at database level for additional security

## Data Flow Patterns

### 1. Supabase Integration
- Edge Functions for complex server-side operations
- Real-time subscriptions for live data updates
- RLS policies for row-level security

### 2. PayPal Integration Patterns
- Edge Functions handle all PayPal API interactions
- Webhook endpoint for subscription lifecycle events
- **PayPal Webhook Pattern (Task 011)**:
  - Signature verification for security
  - Event type mapping to internal status
  - Database updates via Supabase client
  - Error handling and logging
  - Status mapping: PayPal status → internal subscription status

### 3. Error Handling
- Centralized error boundaries
- User-friendly error messages
- Logging for debugging
- Graceful degradation for non-critical features

## Testing Patterns

### 1. Component Testing
- React Testing Library for UI components
- Mock external dependencies (Supabase, PayPal)
- Focus on user interactions and accessibility

### 2. E2E Testing
- Playwright for full user workflows
- Test critical paths (auth, subscription, course management)
- Database cleanup between tests

### 3. API Testing
- Direct testing of Edge Functions
- Mock external API responses
- Test error scenarios and edge cases

### 4. **Webhook Testing Pattern**:
- Infrastructure testing (endpoint accessibility)
- Security testing (unauthorized request rejection)
- Integration testing with PayPal sandbox
- Database update verification
- Documentation-driven testing procedures

## Security Patterns

### 1. Authentication & Authorization
- Supabase Auth for user management
- JWT tokens for API access
- Role-based permissions at UI and API level

### 2. Data Protection
- RLS policies for database access
- Environment variables for sensitive data
- HTTPS for all communications

### 3. **PayPal Security Patterns**:
- Webhook signature verification
- API credentials stored in environment variables
- Sandbox environment for testing
- Production deployment safeguards

## UI/UX Patterns

### 1. Consistent Design System
- Tailwind CSS for styling
- Lucide React for icons
- Consistent color scheme and spacing

### 2. Navigation Patterns
- Breadcrumb navigation for complex workflows
- Role-based menu items
- Clear "back" and "home" actions

### 3. Loading and Error States
- Skeleton loaders for data fetching
- Error boundaries for graceful failure
- User feedback for long-running operations

### 4. **Admin Panel Patterns**:
- Tabbed interface for different management areas
- Search and filtering for large datasets
- Bulk operations with confirmation dialogs
- Real-time updates for subscription status

## Development Patterns

### 1. TypeScript Usage
- Strict type checking enabled
- Interface definitions for all data structures
- Type-safe API responses

### 2. Environment Configuration
- Separate configs for development/production
- Environment variable validation
- Path aliases for clean imports

### 3. **Documentation Patterns**:
- Configuration documentation with examples
- Testing procedures with step-by-step guides
- Troubleshooting sections with common issues
- Code comments for complex webhook logic

### 4. Version Control
- Feature branch workflow
- Conventional commit messages
- Automated testing on PRs

## Deployment Patterns

### 1. Netlify Integration
- Automatic deployment from main branch
- Environment variable management
- Build optimization

### 2. Database Migrations
- Version-controlled schema changes
- Safe migration procedures
- Rollback capabilities

### 3. **Infrastructure Monitoring**:
- Edge Function logs for webhook events
- Database monitoring for subscription updates
- Error tracking and alerting
- Performance monitoring for API endpoints
