// Mock env module to avoid import.meta.env issues in Jest
jest.mock('../src/lib/env', () => ({
  VITE_SUPABASE_URL: 'http://localhost:54321',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key'
}));

// Mock supabase client to avoid ESM import issues in Jest
jest.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: { access_token: 'test-token' } }, error: null }))
    }
  }
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { AdminSubscriptionDashboard } from '../src/components/admin/AdminSubscriptionDashboard';

describe('AdminSubscriptionDashboard', () => {
  it('renders loading state', () => {
    render(<AdminSubscriptionDashboard />);
    const loadingEls = screen.getAllByText('Loading subscriptions...');
    expect(loadingEls.length).toBeGreaterThan(0);
  });

  // Additional tests for error and data rendering can be added here if you mock fetch or supabase, but not internal hooks.
});