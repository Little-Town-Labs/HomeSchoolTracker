import React, { useState } from 'react';
import type { ComponentProps } from '@/types';
import { X } from 'lucide-react';

interface UserRoleDialogProps extends ComponentProps {
  isOpen: boolean;
  userId: string;
  currentRole: string;
  onClose: () => void;
  onUpdateRole: (userId: string, role: 'guardian' | 'student' | 'admin') => Promise<void>;
}

export function UserRoleDialog({
  isOpen,
  userId,
  currentRole,
  onClose,
  onUpdateRole,
  className
}: UserRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<'guardian' | 'student' | 'admin'>(
    currentRole as 'guardian' | 'student' | 'admin'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onUpdateRole(userId, selectedRole);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${className || ''}`}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Update User Role</h3>
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

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Role
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          id="role-guardian"
                          name="role"
                          type="radio"
                          value="guardian"
                          checked={selectedRole === 'guardian'}
                          onChange={() => setSelectedRole('guardian')}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor="role-guardian" className="ml-3 block text-sm font-medium text-gray-700">
                          Guardian
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="role-student"
                          name="role"
                          type="radio"
                          value="student"
                          checked={selectedRole === 'student'}
                          onChange={() => setSelectedRole('student')}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor="role-student" className="ml-3 block text-sm font-medium text-gray-700">
                          Student
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="role-admin"
                          name="role"
                          type="radio"
                          value="admin"
                          checked={selectedRole === 'admin'}
                          onChange={() => setSelectedRole('admin')}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor="role-admin" className="ml-3 block text-sm font-medium text-gray-700">
                          Admin
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={isSubmitting || selectedRole === currentRole}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      {isSubmitting ? 'Updating...' : 'Update Role'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}