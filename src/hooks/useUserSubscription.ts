import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { UserSubscription, Profile } from "@/types";

interface UseUserSubscriptionResult {
  subscription: UserSubscription | null;
  isLoading: boolean;
  error: Error | null;
  isSubscribed: boolean;
  isTrialing: boolean;
  isCancelled: boolean;
  isExpired: boolean;
  isExempt: boolean;
}

export function useUserSubscription(): UseUserSubscriptionResult {
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null,
  );
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSubscriptionAndProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setSubscription(null);
          setProfile(null);
          setIsLoading(false);
          return;
        }

        // Fetch both subscription and profile data
        const [subscriptionResponse, profileResponse] = await Promise.all([
          supabase
            .from("user_subscriptions")
            .select("*")
            .eq("user_id", user.id)
            .single(),
          supabase.from("profiles").select("*").eq("id", user.id).single(),
        ]);

        // Handle subscription data
        if (
          subscriptionResponse.error &&
          subscriptionResponse.error.code !== "PGRST116"
        ) {
          throw subscriptionResponse.error;
        }
        setSubscription(subscriptionResponse.data || null);

        // Handle profile data
        if (profileResponse.error) {
          throw profileResponse.error;
        }
        setProfile(profileResponse.data);
      } catch (err) {
        console.error("Error fetching user subscription and profile:", err);
        setError(err as Error);
        setSubscription(null);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionAndProfile();

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

  // Check if user is exempt from subscription requirements
  const isExempt = !!profile?.subscription_exempt;

  // Enhanced subscription logic that includes exemption
  const isSubscribed = !!(subscription?.status === "active" || isExempt);
  const isTrialing = !!(
    subscription?.status === "trial" &&
    new Date(subscription.trial_end_date || "") > new Date()
  );
  const isCancelled = !!(subscription?.status === "cancelled");
  const isExpired = !!(
    subscription?.status === "expired" ||
    (subscription?.end_date && new Date(subscription.end_date) < new Date())
  );

  return {
    subscription,
    isLoading,
    error,
    isSubscribed,
    isTrialing,
    isCancelled,
    isExpired,
    isExempt,
  };
}
