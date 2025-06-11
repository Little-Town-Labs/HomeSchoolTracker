import React from 'react';
import type { ComponentProps, UserSubscription } from '@/types';
import { format } from 'date-fns'; // Using date-fns for date formatting

interface UserSubscriptionListProps extends ComponentProps {
  subscriptions: UserSubscription[];
}

/**
 * Displays a list of user subscriptions in a table format for the admin panel.
 */
export function UserSubscriptionList({ subscriptions, className }: UserSubscriptionListProps) {
  if (!subscriptions || subscriptions.length === 0) {
    return <p className="text-gray-500 text-center py-4">No user subscriptions found.</p>;
  }

  const formatDate = (dateString: string | null | undefined) => {
    return dateString ? format(new Date(dateString), 'PPpp') : 'N/A'; // Format like: Apr 28, 2025, 4:52:00 PM
  };

  return (
    <div className={`overflow-x-auto bg-white shadow rounded-lg ${className || ''}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User ID
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              PayPal ID
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Start Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              End Date
            </th>
             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Trial End
            </th>
             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Plan ID
            </th>
            {/* Add more columns as needed, e.g., Plan Name */}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {subscriptions.map((sub) => (
            <tr key={sub.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.user_id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.paypal_subscription_id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                 <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                   sub.status === 'active' ? 'bg-green-100 text-green-800' :
                   sub.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                   sub.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                   'bg-red-100 text-red-800' // cancelled, expired
                 }`}>
                  {sub.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(sub.start_date)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(sub.end_date)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(sub.trial_end_date)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.plan_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}