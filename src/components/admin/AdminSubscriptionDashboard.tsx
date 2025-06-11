import { useState, useEffect } from 'react';
import { UserSubscriptionList } from './UserSubscriptionList';
import { supabase } from '@/lib/supabase'; // Assuming supabase client is exported from lib
import type { ComponentProps, UserSubscription } from '@/types'; // Import UserSubscription
import { AlertCircle, Loader2 } from 'lucide-react'; // Added Loader2 for loading state

// Removed empty interface AdminSubscriptionDashboardProps

/**
 * Main dashboard component for administrators to view and manage user subscriptions.
 */
export function AdminSubscriptionDashboard({ className }: ComponentProps) { // Use ComponentProps directly, destructure className if needed
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]); // Use UserSubscription type
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscriptions() {
      setIsLoading(true);
      setError(null);
      try {
        // Get current session for authentication
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError) {
          throw authError;
        }
        
        if (!session?.access_token) {
          throw new Error('No authentication token found');
        }
        
        // Call edge function
        const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-get-user-subscriptions`;
        
        const response = await fetch(edgeFunctionUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Transform response to match UserSubscription[] type
        // The edge function returns the array directly
        const transformedSubscriptions = (Array.isArray(result) ? result : []).map((sub: UserSubscription) => ({
          ...sub,
          trial_end_date: sub.trial_end_date || undefined
        }));
        
        setSubscriptions(transformedSubscriptions);
      } catch (err: unknown) { // Use unknown for caught errors
        console.error('Error fetching subscriptions:', err);
        const message = err instanceof Error ? err.message : String(err);
        setError(`Failed to load user subscriptions: ${message}. Ensure you have admin privileges.`);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscriptions();
  }, []);

  return (
    <div className={`space-y-6 ${className || ''}`}> {/* Apply className */}
      <h2 className="text-2xl font-semibold text-gray-800">Subscription Management</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center" role="alert">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Loading subscriptions...</span>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading subscriptions...</p>
          {/* Add a spinner component here if available */}
        </div>
      ) : (
        <UserSubscriptionList subscriptions={subscriptions} />
      )}
    </div>
  );
}