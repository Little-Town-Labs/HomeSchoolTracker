import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      });
    }

    // Create Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    // Check if the user is authenticated and has admin role
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    // Verify admin role
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      });
    }

    // Parse request body
    const body = await req.json();
    const { userId, exemptStatus } = body;

    // Validate request body
    if (!userId || typeof exemptStatus !== 'boolean') {
      return new Response(JSON.stringify({ 
        error: 'Invalid request body. userId and exemptStatus (boolean) are required.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Update the user's exemption status using the database function
    const { error: exemptionError } = await supabaseClient
      .rpc('update_user_exemption', {
        target_user_id: userId,
        exempt_status: exemptStatus
      });

    if (exemptionError) {
      console.error('Error updating exemption status:', exemptionError);
      return new Response(JSON.stringify({ 
        error: 'Failed to update exemption status',
        details: exemptionError.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    // Get updated user profile to return
    const { data: updatedProfile, error: fetchError } = await supabaseClient
      .from('profiles')
      .select('id, email, name, role, subscription_exempt')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated profile:', fetchError);
      return new Response(JSON.stringify({ 
        error: 'Exemption updated but failed to fetch updated profile' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: `User exemption status updated to: ${exemptStatus}`,
      profile: updatedProfile
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in admin-manage-exemption function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
}); 