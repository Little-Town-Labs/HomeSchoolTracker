import { useState, useEffect, useCallback } from "react";
import { makeAuthenticatedRequest } from "@/lib/auth";
import { Profile, UserActivity } from "@/types";

interface UserManagementFilters {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
}

interface UserManagementSort {
  sortBy: string;
  sortOrder: "asc" | "desc";
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
  updateUserRole: (
    userId: string,
    role: "guardian" | "student" | "admin",
  ) => Promise<void>;
  updateUserStatus: (
    userId: string,
    status: "active" | "suspended" | "pending" | "deactivated",
    reason?: string,
  ) => Promise<void>;
  getUserActivity: (
    userId: string,
    options?: {
      activityType?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      pageSize?: number;
    },
  ) => Promise<{
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
    totalPages: 0,
  });
  const [sorting, setSorting] = useState<UserManagementSort>({
    sortBy: "created_at",
    sortOrder: "desc",
  });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, string> = {};

      // Add filters
      if (filters.name) params.name = filters.name;
      if (filters.email) params.email = filters.email;
      if (filters.role) params.role = filters.role;
      if (filters.status) params.status = filters.status;

      // Add pagination
      params.page = pagination.page.toString();
      params.pageSize = pagination.pageSize.toString();

      // Add sorting
      params.sortBy = sorting.sortBy;
      params.sortOrder = sorting.sortOrder;

      const data = await makeAuthenticatedRequest("admin-get-users", {
        method: "GET",
        params,
      });

      setUsers(data.users || []);
      setPagination((prev) => ({
        ...prev,
        totalCount: data.pagination.totalCount,
        totalPages: data.pagination.totalPages,
      }));
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch users"));
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

  const updateUserRole = useCallback(
    async (userId: string, role: "guardian" | "student" | "admin") => {
      try {
        const data = await makeAuthenticatedRequest("admin-update-user-role", {
          method: "POST",
          body: { userId, role },
        });

        // Refresh the user list to show the updated role
        await refreshUsers();

        return data;
      } catch (err) {
        console.error("Error updating user role:", err);
        throw err instanceof Error
          ? err
          : new Error("Failed to update user role");
      }
    },
    [refreshUsers],
  );

  const updateUserStatus = useCallback(
    async (
      userId: string,
      status: "active" | "suspended" | "pending" | "deactivated",
      reason?: string,
    ) => {
      try {
        const data = await makeAuthenticatedRequest(
          "admin-update-user-status",
          {
            method: "POST",
            body: { userId, status, reason },
          },
        );

        // Refresh the user list to show the updated status
        await refreshUsers();

        return data;
      } catch (err) {
        console.error("Error updating user status:", err);
        throw err instanceof Error
          ? err
          : new Error("Failed to update user status");
      }
    },
    [refreshUsers],
  );

  const getUserActivity = useCallback(
    async (
      userId: string,
      options?: {
        activityType?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        pageSize?: number;
      },
    ) => {
      try {
        const params: Record<string, string> = {
          userId,
        };

        if (options?.activityType) params.activityType = options.activityType;
        if (options?.startDate) params.startDate = options.startDate;
        if (options?.endDate) params.endDate = options.endDate;
        params.page = options?.page?.toString() || "1";
        params.pageSize = options?.pageSize?.toString() || "20";

        const data = await makeAuthenticatedRequest("admin-get-user-activity", {
          method: "GET",
          params,
        });

        return {
          activities: data.activities || [],
          activityTypes: data.activityTypes || [],
          pagination: data.pagination || {
            page: 1,
            pageSize: 20,
            totalCount: 0,
            totalPages: 0,
          },
        };
      } catch (err) {
        console.error("Error fetching user activity:", err);
        throw err instanceof Error
          ? err
          : new Error("Failed to fetch user activity");
      }
    },
    [],
  );

  return {
    users,
    isLoading,
    error,
    filters,
    pagination,
    sorting,
    setFilters,
    setPagination: (paginationUpdate: Partial<UserManagementPagination>) => {
      setPagination((prev) => ({
        ...prev,
        ...paginationUpdate,
      }));
    },
    setSorting,
    refreshUsers,
    updateUserRole,
    updateUserStatus,
    getUserActivity,
  };
}
