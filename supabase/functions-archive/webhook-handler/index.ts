import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
// NOTE: Actual signature verification might require crypto libraries.
// Example using Deno's standard library (needs careful implementation based on PayPal docs)
// import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

console.log(`Function "webhook-handler" up and running!`)

// --- Types for better clarity (adjust based on actual PayPal event structure) ---
interface PayPalWebhookEvent {
  id: string;
  event_version: string;
  create_time: string;
  resource_type: string;
  event_type: string;
  summary: string;
  resource: PayPalSubscriptionResource;
  links: Array<{ href: string; rel: string; method: string }>;
}

interface PayPalSubscriptionResource {
    id: string; // PayPal Subscription ID
    plan_id: string;
    start_time: string;
    quantity: string;
    shipping_amount: { currency_code: string; value: string };
    subscriber: {
        name: { given_name: string; surname: string };
        email_address: string;
        payer_id: string;
    };
    billing_info?: { // Optional, might not be present in all events
        outstanding_balance: { currency_code: string; value: string };
        cycle_executions: Array<{
            tenure_type: string;
            sequence: number;
            cycles_completed: number;
            cycles_remaining: number;
            current_pricing_scheme_version: number;
            total_cycles: number;
        }>;
        last_payment: { amount: { currency_code: string; value: string }; time: string };
        next_billing_time?: string; // Key field for renewal date
        failed_payments_count: number;
    };
    create_time: string;
    update_time: string;
    status: 'APPROVAL_PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
    status_update_time: string;
    custom_id?: string; // Should contain our user_id if set during creation
    // ... other fields
}


