import type { ComponentProps } from '@/types';
import { AlertCircle } from 'lucide-react';

export function Analytics({ className }: ComponentProps) {
  return (
    <div className={`space-y-6 ${className || ''}`}>
      <h2 className="text-2xl font-semibold text-gray-800">Analytics Dashboard</h2>
      <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative flex items-center" role="alert">
        <AlertCircle className="w-5 h-5 mr-2" />
        <span className="block sm:inline">Analytics features coming soon!</span>
      </div>
    </div>
  );
}