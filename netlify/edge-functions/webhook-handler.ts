import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

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
    shipping_address?: {
      name: { full_name: string };
      address: {
        address_line_1: string;
        address_line_2?: string;
        admin_area_2: string;
        admin_area_1: string;
        postal_code: string;
        country_code: string;
      };
    };
  };
  billing_info: {
    outstanding_balance: { currency_code: string; value: string };
    cycle_executions: Array<{
      tenure_type: string;
      sequence: number;
      cycles_completed: number;
      cycles_remaining: number;
      current_pricing_scheme_version: number;
    }>;
    last_payment: {
      amount: { currency_code: string; value: string };
      time: string;
    };
    next_billing_time: string;
    failed_payments_count: number;
  };
  create_time: string;
  update_time: string;
  links: Array<{ href: string; rel: string; method: string }>;
  status: string;
  status_update_time: string;
}

export default async (req: Request) => {
  try {
    // Only allow POST requests for webhooks
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse the webhook payload
    const webhookEvent: PayPalWebhookEvent = await req.json();
    
    console.log('Received PayPal webhook:', {
      eventType: webhookEvent.event_type,
      eventId: webhookEvent.id,
      resourceType: webhookEvent.resource_type
    });

    // Verify webhook signature (simplified - in production, implement full verification)
    const webhookId = req.headers.get('PAYPAL-TRANSMISSION-ID');
    if (!webhookId) {
      console.warn('Missing PayPal webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle different event types
    switch (webhookEvent.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(supabaseClient, webhookEvent);
        break;
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(supabaseClient, webhookEvent);
        break;
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(supabaseClient, webhookEvent);
        break;
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handlePaymentFailed(supabaseClient, webhookEvent);
        break;
      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(supabaseClient, webhookEvent);
        break;
      default:
        console.log(`Unhandled webhook event type: ${webhookEvent.event_type}`);
    }

    return new Response(JSON.stringify({ message: 'Webhook processed successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Helper functions for handling different webhook events
async function handleSubscriptionActivated(supabase: SupabaseClient, event: PayPalWebhookEvent) {
  const subscription = event.resource;
  
  try {
    // Update subscription status in database
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        paypal_subscription_id: subscription.id,
        updated_at: new Date().toISOString()
      })
      .eq('paypal_subscription_id', subscription.id);

    if (error) {
      console.error('Failed to update subscription status:', error);
    } else {
      console.log(`Subscription ${subscription.id} activated successfully`);
    }
  } catch (error) {
    console.error('Error handling subscription activation:', error);
  }
}

async function handleSubscriptionCancelled(supabase: SupabaseClient, event: PayPalWebhookEvent) {
  const subscription = event.resource;
  
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('paypal_subscription_id', subscription.id);

    if (error) {
      console.error('Failed to update subscription status:', error);
    } else {
      console.log(`Subscription ${subscription.id} cancelled successfully`);
    }
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

async function handleSubscriptionSuspended(supabase: SupabaseClient, event: PayPalWebhookEvent) {
  const subscription = event.resource;
  
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .eq('paypal_subscription_id', subscription.id);

    if (error) {
      console.error('Failed to update subscription status:', error);
    } else {
      console.log(`Subscription ${subscription.id} suspended successfully`);
    }
  } catch (error) {
    console.error('Error handling subscription suspension:', error);
  }
}

async function handlePaymentFailed(supabase: SupabaseClient, event: PayPalWebhookEvent) {
  const subscription = event.resource;
  
  try {
    // Log payment failure
    const { error } = await supabase
      .from('payment_logs')
      .insert({
        subscription_id: subscription.id,
        event_type: 'payment_failed',
        event_data: event,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log payment failure:', error);
    } else {
      console.log(`Payment failure logged for subscription ${subscription.id}`);
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentCompleted(supabase: SupabaseClient, event: PayPalWebhookEvent) {
  try {
    // Log successful payment
    const { error } = await supabase
      .from('payment_logs')
      .insert({
        event_type: 'payment_completed',
        event_data: event,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log payment completion:', error);
    } else {
      console.log('Payment completion logged successfully');
    }
  } catch (error) {
    console.error('Error handling payment completion:', error);
  }
}

export const config = {
  path: "/api/webhook-handler"
}; 