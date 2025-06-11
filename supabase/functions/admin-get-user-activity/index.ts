import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

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
      userId: url.searchParams.get('userId') || undefined,
      activityType: url.searchParams.get('activityType') || undefined,
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      page: parseInt(url.searchParams.get('page') || '1'),
      pageSize: parseInt(url.searchParams.get('pageSize') || '20'),
      sortBy: url.searchParams.get('sortBy') || 'created_at',
      sortOrder: (url.searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc')
    };

    // Build query
    let query = supabaseClient
      .from('user_activity')
      .select(`
        id,
        user_id,
        actor_id,
        activity_type,
        description,
        metadata,
        created_at,
        user:user_id (id, email, name),
        actor:actor_id (id, email, name)
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

    // Apply pagination
    const from = (queryParams.page - 1) * queryParams.pageSize;
    const to = from + queryParams.pageSize - 1;
    
    // Apply sorting
    query = query.order(queryParams.sortBy, { 
      ascending: queryParams.sortOrder === 'asc'
    });

    // Execute query with pagination
    const { data: activities, error: activitiesError, count } = await query
      .range(from, to);

    if (activitiesError) {
      throw activitiesError;
    }

    // Get distinct activity types for filtering options
    const { data: activityTypes, error: typesError } = await supabaseClient
      .from('user_activity')
      .select('activity_type')
      .limit(100) // Reasonable limit for activity types
      .then(result => {
        if (result.error) throw result.error;
        // Extract unique activity types
        const types = new Set(result.data.map(item => item.activity_type));
        return { data: Array.from(types), error: null };
      });

    if (typesError) {
      throw typesError;
    }

    // Return paginated results with metadata
    return new Response(JSON.stringify({
      activities,
      activityTypes,
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
    console.error('Error in admin-get-user-activity:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});