import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserSubscription } from '@/types';
import { handleError } from '@/lib/errorHandling';

interface UseAdminSubscriptionsResult {
  subscriptions: UserSubscription[];
  isLoading: boolean;
  error: Error | null;
  updateSubscriptionStatus: (subscriptionId: string, newStatus: UserSubscription['status']) => Promise<boolean>;
  setFreeSubscription: (userId: string) => Promise<boolean>;
}

export function useAdminSubscriptions(): UseAdminSubscriptionsResult {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.functions.invoke('admin-get-user-subscriptions');

        if (error) {
          throw error;
        }

        setSubscriptions(data as UserSubscription[]);
      } catch (err) {
        console.error('Error fetching admin subscriptions:', err);
        setError(err as Error);
        setSubscriptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  const updateSubscriptionStatus = async (
    subscriptionId: string, 
    newStatus: UserSubscription['status']
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString() 
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      // Update local state
      setSubscriptions(prevSubscriptions => 
        prevSubscriptions.map(sub => 
          sub.id === subscriptionId 
            ? { ...sub, status: newStatus, updated_at: new Date().toISOString() } 
            : sub
        )
      );

      return true;
    } catch (err) {
      handleError(err, 'Failed to update subscription status');
      return false;
    }
  };

  const setFreeSubscription = async (userId: string): Promise<boolean> => {
    try {
      // Create a free subscription for the user
      const { error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: 'free_plan', // Assume a free plan exists
          status: 'active',
          start_date: new Date().toISOString(),
          paypal_subscription_id: 'free_subscription'
        });

      if (insertError) throw insertError;

      // Optionally, cancel any existing paid subscriptions
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .neq('status', 'cancelled');

      if (updateError) throw updateError;

      // Refresh subscriptions
      const { data: updatedSubscriptions } = await supabase.functions.invoke('admin-get-user-subscriptions');
      setSubscriptions(updatedSubscriptions as UserSubscription[]);

      return true;
    } catch (err) {
      handleError(err, 'Failed to set free subscription');
      return false;
    }
  };

  return {
    subscriptions,
    isLoading,
    error,
    updateSubscriptionStatus,
    setFreeSubscription,
  };
}