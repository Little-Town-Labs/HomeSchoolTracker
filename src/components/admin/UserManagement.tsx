import { useState } from 'react';
import type { ComponentProps, Profile } from '@/types';
import { useUserManagement } from '@/hooks/useUserManagement';
import { UserSearchFilters } from './UserSearchFilters';
import { UserList } from './UserList';
import { Pagination } from './Pagination';
import { UserRoleDialog } from './UserRoleDialog';
import { UserStatusDialog } from './UserStatusDialog';
import { UserProfileView } from './UserProfileView';
import { AlertCircle } from 'lucide-react';

export function UserManagement({ className }: ComponentProps) {
  const {
    users,
    isLoading,
    error,
    pagination,
    sorting,
    setFilters,
    setPagination,
    setSorting,
    updateUserRole,
    updateUserStatus,
    getUserActivity
  } = useUserManagement();

  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isProfileViewOpen, setIsProfileViewOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; role?: string; status?: string }>({ id: '' });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSearch = (searchFilters: { name?: string; email?: string; role?: string; status?: string }) => {
    setFilters(searchFilters);
    setPagination({ page: 1 }); // Reset to first page on new search
  };

  const handleSort = (sortBy: string) => {
    setSorting({
      sortBy,
      sortOrder: sorting.sortBy === sortBy && sorting.sortOrder === 'asc' ? 'desc' : 'asc'
    });
  };

  const handlePageChange = (page: number) => {
    setPagination({ page });
  };

  const handleViewProfile = (userId: string) => {
    setSelectedUser({ id: userId });
    setIsProfileViewOpen(true);
  };

  const handleEditRole = (userId: string, currentRole: string) => {
    setSelectedUser({ id: userId, role: currentRole });
    setIsRoleDialogOpen(true);
  };

  const handleEditStatus = (userId: string, currentStatus: string) => {
    setSelectedUser({ id: userId, status: currentStatus });
    setIsStatusDialogOpen(true);
  };

  const handleUpdateRole = async (userId: string, role: 'guardian' | 'student' | 'admin') => {
    try {
      await updateUserRole(userId, role);
      setNotification({ type: 'success', message: 'User role updated successfully' });
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      setNotification({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update user role' });
      setTimeout(() => setNotification(null), 5000);
      throw err;
    }
  };

  const handleUpdateStatus = async (userId: string, status: 'active' | 'suspended' | 'pending' | 'deactivated', reason?: string) => {
    try {
      await updateUserStatus(userId, status, reason);
      setNotification({ type: 'success', message: 'User status updated successfully' });
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      setNotification({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update user status' });
      setTimeout(() => setNotification(null), 5000);
      throw err;
    }
  };

  const getUserProfile = async (userId: string): Promise<Profile> => {
    // Find the user in the current list
    const user = users.find(u => u.id === userId);
    if (user) {
      return user;
    }
    
    // If not found (unlikely), throw an error
    throw new Error('User not found');
  };

  return (
    <div className={`space-y-6 ${className || ''}`}>
      <h2 className="text-2xl font-semibold text-gray-800">User Management</h2>
      
      {/* Notification */}
      {notification && (
        <div
          className={`${
            notification.type === 'success' ? 'bg-green-50 border-green-400 text-green-700' : 'bg-red-50 border-red-400 text-red-700'
          } px-4 py-3 rounded relative flex items-center`}
          role="alert"
        >
          <AlertCircle className="w-5 h-5 mr-2" />
          <span className="block sm:inline">{notification.message}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setNotification(null)}
          >
            <span className="sr-only">Close</span>
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center" role="alert">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span className="block sm:inline">{error.message}</span>
        </div>
      )}

      {/* Search and filters */}
      <UserSearchFilters onSearch={handleSearch} isLoading={isLoading} />

      {/* User list */}
      <UserList
        users={users}
        isLoading={isLoading}
        sortBy={sorting.sortBy}
        sortOrder={sorting.sortOrder}
        onSort={handleSort}
        onViewProfile={handleViewProfile}
        onEditRole={handleEditRole}
        onEditStatus={handleEditStatus}
      />

      {/* Pagination */}
      {!isLoading && users.length > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Role dialog */}
      <UserRoleDialog
        isOpen={isRoleDialogOpen}
        userId={selectedUser.id}
        currentRole={selectedUser.role || 'student'}
        onClose={() => setIsRoleDialogOpen(false)}
        onUpdateRole={handleUpdateRole}
      />

      {/* Status dialog */}
      <UserStatusDialog
        isOpen={isStatusDialogOpen}
        userId={selectedUser.id}
        currentStatus={selectedUser.status || 'active'}
        onClose={() => setIsStatusDialogOpen(false)}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* User profile view */}
      <UserProfileView
        isOpen={isProfileViewOpen}
        userId={selectedUser.id}
        onClose={() => setIsProfileViewOpen(false)}
        getUserActivity={getUserActivity}
        getUserProfile={getUserProfile}
      />
    </div>
  );
}