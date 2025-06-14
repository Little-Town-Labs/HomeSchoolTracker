import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log(`Function "get-paypal-subscription-details" up and running!`)

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

// Helper to get user role
async function getUserRole(supabaseAdmin: SupabaseClient, userId: string): Promise<string | null> {
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

    if (profileError) {
        console.error(`Profile fetch error for user ${userId}:`, profileError);
        // Don't throw here, let the caller decide how to handle role check failure
        return null;
    }
    return profile?.role ?? null;
}

// Helper to get user's own PayPal subscription ID
async function getUserPayPalSubscriptionId(supabaseAdmin: SupabaseClient, userId: string): Promise<string | null> {
    const { data: subData, error: subError } = await supabaseAdmin
        .from('user_subscriptions')
        .select('paypal_subscription_id')
        .eq('user_id', userId)
        // Add filtering for relevant statuses if needed (e.g., not 'cancelled')
        // .in('status', ['active', 'trialing', 'pending_approval'])
        .maybeSingle(); // User might not have a subscription or multiple (shouldn't happen with onConflict)

    if (subError) {
        console.error(`Error fetching subscription for user ${userId}:`, subError);
        throw new Error('Failed to retrieve user subscription data.');
    }
    // Return the ID, or null if no active/pending subscription found
    return subData?.paypal_subscription_id ?? null;
}


serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Expect POST request (admins might send ID in body)
   if (req.method !== 'POST') {
     return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       status: 405
     })
   }

  try {
    // 1. Create Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Verify User Authentication
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

    // 3. Check User Role
    const userRole = await getUserRole(supabaseAdmin, userId);
    if (userRole === null) {
        // Handle case where role couldn't be fetched (logged in helper)
         return new Response(JSON.stringify({ error: 'Failed to verify user role.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const isAdmin = userRole === 'admin';

    // 4. Determine which PayPal Subscription ID to fetch
    let paypalSubscriptionIdToFetch: string | null = null;

    if (isAdmin) {
      // Admin can request details for any subscription ID passed in the body
      try {
        // Check if request body exists before parsing
        if (!req.body) {
             throw new Error('Missing request body for admin request.');
        }
        const body = await req.json();
        const paypalSubscriptionIdFromBody = body?.paypalSubscriptionId; // Optional chaining

        if (!paypalSubscriptionIdFromBody || typeof paypalSubscriptionIdFromBody !== 'string') {
            throw new Error('Missing or invalid paypalSubscriptionId in request body for admin request.');
        }
        paypalSubscriptionIdToFetch = paypalSubscriptionIdFromBody;
        console.log(`Admin ${userId} requesting details for subscription: ${paypalSubscriptionIdToFetch}`);
      } catch (parseError) {
          console.error("Admin request body parse error:", parseError);
          const errorMessage = parseError instanceof Error ? parseError.message : 'Invalid request body for admin.';
          return new Response(JSON.stringify({ error: errorMessage }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } else {
      // Regular user can only fetch their own subscription details
      paypalSubscriptionIdToFetch = await getUserPayPalSubscriptionId(supabaseAdmin, userId);
      if (!paypalSubscriptionIdToFetch) {
          console.log(`User ${userId} has no active PayPal subscription ID found.`);
          // Return 404 or an empty object/specific message? Let's go with 404.
          return new Response(JSON.stringify({ error: 'No active subscription found for this user.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
       console.log(`User ${userId} requesting details for their subscription: ${paypalSubscriptionIdToFetch}`);
    }

    // 5. Get PayPal Credentials from Env Vars
    const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID')
    const paypalClientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')
    const paypalApiUrl = Deno.env.get('PAYPAL_API_URL') || 'https://api-m.sandbox.paypal.com'

    if (!paypalClientId || !paypalClientSecret) {
      console.error('Missing required PayPal environment variables (CLIENT_ID, SECRET)')
      throw new Error('PayPal API credentials not configured.')
    }

    // 6. Get PayPal Access Token
    const accessToken = await getPayPalAccessToken(paypalClientId, paypalClientSecret, paypalApiUrl)

    // 7. Fetch Subscription Details from PayPal API
    const detailsResponse = await fetch(`${paypalApiUrl}/v1/billing/subscriptions/${paypalSubscriptionIdToFetch}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!detailsResponse.ok) {
      const errorBody = await detailsResponse.text()
      console.error(`PayPal Subscription Details Fetch Error (${detailsResponse.status}) for ID ${paypalSubscriptionIdToFetch}:`, errorBody)
      // Provide more context in the error message
      // The main catch block will handle mapping the status code based on the error message.

      throw new Error(`Failed to fetch PayPal subscription details (Status: ${detailsResponse.status}): ${detailsResponse.statusText}`)
    }

    const subscriptionDetails = await detailsResponse.json()

    // 8. Return Subscription Details
    return new Response(JSON.stringify(subscriptionDetails), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in get-paypal-subscription-details:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.'
    // Determine status code based on error type if possible
    let status = 500; // Default to internal server error
    if (errorMessage.includes('not found') || errorMessage.includes('No active subscription')) {
        status = 404;
    } else if (errorMessage.includes('Missing') || errorMessage.includes('invalid')) {
        status = 400;
    } else if (errorMessage.includes('Authentication') || errorMessage.includes('Authorization')) {
        status = 401;
    } else if (errorMessage.includes('Failed to verify user role')) {
        status = 500; // Internal issue fetching role
    } else if (errorMessage.includes('Failed to fetch PayPal subscription details')) {
        // Extract status from message if possible, otherwise keep 500
        const match = errorMessage.match(/Status: (\d+)/);
        if (match && match[1]) {
            const paypalStatus = parseInt(match[1], 10);
            if (paypalStatus === 404) status = 404; // Map PayPal 404 to our 404
            // Add other mappings if needed
        }
    }


    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status,
    })
  }
})