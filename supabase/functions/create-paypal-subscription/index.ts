import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log(`Function "create-paypal-subscription" up and running!`)

// Helper function to get PayPal access token
async function getPayPalAccessToken(clientId: string, clientSecret: string, apiUrl: string): Promise<string> {
  const auth = btoa(`${clientId}:${clientSecret}`)
  const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('PayPal Auth Error Response:', errorBody)
    throw new Error(`Failed to get PayPal access token: ${response.statusText}`)
  }

  const data = await response.json()
  return data.access_token
}

// Helper to get internal plan UUID from PayPal Plan ID
async function getInternalPlanUuid(supabaseAdmin: SupabaseClient, paypalPlanId: string): Promise<string> {
    const { data: planData, error: planError } = await supabaseAdmin
        .from('subscription_plans')
        .select('id')
        .eq('paypal_plan_id', paypalPlanId)
        .single(); // Expecting only one plan with this PayPal ID

    if (planError || !planData) {
        console.error(`Error fetching internal plan UUID for PayPal plan ${paypalPlanId}:`, planError);
        throw new Error(`Internal plan configuration not found for PayPal plan ID: ${paypalPlanId}`);
    }
    return planData.id;
}


serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Expect POST request with optional body (if plan selection is needed)
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405
    })
  }

  try {
    // 1. Create Supabase Admin Client (for auth check and DB operations)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Verify User Authentication from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))

    if (userError || !user) {
      console.error('Auth Error or User Null:', userError)
      return new Response(JSON.stringify({ error: 'Authentication required or invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }
    const userId = user.id;

    // 3. Get PayPal Credentials, Plan ID, and Return URLs from Env Vars
    const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID')
    const paypalClientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')
    const paypalApiUrl = Deno.env.get('PAYPAL_API_URL') || 'https://api-m.sandbox.paypal.com'
    const paypalPlanId = Deno.env.get('PAYPAL_PLAN_ID') // Assuming one primary plan for now
    const frontendReturnUrl = Deno.env.get('FRONTEND_PAYPAL_RETURN_URL') // e.g., https://yourapp.com/subscribe/success
    const frontendCancelUrl = Deno.env.get('FRONTEND_PAYPAL_CANCEL_URL') // e.g., https://yourapp.com/subscribe/cancel

    if (!paypalClientId || !paypalClientSecret || !paypalPlanId || !frontendReturnUrl || !frontendCancelUrl) {
      console.error('Missing required PayPal/Frontend environment variables (CLIENT_ID, SECRET, PLAN_ID, RETURN_URL, CANCEL_URL)')
      throw new Error('PayPal API credentials, Plan ID, or Frontend URLs not configured.')
    }

    // 4. Get Internal Plan UUID
    const internalPlanUuid = await getInternalPlanUuid(supabaseAdmin, paypalPlanId);

    // 5. Get PayPal Access Token
    const accessToken = await getPayPalAccessToken(paypalClientId, paypalClientSecret, paypalApiUrl)

    // 6. Create PayPal Subscription via API
    const createSubscriptionPayload = {
      plan_id: paypalPlanId,
      // start_time: // Optional: Can specify a future start time
      // quantity: '1', // Default is 1
      custom_id: userId, // Link the subscription to our user ID
      application_context: {
        brand_name: 'HomeSchoolTracker', // Your app name
        locale: 'en-US',
        // shipping_preference: 'NO_SHIPPING', // For digital goods
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
        return_url: frontendReturnUrl,
        cancel_url: frontendCancelUrl,
      },
    }

    const createResponse = await fetch(`${paypalApiUrl}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': crypto.randomUUID(), // Recommended for idempotency
      },
      body: JSON.stringify(createSubscriptionPayload),
    })

    if (!createResponse.ok || createResponse.status !== 201) { // Expect 201 Created
      const errorBody = await createResponse.text()
      console.error(`PayPal Subscription Create Error (${createResponse.status}):`, errorBody)
      throw new Error(`Failed to create PayPal subscription: ${createResponse.statusText}`)
    }

    const paypalSubscriptionData = await createResponse.json()
    const paypalSubscriptionId = paypalSubscriptionData.id
    const approvalLink = paypalSubscriptionData.links?.find((link: { rel: string }) => link.rel === 'approve')?.href

    if (!paypalSubscriptionId || !approvalLink) {
        console.error('PayPal response missing subscription ID or approval link:', paypalSubscriptionData)
        throw new Error('Failed to get subscription ID or approval link from PayPal.')
    }

    // 7. Upsert initial record in user_subscriptions
    // Status should reflect that it needs user approval via the link
    const upsertData = {
      user_id: userId,
      plan_id: internalPlanUuid,
      paypal_subscription_id: paypalSubscriptionId,
      status: 'pending_approval', // Initial status before user approves in PayPal
      // trial dates, period dates etc., will be updated by webhook later
      has_used_trial: false, // Assume new subs haven't used trial yet, webhook can update if needed
    }

    const { error: upsertError } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert(upsertData, { onConflict: 'user_id' }) // Upsert based on user_id

    if (upsertError) {
      // Log critical error: PayPal sub created but DB failed. Manual intervention might be needed.
      console.error(`CRITICAL: Failed to upsert user_subscription for user ${userId}, PayPal sub ${paypalSubscriptionId}. Error:`, upsertError)
      // Don't throw here, as we still want to return the approval link if possible
      // But ensure this error is monitored.
    }

    // 8. Return the approval link to the frontend
    return new Response(JSON.stringify({ approvalUrl: approvalLink }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // OK, even if DB upsert had logged error
    })

  } catch (error) {
    console.error('Error in create-paypal-subscription:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.'
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})