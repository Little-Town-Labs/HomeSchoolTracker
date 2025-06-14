import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log(`Function "cancel-paypal-subscription" up and running!`)

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

  // Expect POST request with subscription ID in body
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405
    })
  }

  try {
    // 1. Parse request body
    const requestData = await req.json()
    const { subscription_id, paypal_subscription_id } = requestData

    if (!subscription_id || !paypal_subscription_id) {
      return new Response(JSON.stringify({ error: 'Missing required parameters: subscription_id and paypal_subscription_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // 2. Create Supabase Admin Client (for auth check and DB operations)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Verify User Authentication from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
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

    // 4. Verify the subscription belongs to the authenticated user
    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscription_id)
      .eq('user_id', userId)
      .single()

    if (subscriptionError || !subscriptionData) {
      console.error('Subscription verification error:', subscriptionError)
      return new Response(JSON.stringify({ error: 'Subscription not found or does not belong to authenticated user' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
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

    // 7. Cancel PayPal Subscription via API
    // We'll set cancel_at_period_end=true to allow the subscription to continue until the end of the current period
    const cancelResponse = await fetch(`${paypalApiUrl}/v1/billing/subscriptions/${paypal_subscription_id}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': crypto.randomUUID(), // Recommended for idempotency
      },
      body: JSON.stringify({
        reason: 'Customer requested cancellation'
      }),
    })

    if (!cancelResponse.ok) {
      const errorBody = await cancelResponse.text()
      console.error(`PayPal Subscription Cancel Error (${cancelResponse.status}):`, errorBody)
      throw new Error(`Failed to cancel PayPal subscription: ${cancelResponse.statusText}`)
    }

    // 8. Update subscription status in database
    const { error: updateError } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription_id)

    if (updateError) {
      console.error('Error updating subscription status in database:', updateError)
      // Don't throw here, as we've already cancelled with PayPal
      // But ensure this error is monitored.
    }

    // 9. Return success response
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Subscription cancelled successfully. It will remain active until the end of the current billing period.' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in cancel-paypal-subscription:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.'
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})