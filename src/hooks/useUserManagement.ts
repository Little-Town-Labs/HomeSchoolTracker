import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile, UserActivity } from '@/types';

interface UserManagementFilters {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
}

interface UserManagementSort {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface UserManagementPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface UseUserManagementResult {
  users: Profile[];
  isLoading: boolean;
  error: Error | null;
  filters: UserManagementFilters;
  pagination: UserManagementPagination;
  sorting: UserManagementSort;
  setFilters: (filters: UserManagementFilters) => void;
  setPagination: (pagination: Partial<UserManagementPagination>) => void;
  setSorting: (sorting: UserManagementSort) => void;
  refreshUsers: () => Promise<void>;
  updateUserRole: (userId: string, role: 'guardian' | 'student' | 'admin') => Promise<void>;
  updateUserStatus: (userId: string, status: 'active' | 'suspended' | 'pending' | 'deactivated', reason?: string) => Promise<void>;
  getUserActivity: (userId: string, options?: {
    activityType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) => Promise<{
    activities: UserActivity[];
    activityTypes: string[];
    pagination: UserManagementPagination;
  }>;
}

export function useUserManagement(): UseUserManagementResult {
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<UserManagementFilters>({});
  const [pagination, setPagination] = useState<UserManagementPagination>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [sorting, setSorting] = useState<UserManagementSort>({
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters
      if (filters.name) queryParams.append('name', filters.name);
      if (filters.email) queryParams.append('email', filters.email);
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.status) queryParams.append('status', filters.status);
      
      // Add pagination
      queryParams.append('page', pagination.page.toString());
      queryParams.append('pageSize', pagination.pageSize.toString());
      
      // Add sorting
      queryParams.append('sortBy', sorting.sortBy);
      queryParams.append('sortOrder', sorting.sortOrder);
      
      const { data, error: fetchError } = await supabase.functions.invoke('admin-get-users', {
        body: { queryParams: Object.fromEntries(queryParams.entries()) }
      });
      
      if (fetchError) throw new Error(fetchError.message);
      
      setUsers(data.users || []);
      setPagination(prev => ({
        ...prev,
        totalCount: data.pagination.totalCount,
        totalPages: data.pagination.totalPages
      }));
      
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch users'));
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize, sorting]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const refreshUsers = useCallback(async () => {
    await fetchUsers();
  }, [fetchUsers]);

  const updateUserRole = useCallback(async (userId: string, role: 'guardian' | 'student' | 'admin') => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-user-role', {
        body: { userId, role }
      });
      
      if (error) throw new Error(error.message);
      
      // Refresh the user list to show the updated role
      await refreshUsers();
      
      return data;
    } catch (err) {
      console.error('Error updating user role:', err);
      throw err instanceof Error ? err : new Error('Failed to update user role');
    }
  }, [refreshUsers]);

  const updateUserStatus = useCallback(async (
    userId: string, 
    status: 'active' | 'suspended' | 'pending' | 'deactivated',
    reason?: string
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-user-status', {
        body: { userId, status, reason }
      });
      
      if (error) throw new Error(error.message);
      
      // Refresh the user list to show the updated status
      await refreshUsers();
      
      return data;
    } catch (err) {
      console.error('Error updating user status:', err);
      throw err instanceof Error ? err : new Error('Failed to update user status');
    }
  }, [refreshUsers]);

  const getUserActivity = useCallback(async (userId: string, options?: {
    activityType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) => {
    try {
      const queryParams = new URLSearchParams();
      
      queryParams.append('userId', userId);
      if (options?.activityType) queryParams.append('activityType', options.activityType);
      if (options?.startDate) queryParams.append('startDate', options.startDate);
      if (options?.endDate) queryParams.append('endDate', options.endDate);
      queryParams.append('page', options?.page?.toString() || '1');
      queryParams.append('pageSize', options?.pageSize?.toString() || '20');
      
      const { data, error } = await supabase.functions.invoke('admin-get-user-activity', {
        body: { queryParams: Object.fromEntries(queryParams.entries()) }
      });
      
      if (error) throw new Error(error.message);
      
      return {
        activities: data.activities || [],
        activityTypes: data.activityTypes || [],
        pagination: data.pagination || {
          page: 1,
          pageSize: 20,
          totalCount: 0,
          totalPages: 0
        }
      };
    } catch (err) {
      console.error('Error fetching user activity:', err);
      throw err instanceof Error ? err : new Error('Failed to fetch user activity');
    }
  }, []);

  return {
    users,
    isLoading,
    error,
    filters,
    pagination,
    sorting,
    setFilters,
    setPagination: (paginationUpdate: Partial<UserManagementPagination>) => {
      setPagination(prev => ({
        ...prev,
        ...paginationUpdate
      }));
    },
    setSorting,
    refreshUsers,
    updateUserRole,
    updateUserStatus,
    getUserActivity
  };
}