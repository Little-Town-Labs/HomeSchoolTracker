import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

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
    throw new Error(`PayPal authentication failed: ${response.status}`)
  }

  const data = await response.json()
  return data.access_token
}

export default async (req: Request) => {
  try {
    // Only allow POST requests
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

    // Check if the user is authenticated and has admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const body = await req.json();
    const { productName, productDescription, planName, planDescription, price, currency = 'USD' } = body;

    if (!productName || !planName || !price) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: productName, planName, price' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get PayPal credentials from environment
    const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const paypalClientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
    const paypalApiUrl = Deno.env.get('PAYPAL_API_URL') || 'https://api-m.sandbox.paypal.com';

    if (!paypalClientId || !paypalClientSecret) {
      console.error('Missing PayPal credentials');
      return new Response(JSON.stringify({ error: 'PayPal configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken(paypalClientId, paypalClientSecret, paypalApiUrl);

    // Step 1: Create Product
    const productPayload = {
      name: productName,
      description: productDescription || `Product for ${productName}`,
      type: 'SERVICE',
      category: 'SOFTWARE'
    };

    const productResponse = await fetch(`${paypalApiUrl}/v1/catalogs/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'PayPal-Request-Id': `product-${Date.now()}`,
      },
      body: JSON.stringify(productPayload),
    });

    if (!productResponse.ok) {
      const errorBody = await productResponse.text();
      console.error('PayPal Product Creation Error:', errorBody);
      return new Response(JSON.stringify({ 
        error: 'Failed to create PayPal product',
        details: errorBody 
      }), {
        status: productResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const product = await productResponse.json();

    // Step 2: Create Plan
    const planPayload = {
      product_id: product.id,
      name: planName,
      description: planDescription || `Subscription plan for ${planName}`,
      billing_cycles: [
        {
          frequency: {
            interval_unit: 'MONTH',
            interval_count: 1
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // 0 means infinite
          pricing_scheme: {
            fixed_price: {
              value: price.toString(),
              currency_code: currency
            }
          }
        }
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: '0',
          currency_code: currency
        },
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3
      },
      taxes: {
        percentage: '0',
        inclusive: false
      }
    };

    const planResponse = await fetch(`${paypalApiUrl}/v1/billing/plans`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'PayPal-Request-Id': `plan-${Date.now()}`,
      },
      body: JSON.stringify(planPayload),
    });

    if (!planResponse.ok) {
      const errorBody = await planResponse.text();
      console.error('PayPal Plan Creation Error:', errorBody);
      return new Response(JSON.stringify({ 
        error: 'Failed to create PayPal plan',
        details: errorBody 
      }), {
        status: planResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const plan = await planResponse.json();

    return new Response(JSON.stringify({ 
      success: true,
      product,
      plan
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in create-paypal-product-plan:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 