// --- Webhook Verification ---
// Reference: https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature
async function verifyPayPalWebhookSignature(req: Request, rawBody: string): Promise<boolean> {
  const PAYPAL_WEBHOOK_ID = Deno.env.get('PAYPAL_WEBHOOK_ID')
  const PAYPAL_API_URL = Deno.env.get('PAYPAL_API_URL') || 'https://api-m.sandbox.paypal.com'
  const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID')
  const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET')

  if (!PAYPAL_WEBHOOK_ID || !PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    console.error('Missing required PayPal environment variables for webhook verification (WEBHOOK_ID, CLIENT_ID, SECRET)')
    return false // Cannot verify without credentials
  }

  const transmissionId = req.headers.get('paypal-transmission-id')
  const transmissionTime = req.headers.get('paypal-transmission-time')
  const certUrl = req.headers.get('paypal-cert-url')
  const authAlgo = req.headers.get('paypal-auth-algo')
  const transmissionSig = req.headers.get('paypal-transmission-sig')

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    console.error('Webhook Error: Missing required PayPal headers for verification.')
    return false
  }

  console.log('Verifying PayPal webhook signature with headers:', {
    transmissionId,
    transmissionTime,
    certUrl,
    authAlgo,
    // Omit actual signature for security
  })
  console.log('Webhook ID used for verification:', PAYPAL_WEBHOOK_ID)

  // Get PayPal access token for API verification
  async function getPayPalAccessToken(clientId: string, clientSecret: string, baseUrl: string): Promise<string> {
    const credentials = btoa(`${clientId}:${clientSecret}`)
    
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    })
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      throw new Error(`Failed to get PayPal access token: ${tokenResponse.status} ${errorText}`)
    }
    
    const tokenData = await tokenResponse.json()
    return tokenData.access_token
  }

  // Use PayPal's API to verify the webhook signature
  try {
    const accessToken = await getPayPalAccessToken(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_API_URL)
    
    const verificationResponse = await fetch(`${PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: PAYPAL_WEBHOOK_ID,
        webhook_event: JSON.parse(rawBody) // Send the parsed event body
      }),
    })
    
    if (!verificationResponse.ok) {
      const errorBody = await verificationResponse.text()
      console.error(`PayPal Verification API Error (${verificationResponse.status}):`, errorBody)
      return false
    }
    
    const verificationResult = await verificationResponse.json()
    const isVerified = verificationResult.verification_status === 'SUCCESS'
    
    if (isVerified) {
      console.log('PayPal webhook signature verified successfully')
    } else {
      console.error('PayPal webhook signature verification failed:', verificationResult)
    }
    
    return isVerified
  } catch (apiError) {
    console.error("Error calling PayPal verification API:", apiError)
    return false
  }
}

// --- Database Update Logic ---
async function handleSubscriptionUpdate(supabaseAdmin: SupabaseClient, resource: PayPalSubscriptionResource) {
  const paypalSubscriptionId = resource.id
  const paypalStatus = resource.status
  const nextBillingTime = resource.billing_info?.next_billing_time
  // Add other relevant fields from resource as needed, e.g., resource.billing_info.last_payment.time

  console.log(`Processing update for PayPal subscription ${paypalSubscriptionId}, Status: ${paypalStatus}`)

  // Map PayPal status to your internal status enum/values
  let internalStatus: string | null = null;
  switch (paypalStatus) {
    case 'ACTIVE':
      internalStatus = 'active'
      break
    case 'CANCELLED':
      internalStatus = 'cancelled'
      break
    case 'SUSPENDED':
      internalStatus = 'suspended' // Or map to 'paused', 'payment_failed' etc.
      break
    case 'EXPIRED':
      internalStatus = 'expired'
      break
    case 'APPROVAL_PENDING':
      internalStatus = 'pending_approval' // Should already be set, but good to handle
      break;
    case 'APPROVED': // User approved, but might not be active yet (e.g., future start)
      internalStatus = 'approved'; // Or map directly to 'active' if no future start
      break;
    default:
      console.warn(`Unhandled PayPal subscription status: ${paypalStatus} for ID: ${paypalSubscriptionId}`)
      return; // Don't update DB for unhandled statuses
  }

  // Use Record for better type safety than allowing 'any' implicitly
  const updatePayload: Record<string, string | undefined> = {
    status: internalStatus,
  };

  // Update renewal date if available and status is active
  if (internalStatus === 'active' && nextBillingTime) {
    updatePayload.current_period_end = nextBillingTime;
    // Potentially update current_period_start based on last_payment time if available
  }
  // Add logic to update trial_end_date if the subscription becomes active after a trial

  const { data, error } = await supabaseAdmin
    .from('user_subscriptions')
    .update(updatePayload)
    .eq('paypal_subscription_id', paypalSubscriptionId)
    .select('id, user_id') // Select to confirm update and log user ID

  if (error) {
    console.error(`DB Error updating subscription status for PayPal ID ${paypalSubscriptionId}:`, error)
    // Consider sending an alert here for monitoring
    throw new Error(`Database update failed for PayPal subscription ${paypalSubscriptionId}: ${error.message}`)
  }
  if (!data || data.length === 0) {
    console.warn(`No subscription found in DB to update for PayPal ID: ${paypalSubscriptionId}. Webhook received for potentially unknown subscription.`)
    // This might happen if the creation step failed to save to DB, or if webhook is for an old/deleted record.
  } else {
    console.log(`Successfully updated DB status for PayPal ID ${paypalSubscriptionId} (User: ${data[0].user_id}) to ${internalStatus}`)
  }
}


// --- Main Handler ---
serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  let rawBody: string;
  try {
    rawBody = await req.text(); // Read body once
  } catch (readError) {
      console.error("Error reading webhook request body:", readError);
      return new Response(JSON.stringify({ error: 'Failed to read request body' }), { status: 400 });
  }

  try {
    // 1. Verify Webhook Signature (CRITICAL)
    const isVerified = await verifyPayPalWebhookSignature(req, rawBody)
    if (!isVerified) {
      console.error('Webhook signature verification failed!')
      return new Response('Signature verification failed', { status: 401 })
    }
    console.log('Webhook signature verified successfully.')

    // 2. Parse the webhook event payload
    const event: PayPalWebhookEvent = JSON.parse(rawBody)
    const eventType = event.event_type
    const resource = event.resource // Contains the actual subscription/payment data

    console.log(`Received PayPal webhook event: ${eventType}, Resource Type: ${event.resource_type}`)

    // 3. Handle relevant SUBSCRIPTION events (add payment events if needed)
    if (event.resource_type.toLowerCase().includes('subscription') && resource?.id) {
        // Ensure resource looks like a subscription object before processing
        if (typeof resource.status === 'string') {
             await handleSubscriptionUpdate(
               createClient( // Create client within the handler scope
                 Deno.env.get('SUPABASE_URL') ?? '',
                 Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
               ),
               resource as PayPalSubscriptionResource // Cast resource
             );
        } else {
             console.warn(`Webhook event ${eventType} (ID: ${event.id}) has subscription resource_type but missing 'status' in resource. Skipping DB update.`);
        }

    } else if (event.resource_type.toLowerCase().includes('sale')) {
        // Example: Handle payment success/failure/refunds if needed
        console.log(`Handling payment-related event: ${eventType}`);
        // Add specific logic for payment events, e.g., logging, updating payment status
        // const saleDetails = event.resource;
        // const relatedSubscriptionId = saleDetails?.billing_agreement_id; // Check PayPal docs for correct field
        // if (relatedSubscriptionId) { ... }

    } else {
      console.log(`Unhandled or irrelevant resource type: ${event.resource_type} for event type: ${eventType}`)
    }

    // 4. Respond to PayPal with 200 OK immediately after processing attempt
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error processing PayPal webhook:', error)
    // Avoid sending detailed errors back in webhook responses
    // Log the raw body for debugging if an error occurs during processing
    console.error("Webhook Raw Body on Error:", rawBody.substring(0, 500) + '...'); // Log more body on error
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})