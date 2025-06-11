import { GuardianDashboard } from "./GuardianDashboard";
import { StudentDashboard } from "./StudentDashboard";
import { Link } from "react-router-dom";
import type { User } from "../types";

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  if (!user.profile) {
    return null;
  }

  const isAdminOrOwner = user.profile.role === 'admin' || user.email === import.meta.env.VITE_OWNER_EMAIL;

  // Show admin panel link for admin users
  if (isAdminOrOwner) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <Link
                to="/admin"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Admin Panel
              </Link>
            </div>
            {/* Show guardian dashboard as fallback for admin users */}
            <GuardianDashboard user={user} />
          </div>
        </div>
      </div>
    );
  }

  // Regular user routing
  return user.profile.role === "guardian" ? (
    <GuardianDashboard user={user} />
  ) : (
    <StudentDashboard user={user} />
  );
}
