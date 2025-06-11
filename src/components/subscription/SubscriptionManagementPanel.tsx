import React, { useState } from 'react';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { ComponentProps } from '@/types';

type Props = ComponentProps;

export function SubscriptionManagementPanel({ className }: Props) {
  // 1. Hooks
  const { subscription, isLoading, error } = useUserSubscription();

  // 2. Derived state
  const containerClasses = `border rounded-lg p-6 shadow-sm bg-white dark:bg-gray-800 ${className || ''}`;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return 'Invalid Date';
    }
  };

  // 3. Effects

  // 4. Event handlers
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancelSubscription = async () => {
    setIsCancelModalOpen(true);
  };

  const confirmCancelSubscription = async () => {
    if (!subscription) return;
    
    setIsCancelling(true);
    setCancelError(null);
    
    try {
      // Call Supabase Edge Function to cancel subscription
      const { error: functionError } = await supabase.functions.invoke('cancel-paypal-subscription', {
        body: {
          subscription_id: subscription.id,
          paypal_subscription_id: subscription.paypal_subscription_id
        }
      });

      if (functionError) {
        throw functionError;
      }
      
      // Refetch subscription data
      if (refetch) {
        await refetch();
      }
      
      setIsCancelModalOpen(false);
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setCancelError('Failed to cancel subscription. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  // 5. Render
  if (isLoading) {
    return (
      <div className={`${containerClasses} flex items-center justify-center min-h-[150px]`}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading subscription details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${containerClasses} text-red-600 flex items-center`}>
        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
        {/* Cast error to unknown before instanceof check for type safety */}
        <span>Error loading subscription details: {(error as unknown) instanceof Error ? (error as Error).message : 'An unknown error occurred'}</span>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className={containerClasses}>
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Subscription Status</h3>
        <p className="text-gray-600 dark:text-gray-400">You do not have an active subscription.</p>
        {/* Optionally link to the plans page - Requires React Router's Link */}
        {/* <Link to="/plans" className="mt-4 text-blue-600 hover:underline">View Plans</Link> */}
      </div>
    );
  }

  // Display subscription details
  return (
    <div className={containerClasses}>
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Subscription Management</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Status:</span>
          <span className={`font-medium px-2 py-0.5 rounded text-sm ${
            subscription.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
            subscription.status === 'trialing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
            subscription.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}>
            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
            {subscription.cancel_at_period_end && ' (Cancels Soon)'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Plan:</span>
          <span className="font-medium text-gray-900 dark:text-white">{subscription.plan_name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Current Period:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
          </span>
        </div>
        {subscription.cancel_at_period_end && (
           <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
             Your subscription will cancel at the end of the current period ({formatDate(subscription.current_period_end)}) and will not renew.
           </p>
        )}
      </div>

      {!subscription.cancel_at_period_end && subscription.status === 'active' && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-md font-semibold mb-2 text-gray-800 dark:text-white">Manage Subscription</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Need to cancel? You can cancel your subscription here. It will remain active until the end of the current billing period.
          </p>
          {/* Standard HTML button styled with Tailwind */}
          <button
            onClick={handleCancelSubscription}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Cancel Subscription
          </button>
        </div>
      )}
    </div>
  );

  // Render cancel modal if open
  return (
    <>
      <div className={containerClasses}>
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Subscription Management</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Status:</span>
            <span className={`font-medium px-2 py-0.5 rounded text-sm ${
              subscription?.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              subscription?.status === 'trialing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              subscription?.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}>
              {subscription?.status ? (subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)) : 'None'}
              {subscription?.cancel_at_period_end && ' (Cancels Soon)'}
            </span>
          </div>
          {subscription && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                <span className="font-medium text-gray-900 dark:text-white">{subscription.plan_id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Current Period:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatDate(subscription.start_date)} - {formatDate(subscription.end_date || '')}
                </span>
              </div>
              {subscription.cancel_at_period_end && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                  Your subscription will cancel at the end of the current period ({formatDate(subscription.end_date || '')}) and will not renew.
                </p>
              )}
            </>
          )}
        </div>

        {subscription && !subscription.cancel_at_period_end && subscription.status === 'active' && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-md font-semibold mb-2 text-gray-800 dark:text-white">Manage Subscription</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Need to cancel? You can cancel your subscription here. It will remain active until the end of the current billing period.
            </p>
            <button
              onClick={handleCancelSubscription}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Cancel Subscription
            </button>
          </div>
        )}
      </div>

      {isCancelModalOpen && subscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Cancel Subscription</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Are you sure you want to cancel your subscription?
              It will remain active until {formatDate(subscription.end_date || '')}.
            </p>
            {cancelError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded dark:bg-red-900 dark:text-red-200">
                {cancelError}
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                disabled={isCancelling}
              >
                Cancel
              </button>
              <button
                onClick={confirmCancelSubscription}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}