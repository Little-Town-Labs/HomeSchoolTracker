import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export function SubscriptionCancel() {
  const navigate = useNavigate();

  const handleRetrySubscription = () => {
    navigate('/subscribe');
  };

  const handleContinue = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Subscription Cancelled
            </h2>
            <p className="text-gray-600 mb-6">
              You cancelled the subscription process. No charges have been made to your account.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleRetrySubscription}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
              <button
                onClick={handleContinue}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 