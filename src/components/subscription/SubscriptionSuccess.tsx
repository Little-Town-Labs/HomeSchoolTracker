import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SubscriptionData {
  status?: string;
  plan_id?: string;
  billing_info?: {
    next_billing_time?: string;
  };
}

export function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    const verifySubscription = async () => {
      try {
        // Get subscription ID from URL parameters
        const subscriptionId = searchParams.get('subscription_id');

        if (!subscriptionId) {
          throw new Error('No subscription ID found in URL');
        }

        // Verify the subscription with our backend
        const { data, error } = await supabase.functions.invoke(
          'get-paypal-subscription-details',
          {
            body: { subscriptionId }
          }
        );

        if (error) {
          throw new Error(`Failed to verify subscription: ${error.message}`);
        }

        setSubscriptionData(data);
        console.log('Subscription verified successfully:', data);

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to verify subscription';
        console.error('Error verifying subscription:', err);
        setVerificationError(errorMessage);
      } finally {
        setIsVerifying(false);
      }
    };

    verifySubscription();
  }, [searchParams]);

  const handleContinue = () => {
    navigate('/');
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verifying Your Subscription
              </h2>
              <p className="text-gray-600">
                Please wait while we confirm your subscription details...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (verificationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Failed
              </h2>
              <p className="text-gray-600 mb-6">
                {verificationError}
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleContinue}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Continue to Dashboard
                </button>
                <button
                  onClick={() => navigate('/subscribe')}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to Plans
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Subscription Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for subscribing to HomeSchoolTracker. Your subscription is now active and you have full access to all features.
            </p>
            
            {subscriptionData && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-medium text-gray-900 mb-2">Subscription Details:</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Status:</span> {subscriptionData.status}</p>
                  <p><span className="font-medium">Plan:</span> {subscriptionData.plan_id}</p>
                  {subscriptionData.billing_info?.next_billing_time && (
                    <p><span className="font-medium">Next Billing:</span> {new Date(subscriptionData.billing_info.next_billing_time).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleContinue}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 