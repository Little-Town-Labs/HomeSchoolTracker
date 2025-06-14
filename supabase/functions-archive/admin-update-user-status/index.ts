import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

interface UpdateStatusRequest {
  userId: string;
  status: 'active' | 'suspended' | 'pending' | 'deactivated';
  reason?: string;
}

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

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if the user is authenticated and has admin role
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
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
    const requestData: UpdateStatusRequest = await req.json();
    
    // Validate request data
    if (!requestData.userId || !requestData.status) {
      return new Response(JSON.stringify({ error: 'Missing required fields: userId and status' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Validate status value
    const validStatuses = ['active', 'suspended', 'pending', 'deactivated'];
    if (!validStatuses.includes(requestData.status)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid status. Must be one of: active, suspended, pending, deactivated' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Check if user exists
    const { data: targetUser, error: targetUserError } = await supabaseClient
      .from('profiles')
      .select('id, status, role')
      .eq('id', requestData.userId)
      .single();

    if (targetUserError || !targetUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      });
    }

    // Don't allow changing own status (security measure)
    if (requestData.userId === user.id) {
      return new Response(JSON.stringify({ error: 'Cannot change your own status' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      });
    }

    // Update user status
    const { data: updatedProfile, error: updateError } = await supabaseClient
      .from('profiles')
      .update({ status: requestData.status })
      .eq('id', requestData.userId)
      .select('id, email, role, name, status, created_at')
      .single();

    if (updateError) {
      throw updateError;
    }

    // If status is 'suspended' or 'deactivated', disable auth user
    if (requestData.status === 'suspended' || requestData.status === 'deactivated') {
      await supabaseClient.auth.admin.updateUserById(
        requestData.userId,
        { ban_duration: '87600h' } // 10 years (effectively permanent)
      );
    } 
    // If status is 'active', ensure user is not banned
    else if (requestData.status === 'active') {
      await supabaseClient.auth.admin.updateUserById(
        requestData.userId,
        { ban_duration: '0' } // Remove ban
      );
    }

    // Log the status change with reason if provided
    const metadata = {
      old_status: targetUser.status,
      new_status: requestData.status,
      changed_by: user.id
    };
    
    if (requestData.reason) {
      Object.assign(metadata, { reason: requestData.reason });
    }

    await supabaseClient.rpc('log_user_activity', {
      p_user_id: requestData.userId,
      p_activity_type: 'status_change',
      p_description: `Status changed from ${targetUser.status} to ${requestData.status}`,
      p_metadata: JSON.stringify(metadata)
    });

    return new Response(JSON.stringify({
      message: 'User status updated successfully',
      user: updatedProfile
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: unknown) {
    console.error('Error in admin-update-user-status:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});