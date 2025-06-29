import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

interface QueryParams {
  userId?: string;
  activityType?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default async (req: Request) => {
  try {
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

    // Parse query parameters
    const url = new URL(req.url);
    const queryParams: QueryParams = {
      userId: url.searchParams.get('userId') || undefined,
      activityType: url.searchParams.get('activityType') || undefined,
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      page: parseInt(url.searchParams.get('page') || '1'),
      pageSize: Math.min(parseInt(url.searchParams.get('pageSize') || '20'), 100),
      sortBy: url.searchParams.get('sortBy') || 'created_at',
      sortOrder: (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    };

    // Build query for user activity
    let query = supabaseClient
      .from('user_activity')
      .select(`
        id,
        user_id,
        activity_type,
        activity_data,
        created_at,
        profiles!inner(email, name)
      `, { count: 'exact' });

    // Apply filters
    if (queryParams.userId) {
      query = query.eq('user_id', queryParams.userId);
    }
    if (queryParams.activityType) {
      query = query.eq('activity_type', queryParams.activityType);
    }
    if (queryParams.startDate) {
      query = query.gte('created_at', queryParams.startDate);
    }
    if (queryParams.endDate) {
      query = query.lte('created_at', queryParams.endDate);
    }

    // Apply sorting and pagination
    const from = (queryParams.page - 1) * queryParams.pageSize;
    const to = from + queryParams.pageSize - 1;

    query = query
      .order(queryParams.sortBy, { ascending: queryParams.sortOrder === 'asc' })
      .range(from, to);

    const { data: activities, error: queryError, count } = await query;

    if (queryError) {
      console.error('Database query error:', queryError);
      return new Response(JSON.stringify({ error: 'Failed to fetch user activity' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const totalPages = Math.ceil((count || 0) / queryParams.pageSize);

    return new Response(JSON.stringify({
      activities,
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
    console.error('Unexpected error in admin-get-user-activity:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  path: "/api/admin-get-user-activity"
}; 