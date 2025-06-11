import React, { useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import type { ComponentProps } from '@/types';
import { supabase } from '@/lib/supabase';

/**
 * Layout component for the admin section.
 * Provides consistent structure (e.g., sidebar, header) for admin pages.
 */
interface AdminLayoutProps extends ComponentProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = React.useState<string | undefined>();

  // Get user email for display
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email);
      }
    };
    getUser();
  }, []);

  // Remove loading state since it's handled by AdminProtectedRoute

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-md z-10">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-blue-600">Admin Panel</h2>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link
                to="subscriptions"
                className={`block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md ${
                  location.pathname === '/admin/subscriptions' ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                Active Subscriptions
              </Link>
            </li>
            <li>
              <Link
                to="plans"
                className={`block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md ${
                  location.pathname === '/admin/plans' ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                Subscription Plans
              </Link>
            </li>
            <li>
              <Link
                to="users"
                className={`block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md ${
                  location.pathname === '/admin/users' ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                User Management
              </Link>
            </li>
            <li>
              <Link
                to="analytics"
                className={`block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md ${
                  location.pathname === '/admin/analytics' ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                Analytics
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="md:ml-64">
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-semibold text-gray-800">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Admin: {email}</span>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Return to Dashboard
              </button>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}