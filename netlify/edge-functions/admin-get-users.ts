import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

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

export default async (req: Request) => {
  try {
    // Create Supabase client using environment variables
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

    // Parse query parameters
    const url = new URL(req.url);
    const queryParams: QueryParams = {
      name: url.searchParams.get('name') || undefined,
      email: url.searchParams.get('email') || undefined,
      role: url.searchParams.get('role') || undefined,
      status: url.searchParams.get('status') || undefined,
      page: parseInt(url.searchParams.get('page') || '1'),
      pageSize: Math.min(parseInt(url.searchParams.get('pageSize') || '10'), 100),
      sortBy: url.searchParams.get('sortBy') || 'created_at',
      sortOrder: (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    };

    // Build query
    let query = supabaseClient
      .from('profiles')
      .select(`
        id,
        email,
        name,
        role,
        status,
        created_at,
        created_at as updated_at,
        created_at as last_sign_in_at
      `, { count: 'exact' });

    // Apply filters
    if (queryParams.name) {
      query = query.ilike('full_name', `%${queryParams.name}%`);
    }
    if (queryParams.email) {
      query = query.ilike('email', `%${queryParams.email}%`);
    }
    if (queryParams.role) {
      query = query.eq('role', queryParams.role);
    }
    if (queryParams.status) {
      query = query.eq('status', queryParams.status);
    }

    // Apply sorting and pagination
    const from = (queryParams.page - 1) * queryParams.pageSize;
    const to = from + queryParams.pageSize - 1;

    query = query
      .order(queryParams.sortBy, { ascending: queryParams.sortOrder === 'asc' })
      .range(from, to);

    const { data: users, error: queryError, count } = await query;

    if (queryError) {
      console.error('Database query error:', queryError);
      return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const totalPages = Math.ceil((count || 0) / queryParams.pageSize);

    return new Response(JSON.stringify({
      users,
      pagination: {
        page: queryParams.page,
        pageSize: queryParams.pageSize,
        totalCount: count,
        totalPages,
        hasNextPage: queryParams.page < totalPages,
        hasPreviousPage: queryParams.page > 1
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error in admin-get-users:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  path: "/api/admin-get-users"
}; 