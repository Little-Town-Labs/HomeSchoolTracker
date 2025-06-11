# Refined Plan for PayPal Subscription Integration

This plan outlines the major phases and tasks required to add PayPal subscription functionality and associated administrative features to the HomeSchoolTracker application, incorporating user feedback regarding trials, roles, and cancellation flow.

**Phase 1: Foundation & Backend Setup** [PM-RULES: Deep Work]

1.  **Research & Configuration:** Done
    *   Investigate PayPal Subscriptions API (REST) and JavaScript SDK. [Check PayPal Developer Docs](https://developer.paypal.com/home/)
    *   Set up PayPal Developer Sandbox accounts for testing.
    *   Obtain PayPal API Credentials (Client ID, Secret) for Sandbox and Production.
    *   Securely store API credentials using Supabase Secrets management. [Check Supabase Docs]

2.  **Database Schema Design:** [Confirm systemPatterns.md#database-patterns]
    *   **`subscription_plans` Table:**
        *   Columns: `id`, `name` (text, e.g., 'Basic'), `description` (text), `price` (numeric, **TBD**), `currency` (text, 'USD'), `billing_interval` (text, 'Year'), `interval_count` (integer, 1), `paypal_plan_id` (text).
    *   **`user_subscriptions` Table:**
        *   Columns: `id`, `user_id` (uuid, links to `profiles.id`), `plan_id` (uuid, links to `subscription_plans.id`), `paypal_subscription_id` (text), `status` (text, e.g., 'trialing', 'active', 'cancelled', 'expired'), `trial_start_date` (timestamp with time zone), `trial_end_date` (timestamp with time zone), `current_period_start` (timestamp with time zone), `current_period_end` (timestamp with time zone), `has_used_trial` (boolean, default false).
    *   **`profiles` Table:**
        *   Add/Ensure `role` column (text, e.g., 'guardian', 'student', 'admin'). Assign 'admin' role manually via Supabase dashboard initially.
    *   **RLS Policies:** Implement policies for `subscription_plans` (readable by all authenticated) and `user_subscriptions` (user can read/manage their own, admin can read all). Update `profiles` RLS for the new role. [SEC-RULES]

3.  **Backend Logic (Supabase Edge Functions):** [Check techContext.md#backend]
    *   `create-paypal-product-plan`: (Likely manual/scripted initially) Function to create the 'Basic' Product and 1-Year Plan in PayPal using the defined price.
    *   `create-paypal-subscription`: Handles subscription initiation. Checks `has_used_trial`. If not used, sets up the subscription with a 30-day trial period via PayPal API. Updates `user_subscriptions` with trial dates and sets `has_used_trial` to true.
    *   `get-paypal-subscription-details`: Fetches current subscription details from PayPal (useful for syncing status).
    *   `webhook-handler`: Securely listens for PayPal events (e.g., `BILLING.SUBSCRIPTION.ACTIVATED`, `PAYMENT.SALE.COMPLETED`, `BILLING.SUBSCRIPTION.CANCELLED`, `BILLING.SUBSCRIPTION.EXPIRED`). Updates `user_subscriptions` status accordingly. Must verify webhook signatures. [SEC-RULES]
    *   `admin-get-user-subscriptions`: New Edge Function restricted to 'admin' role to fetch all user subscription data.

**Phase 2: Frontend Implementation** [PM-RULES: Project Phase]

1.  **Subscription UI Components:** [ARCH-RULES] [UI/Styling]
    *   `SubscriptionPlans`: Display the 'Basic' 1-year plan details, price (**TBD**), and mention the 30-day free trial for new users.
    *   `SubscribeButton`: Integrates PayPal JS SDK Buttons. Initiates the checkout flow, passing necessary info to the `create-paypal-subscription` Edge Function.
    *   `SubscriptionManagementPanel`: For Guardians to view their current status ('Trialing', 'Active', 'Cancelled', 'Expired'), relevant dates (trial end, next billing date), and a button/link that redirects to their PayPal account to manage/cancel the subscription.
2.  **Admin UI Components:** [ARCH-RULES] [UI/Styling]
    *   `AdminLayout`: Wrapper component using React Router or similar to restrict access to admin routes based on the user's 'admin' role fetched from their profile.
    *   `AdminSubscriptionDashboard`: Main view within `AdminLayout`.
    *   `UserSubscriptionList`: Component within the dashboard to display user subscription data fetched via `admin-get-user-subscriptions`. Shows user email/name, plan, status, and relevant dates.
3.  **Integration & Hooks:** [React Component Structure]
    *   Update `useUserSubscription` hook (or create new) to fetch and manage the user's subscription state, including trial status.
    *   Create `useAdminSubscriptions` hook for the admin dashboard.
    *   Implement role-based routing and component rendering logic.
    *   Update application logic (e.g., access to PDF generation, **other features TBD**) to check for 'trialing' or 'active' subscription status.
    *   Utilize centralized error handling. [Error Handling Patterns]

**Phase 3: Testing & Security** [PM-RULES: Deep Work]

1.  **Testing Strategy:** [TEST-RULES]
    *   Add unit/component tests for new UI components and hooks.
    *   Add integration tests for Edge Functions, especially trial logic and webhook handling.
    *   Add E2E tests (Playwright) for:
        *   Trial sign-up flow.
        *   Post-trial subscription activation (simulated via webhooks).
        *   Admin dashboard access and data display.
        *   Verifying redirection to PayPal for cancellation.
    *   Thoroughly test webhook handler with PayPal Sandbox events.
2.  **Security Review:** [SEC-RULES]
    *   Review RLS policies for the 'admin' role and subscription tables.
    *   Ensure admin-only Edge Functions are properly protected.
    *   Verify secure credential handling and webhook signature validation.

**Phase 4: Documentation & Deployment** [PM-RULES: Sprint]

1.  **Memory Bank Updates:** [mem:] [CLI-RULES] Document the trial system, admin role implementation, updated database schema, new Edge Functions, and PayPal integration details in relevant `.md` files (e.g., `systemPatterns.md`, `techContext.md`, `progress.md`, potentially a new `paypal_integration.md`).
2.  **Deployment:** [Deployment Workflow] Configure Production PayPal credentials/webhook in Netlify, deploy Edge Functions, deploy frontend. Ensure the process for assigning the 'admin' role is documented/understood.

**Finalized Subscription & Trial Details:**

*   The "Basic" subscription is $60 per year.
*   Free trial allows a user to add 1 student, enter up to 5 classes, and create a PDF export.
*   After 30 days, class entry/editing is disabled and PDF export is unavailable unless the user subscribes.
*   Each account is eligible for only one trial period.

**Mermaid Diagram: High-Level Flow**

```mermaid
graph TD
    subgraph User Frontend (React)
        A[View Plans] --> B{Select Plan};
        B --> C[PayPal Checkout Button];
        C -- PayPal JS SDK --> D(PayPal Checkout Flow);
        E[Manage Subscription Panel] --> F{View Status};
        E --> G[Link to PayPal Mgmt];
    end

    subgraph Supabase Backend
        H[Edge Function: Create Subscription]
        I[Edge Function: Webhook Handler]
        J[(Database: user_subscriptions)]
        K[(Database: subscription_plans)]
        L[Edge Function: Admin Get Subs]
    end

    subgraph PayPal
        D -- Creates Subscription --> M(PayPal Subscription Created);
        M -- Webhook Event --> I;
        G -- User Action --> N(PayPal Account Management);
        N -- Webhook Event (e.g., Cancelled) --> I;
        C -- Initiates --> H -- API Call --> M;
    end

    I -- Updates --> J;
    A --> K;
    F --> J;

    subgraph Admin Frontend
        O[Admin Dashboard] --> P{View All Subscriptions};
        P -- Calls --> L -- Reads --> J;
    end