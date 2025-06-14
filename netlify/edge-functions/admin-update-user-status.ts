import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

interface UpdateStatusRequest {
  userId: string;
  status: 'active' | 'suspended' | 'pending' | 'deactivated';
  reason?: string;
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

    if (profileError || profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const body: UpdateStatusRequest = await req.json();

    if (!body.userId || !body.status) {
      return new Response(JSON.stringify({ error: 'userId and status are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update user status
    const { data: updatedUser, error: updateError } = await supabaseClient
      .from('profiles')
      .update({ 
        status: body.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.userId)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update user status' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log the activity
    const { error: logError } = await supabaseClient
      .from('user_activity')
      .insert({
        user_id: body.userId,
        activity_type: 'status_update',
        activity_data: {
          new_status: body.status,
          reason: body.reason,
          updated_by: user.id
        }
      });

    if (logError) {
      console.error('Failed to log activity:', logError);
      // Don't fail the request if logging fails
    }

    return new Response(JSON.stringify({
      message: 'User status updated successfully',
      user: updatedUser
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error in admin-update-user-status:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  path: "/api/admin-update-user-status"
}; 