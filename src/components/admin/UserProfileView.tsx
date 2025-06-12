import { useState, useEffect, useCallback } from 'react';
import type { ComponentProps, Profile, UserActivity } from '@/types';
import { format } from 'date-fns';
import { X, Calendar, Clock, User, Mail, Tag, Activity, Filter } from 'lucide-react';

interface UserProfileViewProps extends ComponentProps {
  isOpen: boolean;
  userId: string;
  onClose: () => void;
  getUserActivity: (userId: string, options?: {
    activityType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) => Promise<{
    activities: UserActivity[];
    activityTypes: string[];
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
  }>;
  getUserProfile: (userId: string) => Promise<Profile>;
}

export function UserProfileView({
  isOpen,
  userId,
  onClose,
  getUserActivity,
  getUserProfile,
  className
}: UserProfileViewProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUserProfile = useCallback(async () => {
    try {
      const profileData = await getUserProfile(userId);
      setProfile(profileData);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile');
    }
  }, [userId, getUserProfile]);

  const fetchUserActivity = useCallback(async () => {
    setIsLoading(true);
    try {
      const options: {
        activityType?: string;
        page: number;
        pageSize: number;
      } = {
        page: currentPage,
        pageSize: 10
      };

      if (activityFilter) {
        options.activityType = activityFilter;
      }

      const result = await getUserActivity(userId, options);
      setActivities(result.activities);
      setActivityTypes(result.activityTypes);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching user activity:', err);
      setError('Failed to load user activity');
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentPage, activityFilter, getUserActivity]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProfile();
      fetchUserActivity();
    }
  }, [isOpen, userId, fetchUserProfile, fetchUserActivity]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPpp'); // Format like: Apr 28, 2025, 4:52:00 PM
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActivityFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full ${className || ''}`}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">User Profile</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={onClose}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* User Profile Section */}
              <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg">
                {profile ? (
                  <div>
                    <div className="flex items-center justify-center mb-4">
                      <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-10 w-10 text-blue-600" />
                      </div>
                    </div>
                    <h4 className="text-xl font-medium text-center mb-4">{profile.name || 'No Name'}</h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-gray-700">{profile.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Tag className="h-5 w-5 text-gray-400 mr-2" />
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          profile.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          profile.role === 'guardian' ? 'bg-blue-100 text-blue-800' :
                          'bg-teal-100 text-teal-800'
                        }`}>
                          {profile.role}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-5 w-5 text-gray-400 mr-2 flex items-center justify-center">
                          <div className={`h-3 w-3 rounded-full ${
                            profile.status === 'active' ? 'bg-green-500' :
                            profile.status === 'suspended' ? 'bg-red-500' :
                            profile.status === 'pending' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }`}></div>
                        </div>
                        <span className="text-gray-700 capitalize">{profile.status}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-gray-700">Joined {formatDate(profile.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" role="status"></div>
                  </div>
                )}
              </div>

              {/* User Activity Section */}
              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium">Activity Log</h4>
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 text-gray-400 mr-2" />
                    <select
                      value={activityFilter}
                      onChange={handleFilterChange}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="">All Activities</option>
                      {activityTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" role="status"></div>
                  </div>
                ) : activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-start">
                          <Activity className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                          <div>
                            <p className="text-gray-700">{activity.description}</p>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{formatDate(activity.created_at)}</span>
                              {activity.actor && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span>By {activity.actor.name || activity.actor.email}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-center mt-6">
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <span className="sr-only">Previous</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === page
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                          
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <span className="sr-only">Next</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p>No activity records found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}