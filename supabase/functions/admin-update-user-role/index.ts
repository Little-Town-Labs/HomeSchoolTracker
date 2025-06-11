import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

interface UpdateRoleRequest {
  userId: string;
  role: 'guardian' | 'student' | 'admin';
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
    const requestData: UpdateRoleRequest = await req.json();
    
    // Validate request data
    if (!requestData.userId || !requestData.role) {
      return new Response(JSON.stringify({ error: 'Missing required fields: userId and role' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Validate role value
    const validRoles = ['guardian', 'student', 'admin'];
    if (!validRoles.includes(requestData.role)) {
      return new Response(JSON.stringify({ error: 'Invalid role. Must be one of: guardian, student, admin' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Check if user exists
    const { data: targetUser, error: targetUserError } = await supabaseClient
      .from('profiles')
      .select('id, role')
      .eq('id', requestData.userId)
      .single();

    if (targetUserError || !targetUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      });
    }

    // Don't allow changing own role (security measure)
    if (requestData.userId === user.id) {
      return new Response(JSON.stringify({ error: 'Cannot change your own role' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      });
    }

    // Update user role
    const { data: updatedProfile, error: updateError } = await supabaseClient
      .from('profiles')
      .update({ role: requestData.role })
      .eq('id', requestData.userId)
      .select('id, email, role, name, status, created_at')
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log the role change
    await supabaseClient.rpc('log_user_activity', {
      p_user_id: requestData.userId,
      p_activity_type: 'role_change',
      p_description: `Role changed from ${targetUser.role} to ${requestData.role}`,
      p_metadata: JSON.stringify({
        old_role: targetUser.role,
        new_role: requestData.role,
        changed_by: user.id
      })
    });

    return new Response(JSON.stringify({
      message: 'User role updated successfully',
      user: updatedProfile
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: unknown) {
    console.error('Error in admin-update-user-role:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});