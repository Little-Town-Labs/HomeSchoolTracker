import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AdminSubscriptionDashboard } from '@/components/admin/AdminSubscriptionDashboard';
import { useAdminSubscriptions } from '@/hooks/useAdminSubscriptions';
import { useAuth } from '@/lib/auth';
import { UserSubscription } from '@/types';

// Mock the hooks
vi.mock('@/hooks/useAdminSubscriptions', () => ({
  useAdminSubscriptions: vi.fn()
}));

vi.mock('@/lib/auth', () => ({
  useAuth: vi.fn()
}));

describe('AdminSubscriptionDashboard', () => {
  const mockSubscriptions: UserSubscription[] = [
    {
      id: 'sub1',
      user_id: 'user1',
      plan_id: 'plan1',
      paypal_subscription_id: 'paypal1',
      status: 'active',
      start_date: '2025-01-01T00:00:00Z',
      created_at: '2025-01-01T00:00:00Z'
    },
    {
      id: 'sub2',
      user_id: 'user2',
      plan_id: 'plan2',
      paypal_subscription_id: 'paypal2',
      status: 'cancelled',
      start_date: '2025-02-01T00:00:00Z',
      created_at: '2025-02-01T00:00:00Z'
    }
  ];

  const mockUpdateSubscriptionStatus = vi.fn();
  const mockSetFreeSubscription = vi.fn();

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup default mock implementations
    (useAdminSubscriptions as vi.Mock).mockReturnValue({
      subscriptions: mockSubscriptions,
      isLoading: false,
      error: null,
      updateSubscriptionStatus: mockUpdateSubscriptionStatus,
      setFreeSubscription: mockSetFreeSubscription
    });

    (useAuth as vi.Mock).mockReturnValue({
      user: {
        profile: {
          role: 'admin'
        }
      }
    });
  });

  it('renders subscription list correctly', () => {
    render(<AdminSubscriptionDashboard />);

    // Check if subscriptions are rendered
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('cancelled')).toBeInTheDocument();
  });

  it('allows changing subscription status', async () => {
    mockUpdateSubscriptionStatus.mockResolvedValue(true);

    render(<AdminSubscriptionDashboard />);

    // Find the status select for the first subscription
    const statusSelect = screen.getAllByRole('combobox')[0];
    
    // Change status
    fireEvent.change(statusSelect, { target: { value: 'cancelled' } });

    // Wait for the update function to be called
    await waitFor(() => {
      expect(mockUpdateSubscriptionStatus).toHaveBeenCalledWith('sub1', 'cancelled');
    });
  });

  it('shows set free button for admin', () => {
    render(<AdminSubscriptionDashboard />);

    // Check if Set Free buttons exist
    const setFreeButtons = screen.getAllByText('Set Free');
    expect(setFreeButtons.length).toBeGreaterThan(0);
  });

  it('handles set free subscription', async () => {
    mockSetFreeSubscription.mockResolvedValue(true);

    render(<AdminSubscriptionDashboard />);

    // Find and click Set Free button
    const setFreeButtons = screen.getAllByText('Set Free');
    fireEvent.click(setFreeButtons[0]);

    // Wait for the set free function to be called
    await waitFor(() => {
      expect(mockSetFreeSubscription).toHaveBeenCalledWith('user1');
    });
  });

  it('handles loading state', () => {
    (useAdminSubscriptions as vi.Mock).mockReturnValueOnce({
      subscriptions: [],
      isLoading: true,
      error: null,
      updateSubscriptionStatus: mockUpdateSubscriptionStatus,
      setFreeSubscription: mockSetFreeSubscription
    });

    render(<AdminSubscriptionDashboard />);

    // Check for loading text
    expect(screen.getByText('Loading subscriptions...')).toBeInTheDocument();
  });

  it('handles error state', () => {
    const mockError = new Error('Failed to load subscriptions');
    (useAdminSubscriptions as vi.Mock).mockReturnValueOnce({
      subscriptions: [],
      isLoading: false,
      error: mockError,
      updateSubscriptionStatus: mockUpdateSubscriptionStatus,
      setFreeSubscription: mockSetFreeSubscription
    });

    render(<AdminSubscriptionDashboard />);

    // Check for error message
    expect(screen.getByText(`Error loading subscriptions: ${mockError.message}`)).toBeInTheDocument();
  });
});