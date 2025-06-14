import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

interface QueryParams {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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

    // Parse query parameters
    const url = new URL(req.url);
    const queryParams: QueryParams = {
      name: url.searchParams.get('name') || undefined,
      email: url.searchParams.get('email') || undefined,
      role: url.searchParams.get('role') || undefined,
      status: url.searchParams.get('status') || undefined,
      page: parseInt(url.searchParams.get('page') || '1'),
      pageSize: parseInt(url.searchParams.get('pageSize') || '20'),
      sortBy: url.searchParams.get('sortBy') || 'created_at',
      sortOrder: (url.searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc')
    };

    // Build query
    let query = supabaseClient
      .from('profiles')
      .select('id, email, role, name, status, created_at', { count: 'exact' });

    // Apply filters
    if (queryParams.email) {
      query = query.ilike('email', `%${queryParams.email}%`);
    }
    
    if (queryParams.name) {
      query = query.ilike('name', `%${queryParams.name}%`);
    }
    
    if (queryParams.role) {
      query = query.eq('role', queryParams.role);
    }
    
    if (queryParams.status) {
      query = query.eq('status', queryParams.status);
    }

    // Apply pagination
    const from = (queryParams.page - 1) * queryParams.pageSize;
    const to = from + queryParams.pageSize - 1;
    
    // Apply sorting
    query = query.order(queryParams.sortBy, { 
      ascending: queryParams.sortOrder === 'asc'
    });

    // Execute query with pagination
    const { data: users, error: usersError, count } = await query
      .range(from, to);

    if (usersError) {
      throw usersError;
    }

    // Return paginated results with metadata
    return new Response(JSON.stringify({
      users,
      pagination: {
        page: queryParams.page,
        pageSize: queryParams.pageSize,
        totalCount: count,
        totalPages: Math.ceil((count || 0) / queryParams.pageSize)
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: unknown) {
    console.error('Error in admin-get-users:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});