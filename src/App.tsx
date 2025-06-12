import { useState, useEffect, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { getCurrentUser } from "./lib/auth";
import { Notification } from "./components/Notification";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { supabase } from "./lib/supabase";
import type { User } from "./types";
import { useUserSubscription } from "./hooks/useUserSubscription";

// Lazy load components for better code splitting
const LandingPage = lazy(() => import("./components/LandingPage").then(m => ({ default: m.LandingPage })));
const AuthForm = lazy(() => import("./components/AuthForm").then(m => ({ default: m.AuthForm })));
const Dashboard = lazy(() => import("./components/Dashboard").then(m => ({ default: m.Dashboard })));
const EmailVerification = lazy(() => import("./components/EmailVerification").then(m => ({ default: m.EmailVerification })));
const ForgotPassword = lazy(() => import("./components/ForgotPassword").then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import("./components/ResetPassword").then(m => ({ default: m.ResetPassword })));
const SessionExpired = lazy(() => import("./components/SessionExpired").then(m => ({ default: m.SessionExpired })));
const InvitationAccept = lazy(() => import("./components/InvitationAccept").then(m => ({ default: m.InvitationAccept })));

// Admin components (loaded only when admin routes are accessed)
const AdminLayout = lazy(() => import("./components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminSubscriptionDashboard = lazy(() => import("./components/admin/AdminSubscriptionDashboard").then(m => ({ default: m.AdminSubscriptionDashboard })));
const UserManagement = lazy(() => import("./components/admin/UserManagement").then(m => ({ default: m.UserManagement })));
const Analytics = lazy(() => import("./components/admin/Analytics").then(m => ({ default: m.Analytics })));
const SubscriptionPlanManagement = lazy(() => import("./components/admin/SubscriptionPlanManagement").then(m => ({ default: m.SubscriptionPlanManagement })));

// Subscription components
const SubscriptionPlans = lazy(() => import("./components/subscription/SubscriptionPlans").then(m => ({ default: m.SubscriptionPlans })));

// Loading component for Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Protected route component
function ProtectedRoute({ children, user, requiredRole, requiresSubscription }: { children: JSX.Element; user: User | null; requiredRole?: "guardian" | "student" | "admin"; requiresSubscription?: boolean }) {
  const { isSubscribed, isTrialing, isLoading: isSubscriptionLoading } = useUserSubscription();

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (requiredRole && user.profile.role !== requiredRole) {
    // Redirect to dashboard or show unauthorized message
    return <Navigate to="/" replace />;
  }

  if (requiresSubscription && !isSubscriptionLoading && !isSubscribed && !isTrialing) {
     // Redirect to subscription page or show message
     return <Navigate to="/subscribe" replace />; // Assuming a subscribe route exists
  }


  return children;
}

// Admin Protected Route component
function AdminProtectedRoute({ children, user }: { children: JSX.Element; user: User | null }) {
  const isAdminOrOwner = user?.profile.role === 'admin' || user?.email === import.meta.env.VITE_OWNER_EMAIL;
  
  if (!user || !isAdminOrOwner) {
    return <Navigate to="/" replace />;
  }
  return children;
}


function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await getCurrentUser();
        setUser(user);
      } catch (error) {
        console.error("Error initializing auth:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === "SIGNED_OUT") {
          setUser(null);
        } else if (event === "SIGNED_IN" && session) {
          setIsAuthenticating(true);
          const user = await getCurrentUser();
          setUser(user);
        }
      } catch (error) {
        console.error("Error handling auth state change:", error);
        setUser(null);
      } finally {
        setIsAuthenticating(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Monitor for session expiration
  useEffect(() => {
    if (!user) return;

    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        // Session expired
        supabase.auth.signOut();
        window.location.href = "/session-expired";
      }, SESSION_TIMEOUT);
    };

    // Set up event listeners to reset the timer on user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Initialize the timer
    resetTimer();

    // Clean up
    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user]);

  const handleAuthSuccess = async () => {
    try {
      setIsAuthenticating(true);
      // First update the user state
      const user = await getCurrentUser();
      setUser(user);

      // Then show the notification
      setNotification({
        type: "success",
        message: "Successfully signed in! Welcome back.",
      });
    } catch (error) {
      console.error("Error handling auth success:", error);
      setNotification({
        type: "error",
        message: "There was a problem signing in. Please try again.",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (loading || isAuthenticating) {
    return (
      <ErrorBoundary>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/"
              element={user ? <Dashboard user={user} /> : <LandingPage />}
            />
            <Route path="/auth/callback" element={<EmailVerification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/session-expired" element={<SessionExpired />} />
            <Route
              path="/invite/:token"
              element={<InvitationAccept user={user} />}
            />
             {/* Add a route for subscription plans */}
             <Route path="/subscribe" element={<ProtectedRoute user={user}><SubscriptionPlans /></ProtectedRoute>} />
            <Route
              path="/signin"
              element={
                user ? (
                  <Navigate to="/" replace />
                ) : (
                  <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                    <div className="sm:mx-auto sm:w-full sm:max-w-md">
                      <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                      </h2>
                    </div>
                    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <AuthForm mode="signin" onSuccess={handleAuthSuccess} />
                      </div>
                    </div>
                  </div>
                )
              }
            />
            <Route
              path="/signup"
              element={
                user ? (
                  <Navigate to="/" replace />
                ) : (
                  <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                    <div className="sm:mx-auto sm:w-full sm:max-w-md">
                      <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Create your account
                      </h2>
                    </div>
                    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <AuthForm mode="signup" onSuccess={handleAuthSuccess} />
                      </div>
                    </div>
                  </div>
                )
              }
            />
             {/* Admin Routes */}
             {/* Use AdminProtectedRoute to wrap AdminLayout and its nested routes */}
             <Route path="/admin" element={<AdminProtectedRoute user={user}><AdminLayout><Outlet /></AdminLayout></AdminProtectedRoute>}>
               <Route index element={<AdminSubscriptionDashboard />} />
               <Route path="subscriptions" element={<AdminSubscriptionDashboard />} />
               <Route path="users" element={<UserManagement />} />
               <Route path="analytics" element={<Analytics />} />
               <Route path="plans" element={<SubscriptionPlanManagement />} />
             </Route>
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}
export default App;
