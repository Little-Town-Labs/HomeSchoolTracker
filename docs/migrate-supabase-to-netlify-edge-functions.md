# Migrating Supabase Edge Functions to Netlify Edge Functions

This guide provides a step-by-step process for migrating your Supabase Edge Functions to Netlify Edge Functions for the HomeSchoolTracker project.

---

## Prerequisites

- **Netlify CLI installed** (`netlify --version` should work)
- **Netlify-Supabase integration configured** (environment variables set)
- **Vite** as the frontend framework
- **Supabase Edge Functions** currently in `supabase/functions/`

---

## 1. Preparation

1. **Verify Netlify CLI**
   ```sh
   netlify --version
   ```
2. **Create Netlify Functions Directory**
   - Recommended: `netlify/edge-functions/` or `netlify/functions/`
   - Example:
     ```sh
     mkdir -p netlify/edge-functions
     ```
3. **Review Environment Variables**
   - Ensure `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and PayPal secrets are set in Netlify
   - Netlify-Supabase integration should handle this automatically

---

## 2. Migrate a Sample Function

1. **Choose a Function to Migrate**
   - Start with a simple function (e.g., `admin-get-users`) or a critical one (e.g., `webhook-handler`)
2. **Copy Function Logic**
   - Copy the code from `supabase/functions/<function>/index.ts` to `netlify/edge-functions/<function>.ts`
3. **Update Imports and APIs**
   - Use Netlify Edge Function APIs (still Deno runtime)
   - Replace any Supabase-specific function handlers with Netlify's handler signature:
     ```ts
     export default async (request: Request) => {
       /* ... */
     };
     ```
   - Access environment variables with `Deno.env.get('VAR_NAME')`
4. **Migrate Shared Utilities**
   - Move files like `_shared/cors.ts` to `netlify/edge-functions/_shared/`
   - Update import paths accordingly
5. **Adjust CORS Handling**
   - Netlify handles CORS for same-origin requests, but you may need to add headers for external APIs (e.g., PayPal webhooks)

---

## 3. Update Routing and Configuration

1. **Edit `netlify.toml`**
   - Add or update function routing rules:
     ```toml
     [[edge_functions]]
       path = "/api/webhook-handler"
       function = "webhook-handler"
     ```
   - Repeat for each migrated function
2. **Update Webhook URLs**
   - If using PayPal or other webhooks, update the endpoint URLs in third-party dashboards to point to the new Netlify deployment

---

## 4. Test Locally

1. **Start Local Dev Server**
   ```sh
   netlify dev
   ```
2. **Test Functionality**
   - Use your frontend or API tools (e.g., Postman) to call the migrated function endpoints
   - Check logs and responses for errors
3. **Validate Environment Variables**
   - Ensure all required variables are available in the function context

---

## 5. Migrate Remaining Functions

- Repeat steps in section 2 for each Supabase function
- Test each function locally after migration

---

## 6. Deploy and Validate

1. **Deploy to Netlify**
   ```sh
   netlify deploy --prod
   ```
2. **Test in Production**
   - Validate all endpoints and integrations (PayPal, Supabase, email, etc.)
   - Monitor Netlify function logs for errors
3. **Update Documentation**
   - Document new endpoints and any changes in usage

---

## 7. Cleanup

- Remove or archive old Supabase Edge Functions after confirming stable migration
- Update any references in your codebase or documentation

---

## Additional Tips

- **Version Control:** Commit each migration step separately
- **Monitoring:** Use Netlify's function logs for debugging
- **Rollback:** Use Netlify's deploy history to revert if needed

---

**For questions or troubleshooting, refer to Netlify and Supabase documentation, or ask for help in the project chat.**
