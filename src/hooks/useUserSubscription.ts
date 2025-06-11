import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserSubscription } from '@/types';

interface UseUserSubscriptionResult {
  subscription: UserSubscription | null;
  isLoading: boolean;
  error: Error | null;
  isSubscribed: boolean;
  isTrialing: boolean;
  isCancelled: boolean;
  isExpired: boolean;
}

export function useUserSubscription(): UseUserSubscriptionResult {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setSubscription(null);
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
          throw error;
        }

        setSubscription(data || null);

      } catch (err) {
        console.error('Error fetching user subscription:', err);
        setError(err as Error);
        setSubscription(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();

    // Optional: Set up real-time subscription listener if needed later
    // const subscriptionListener = supabase
    //   .channel('user_subscriptions')
    //   .on('postgres_changes', { event: '*', schema: 'public', table: 'user_subscriptions', filter: `user_id=eq.${supabase.auth.user()?.id}` }, payload => {
    //     console.log('Change received!', payload);
    //     fetchSubscription(); // Re-fetch on change
    //   })
    //   .subscribe();

    // return () => {
    //   subscriptionListener.unsubscribe();
    // };

  }, []);

  const isSubscribed = !!(subscription?.status === 'active');
  const isTrialing = !!(subscription?.status === 'trial' && new Date(subscription.trial_end_date || '') > new Date());
  const isCancelled = !!(subscription?.status === 'cancelled');
  const isExpired = !!(subscription?.status === 'expired' || (subscription?.end_date && new Date(subscription.end_date) < new Date()));


  return {
    subscription,
    isLoading,
    error,
    isSubscribed,
    isTrialing,
    isCancelled,
    isExpired,
  };
}