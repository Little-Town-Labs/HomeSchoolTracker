import React, { useState } from 'react';
import type { ComponentProps } from '@/types';
import { X, AlertCircle } from 'lucide-react';

interface UserStatusDialogProps extends ComponentProps {
  isOpen: boolean;
  userId: string;
  currentStatus: string;
  onClose: () => void;
  onUpdateStatus: (userId: string, status: 'active' | 'suspended' | 'pending' | 'deactivated', reason?: string) => Promise<void>;
}

export function UserStatusDialog({
  isOpen,
  userId,
  currentStatus,
  onClose,
  onUpdateStatus,
  className
}: UserStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'suspended' | 'pending' | 'deactivated'>(
    currentStatus as 'active' | 'suspended' | 'pending' | 'deactivated'
  );
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onUpdateStatus(userId, selectedStatus, reason || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requiresReason = selectedStatus === 'suspended' || selectedStatus === 'deactivated';

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
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Update User Status</h3>
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
                      Select Status
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          id="status-active"
                          name="status"
                          type="radio"
                          value="active"
                          checked={selectedStatus === 'active'}
                          onChange={() => setSelectedStatus('active')}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor="status-active" className="ml-3 block text-sm font-medium text-gray-700">
                          Active
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="status-pending"
                          name="status"
                          type="radio"
                          value="pending"
                          checked={selectedStatus === 'pending'}
                          onChange={() => setSelectedStatus('pending')}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor="status-pending" className="ml-3 block text-sm font-medium text-gray-700">
                          Pending
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="status-suspended"
                          name="status"
                          type="radio"
                          value="suspended"
                          checked={selectedStatus === 'suspended'}
                          onChange={() => setSelectedStatus('suspended')}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor="status-suspended" className="ml-3 block text-sm font-medium text-gray-700">
                          Suspended
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="status-deactivated"
                          name="status"
                          type="radio"
                          value="deactivated"
                          checked={selectedStatus === 'deactivated'}
                          onChange={() => setSelectedStatus('deactivated')}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor="status-deactivated" className="ml-3 block text-sm font-medium text-gray-700">
                          Deactivated
                        </label>
                      </div>
                    </div>
                  </div>

                  {(selectedStatus === 'suspended' || selectedStatus === 'deactivated') && (
                    <div className="mb-4">
                      <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                        Reason
                      </label>
                      <textarea
                        id="reason"
                        name="reason"
                        rows={3}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                        placeholder="Please provide a reason for this status change"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required={requiresReason}
                      />
                      {requiresReason && (
                        <div className="mt-1 flex items-center text-sm text-yellow-600">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          <span>A reason is required for this status change</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={isSubmitting || selectedStatus === currentStatus || (requiresReason && !reason)}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      {isSubmitting ? 'Updating...' : 'Update Status'}
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