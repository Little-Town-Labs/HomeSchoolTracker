import React, { useState } from 'react';
import type { ComponentProps } from '@/types';
import { Search, Filter, X } from 'lucide-react';

interface UserSearchFiltersProps extends ComponentProps {
  onSearch: (filters: {
    name?: string;
    email?: string;
    role?: string;
    status?: string;
  }) => void;
  isLoading?: boolean;
}

export function UserSearchFilters({ onSearch, isLoading, className }: UserSearchFiltersProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      name: name || undefined,
      email: email || undefined,
      role: role || undefined,
      status: status || undefined
    });
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setRole('');
    setStatus('');
    onSearch({});
  };

  const toggleFilters = () => {
    setIsFiltersVisible(!isFiltersVisible);
  };

  return (
    <div className={`bg-white rounded-lg shadow p-4 mb-6 ${className || ''}`}>
      <form onSubmit={handleSubmit}>
        {/* Search bar */}
        <div className="flex items-center mb-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={toggleFilters}
            className="ml-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="ml-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Advanced filters */}
        {isFiltersVisible && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="text"
                placeholder="Filter by email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="guardian">Guardian</option>
                <option value="student">Student</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}