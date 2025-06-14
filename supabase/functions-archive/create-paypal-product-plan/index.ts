import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log(`Function "create-paypal-product-plan" (fetching plan details) up and running!`)

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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Create Supabase Admin Client
    // Use admin client to access protected env vars and check user roles
    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      // No need to pass user auth header here for service_role actions
    )

    // 2. Verify User Authentication and Role from the incoming request JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const { data: { user }, error: userError } = await supabaseAdminClient.auth.getUser(authHeader.replace('Bearer ', ''))


    // Add check for null user even if no error
    if (userError || !user) {
      console.error('Auth Error or User Null:', userError)
      return new Response(JSON.stringify({ error: 'Authentication required or invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Now we know user is not null, proceed to check role
    // Fetch profile to check role, assuming role is stored in 'profiles' table
    const { data: profile, error: profileError } = await supabaseAdminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id) // Safe to use user.id here
      .single()

    if (profileError || !profile) {
        // Log the specific user ID causing the profile fetch error
        console.error(`Profile fetch error for user ${user.id}:`, profileError);
        return new Response(JSON.stringify({ error: 'Failed to verify user role' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const isAdmin = profile.role === 'admin' // Ensure 'admin' role exists in your profiles table enum/type
    if (!isAdmin) {
       // Log the specific user ID and their role
       console.warn(`User ${user.id} (Role: ${profile.role}) attempted admin action without required role.`);
       return new Response(JSON.stringify({ error: 'Forbidden: Admin role required' }), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 403,
       })
    }

    // 3. Get PayPal Credentials and Plan ID from Environment Variables
    const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID')
    const paypalClientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')
    // Use PAYPAL_API_URL or default to sandbox
    const paypalApiUrl = Deno.env.get('PAYPAL_API_URL') || 'https://api-m.sandbox.paypal.com'
    const paypalPlanId = Deno.env.get('PAYPAL_PLAN_ID') // Specific Plan ID to fetch

    if (!paypalClientId || !paypalClientSecret || !paypalPlanId) {
      console.error('Missing required PayPal environment variables (CLIENT_ID, CLIENT_SECRET, PLAN_ID)')
      throw new Error('PayPal API credentials or Plan ID not configured.')
    }

    // 4. Get PayPal Access Token
    const accessToken = await getPayPalAccessToken(paypalClientId, paypalClientSecret, paypalApiUrl)

    // 5. Fetch Plan Details from PayPal
    const planResponse = await fetch(`${paypalApiUrl}/v1/billing/plans/${paypalPlanId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!planResponse.ok) {
      const errorBody = await planResponse.text()
      console.error(`PayPal Plan Fetch Error Response (${planResponse.status}):`, errorBody)
      throw new Error(`Failed to fetch PayPal plan details: ${planResponse.statusText}`)
    }

    const planDetails = await planResponse.json()

    // 6. Return Plan Details
    return new Response(JSON.stringify(planDetails), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in create-paypal-product-plan (fetch details):', error)
    // Ensure error.message is captured, default if not present
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.'
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})