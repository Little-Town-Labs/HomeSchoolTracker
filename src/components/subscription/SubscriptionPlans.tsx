import React, { useState, useEffect } from 'react';
import { SubscribeButton } from './SubscribeButton';
import { CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  description?: string;
  paypal_plan_id: string;
  features?: string[];
}

interface Props {
  className?: string;
}

export function SubscriptionPlans({ className }: Props) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .order('price', { ascending: true });

        if (error) throw error;

        // Add default features if not stored in database
        const plansWithFeatures = data?.map(plan => ({
          ...plan,
          features: plan.features || getDefaultFeatures(plan.name)
        })) || [];

        setPlans(plansWithFeatures);
      } catch (err) {
        console.error('Error fetching subscription plans:', err);
        setError('Failed to load subscription plans');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const getDefaultFeatures = (planName: string): string[] => {
    // Default features based on plan name
    if (planName.toLowerCase().includes('basic')) {
      return [
        'Track up to 2 students',
        'Standard course catalog access',
        'Generate unlimited transcripts',
        'Email support',
      ];
    } else if (planName.toLowerCase().includes('premium')) {
      return [
        'Track unlimited students',
        'Advanced course catalog features',
        'Priority email support',
        'Early access to new features',
      ];
    }
    return ['Basic features included'];
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className || ''}`}>
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white">
          Choose Your Plan
        </h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className || ''}`}>
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white">
          Choose Your Plan
        </h2>
        <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className={`space-y-6 ${className || ''}`}>
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white">
          Choose Your Plan
        </h2>
        <div className="text-center text-gray-600 p-4 bg-gray-50 rounded-lg">
          No subscription plans available at this time.
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white">
        Choose Your Plan
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <div key={plan.id} className="flex flex-col border rounded-lg shadow-sm overflow-hidden bg-white dark:bg-gray-800">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
              <div className="text-gray-600 dark:text-gray-400">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(plan.price, plan.currency)}
                </span>
                <span className="text-sm text-muted-foreground"> / month</span>
              </div>
              {plan.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {plan.description}
                </p>
              )}
            </div>
            <div className="p-6 pt-0 flex-grow">
              <ul className="space-y-2">
                {(plan.features || []).map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 pt-4 bg-gray-50 dark:bg-gray-700">
              <SubscribeButton 
                paypalPlanId={plan.paypal_plan_id} 
                showConfigDetails={true}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}