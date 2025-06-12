import React, { useState } from 'react';
import {
  PayPalScriptProvider,
  PayPalButtons,
  ReactPayPalScriptOptions,
  usePayPalScriptReducer,
} from '@paypal/react-paypal-js';
import { supabase } from '@/lib/supabase';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

// Environment variable access
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

interface SubscribeButtonProps {
  paypalPlanId: string;
  className?: string;
  onSubscriptionComplete?: (subscriptionID: string) => void;
  onError?: (err: unknown) => void;
  showConfigDetails?: boolean; // Option to show technical details
}

// Configuration Error Component
function ConfigurationError({ showDetails, onRetry }: { showDetails?: boolean; onRetry?: () => void }) {
  return (
    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-red-800 font-medium mb-2">PayPal Configuration Required</h3>
          <p className="text-red-700 text-sm mb-3">
            The PayPal subscription service is not currently available. This may be a temporary issue.
          </p>
          {showDetails && (
            <details className="mb-3">
              <summary className="text-red-600 text-sm cursor-pointer hover:text-red-800">
                Technical Details
              </summary>
              <div className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded font-mono">
                Missing VITE_PAYPAL_CLIENT_ID environment variable
              </div>
            </details>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded hover:bg-red-200 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading Component
function PayPalLoading() {
  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
      <div className="flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-600">Loading PayPal...</span>
      </div>
    </div>
  );
}

// PayPal Button Wrapper Component
function PayPalButtonWrapper({
  paypalPlanId,
  onSubscriptionComplete,
  onError,
  setError,
  setIsProcessing
}: {
  paypalPlanId: string;
  onSubscriptionComplete?: (subscriptionID: string) => void;
  onError?: (err: unknown) => void;
  setError: (error: string | null) => void;
  setIsProcessing: (processing: boolean) => void;
}) {
  const [{ isResolved, isRejected, isPending }] = usePayPalScriptReducer();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createSubscription = (data: unknown, actions: any): Promise<string> => {
    setIsProcessing(true);
    setError(null);
    return actions.subscription.create({
      plan_id: paypalPlanId,
    });
  };

  const onApprove = async (data: unknown) => {
    setIsProcessing(true);
    setError(null);
    console.log('Subscription approved by user:', data);

    const subscriptionID = (data as { subscriptionID?: string | null })?.subscriptionID;

    if (!subscriptionID) {
      console.error('Subscription ID not found in onApprove data.');
      setError('Subscription confirmation failed: Missing ID.');
      setIsProcessing(false);
      if (onError) onError(new Error('Missing subscriptionID in onApprove'));
      return;
    }

    try {
      const { data: subscriptionData, error: activationError } = await supabase.functions.invoke(
        'get-paypal-subscription-details',
        {
          body: { subscriptionId: subscriptionID }
        }
      );

      if (activationError) {
        throw new Error(`Failed to verify subscription: ${activationError.message}`);
      }

      console.log(`Subscription ${subscriptionID} approved and verified.`, subscriptionData);
      setIsProcessing(false);
      
      if (onSubscriptionComplete) {
        onSubscriptionComplete(subscriptionID);
      }
      
      // Show success message
      setError(null);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to finalize subscription.';
      console.error('Error activating subscription:', err);
      setError(`Subscription verification failed: ${errorMessage}`);
      setIsProcessing(false);
      if (onError) onError(err);
    }
  };

  const onCancel = (data: unknown) => {
    console.log('Subscription cancelled by user:', data);
    setError('Subscription process was cancelled.');
    setIsProcessing(false);
  };

  const catchError = (err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : 'An error occurred with the PayPal service.';
    console.error('PayPal Button Error:', err);
    setError(`PayPal Error: ${errorMessage}`);
    setIsProcessing(false);
    if (onError) onError(err);
  };

  // Show loading while PayPal script is loading
  if (isPending) {
    return <PayPalLoading />;
  }

  // Show error if PayPal script failed to load
  if (isRejected) {
    return (
      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-700">Failed to load PayPal. Please refresh the page and try again.</span>
        </div>
      </div>
    );
  }

  // Show PayPal buttons when script is loaded
  if (isResolved) {
    return (
      <PayPalButtons
        style={{ layout: 'vertical', label: 'subscribe' }}
        createSubscription={createSubscription}
        onApprove={onApprove}
        onError={catchError}
        onCancel={onCancel}
      />
    );
  }

  return <PayPalLoading />;
}

export function SubscribeButton({
  paypalPlanId,
  className,
  onSubscriptionComplete,
  onError,
  showConfigDetails = false,
}: SubscribeButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Handle retry logic
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
  };

  // If no PayPal Client ID, show configuration error
  if (!PAYPAL_CLIENT_ID) {
    return (
      <div className={className}>
        <ConfigurationError 
          showDetails={showConfigDetails} 
          onRetry={handleRetry}
        />
      </div>
    );
  }

  const paypalOptions: ReactPayPalScriptOptions = {
    clientId: PAYPAL_CLIENT_ID,
    intent: 'subscription',
    vault: true,
    components: 'buttons',
    currency: 'USD',
  };

  return (
    <div className={className}>
      {error && (
        <div className="mb-4 p-3 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
      <PayPalScriptProvider options={paypalOptions} key={retryCount}>
        <PayPalButtonWrapper
          paypalPlanId={paypalPlanId}
          onSubscriptionComplete={onSubscriptionComplete}
          onError={onError}
          setError={setError}
          setIsProcessing={setIsProcessing}
        />
      </PayPalScriptProvider>
      
      {isProcessing && (
        <div className="mt-3 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
          <span className="text-sm text-gray-600">Processing subscription...</span>
        </div>
      )}
    </div>
  );
}