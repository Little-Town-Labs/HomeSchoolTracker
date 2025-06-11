import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProfileView } from '@/components/admin/UserProfileView';
import '@testing-library/jest-dom';
import { format } from 'date-fns';

describe('UserProfileView', () => {
  const mockOnClose = jest.fn();
  const mockGetUserActivity = jest.fn();
  const mockGetUserProfile = jest.fn();
  const userId = 'user123';
  
  const mockProfile = {
    id: userId,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'guardian' as const,
    status: 'active',
    created_at: '2025-01-01T00:00:00Z'
  };
  
  const mockActivities = [
    {
      id: 'activity1',
      user_id: userId,
      actor_id: 'admin1',
      activity_type: 'login',
      description: 'User logged in',
      metadata: {},
      created_at: '2025-01-02T10:00:00Z',
      user: { id: userId, email: 'john@example.com', name: 'John Doe' },
      actor: { id: 'admin1', email: 'admin@example.com', name: 'Admin User' }
    },
    {
      id: 'activity2',
      user_id: userId,
      actor_id: 'admin1',
      activity_type: 'role_change',
      description: 'Role changed from student to guardian',
      metadata: { old_role: 'student', new_role: 'guardian' },
      created_at: '2025-01-03T11:00:00Z',
      user: { id: userId, email: 'john@example.com', name: 'John Doe' },
      actor: { id: 'admin1', email: 'admin@example.com', name: 'Admin User' }
    }
  ];
  
  const mockActivityTypes = ['login', 'role_change', 'status_change'];
  
  const mockPagination = {
    page: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockGetUserProfile.mockResolvedValue(mockProfile);
    mockGetUserActivity.mockResolvedValue({
      activities: mockActivities,
      activityTypes: mockActivityTypes,
      pagination: mockPagination
    });
  });
  
  it('renders correctly when open', async () => {
    render(
      <UserProfileView
        isOpen={true}
        userId={userId}
        onClose={mockOnClose}
        getUserActivity={mockGetUserActivity}
        getUserProfile={mockGetUserProfile}
      />
    );
    
    // Check if profile data is loaded and displayed
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('guardian')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
    });
    
    // Check if activity log is displayed
    expect(screen.getByText('Activity Log')).toBeInTheDocument();
    
    // Check if activities are displayed
    expect(screen.getByText('User logged in')).toBeInTheDocument();
    expect(screen.getByText('Role changed from student to guardian')).toBeInTheDocument();
    
    // Check if close button is rendered
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });
  
  it('does not render when closed', () => {
    render(
      <UserProfileView
        isOpen={false}
        userId={userId}
        onClose={mockOnClose}
        getUserActivity={mockGetUserActivity}
        getUserProfile={mockGetUserProfile}
      />
    );
    
    // Check if component is not rendered
    expect(screen.queryByText('User Profile')).not.toBeInTheDocument();
  });
  
  it('calls onClose when close button is clicked', async () => {
    render(
      <UserProfileView
        isOpen={true}
        userId={userId}
        onClose={mockOnClose}
        getUserActivity={mockGetUserActivity}
        getUserProfile={mockGetUserProfile}
      />
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Click close button
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    
    // Check if onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('shows loading state while fetching data', () => {
    // Setup mock implementations to not resolve immediately
    mockGetUserProfile.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockProfile), 100)));
    mockGetUserActivity.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
      activities: mockActivities,
      activityTypes: mockActivityTypes,
      pagination: mockPagination
    }), 100)));
    
    render(
      <UserProfileView
        isOpen={true}
        userId={userId}
        onClose={mockOnClose}
        getUserActivity={mockGetUserActivity}
        getUserProfile={mockGetUserProfile}
      />
    );
    
    // Check if loading spinners are displayed
    const spinners = screen.getAllByRole('status');
    expect(spinners.length).toBeGreaterThan(0);
  });
  
  it('handles error state', async () => {
    // Setup mock implementations to reject
    mockGetUserProfile.mockRejectedValue(new Error('Failed to load profile'));
    
    render(
      <UserProfileView
        isOpen={true}
        userId={userId}
        onClose={mockOnClose}
        getUserActivity={mockGetUserActivity}
        getUserProfile={mockGetUserProfile}
      />
    );
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/failed to load user profile/i)).toBeInTheDocument();
    });
  });
  
  it('filters activities by type', async () => {
    // Setup mock implementation for activity filtering
    mockGetUserActivity.mockImplementation((id, options) => {
      // Only return activities for the correct user
      if (id !== userId) {
        return Promise.resolve({
          activities: [],
          activityTypes: mockActivityTypes,
          pagination: { ...mockPagination, totalCount: 0 }
        });
      }
      if (options?.activityType === 'login') {
        return Promise.resolve({
          activities: [mockActivities[0]],
          activityTypes: mockActivityTypes,
          pagination: { ...mockPagination, totalCount: 1 }
        });
      }
      return Promise.resolve({
        activities: mockActivities,
        activityTypes: mockActivityTypes,
        pagination: mockPagination
      });
    });
    
    render(
      <UserProfileView
        isOpen={true}
        userId={userId}
        onClose={mockOnClose}
        getUserActivity={mockGetUserActivity}
        getUserProfile={mockGetUserProfile}
      />
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Activity Log')).toBeInTheDocument();
    });
    
    // Select activity type filter
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'login' } });
    
    // Check if getUserActivity was called with correct filter
    await waitFor(() => {
      expect(mockGetUserActivity).toHaveBeenCalledWith(userId, expect.objectContaining({
        activityType: 'login'
      }));
    });
    
    // Check if only login activity is displayed
    await waitFor(() => {
      expect(screen.getByText('User logged in')).toBeInTheDocument();
      expect(screen.queryByText('Role changed from student to guardian')).not.toBeInTheDocument();
    });
  });
  
  it('handles pagination correctly', async () => {
    // Setup mock implementation for pagination
    mockGetUserActivity.mockImplementation((userId, options) => {
      if (options?.page === 2) {
        return Promise.resolve({
          activities: [{
            id: 'activity3',
            user_id: userId,
            actor_id: 'admin1',
            activity_type: 'status_change',
            description: 'Status changed from pending to active',
            metadata: {},
            created_at: '2025-01-04T12:00:00Z',
            user: { id: userId, email: 'john@example.com', name: 'John Doe' },
            actor: { id: 'admin1', email: 'admin@example.com', name: 'Admin User' }
          }],
          activityTypes: mockActivityTypes,
          pagination: { ...mockPagination, page: 2, totalPages: 2 }
        });
      }
      return Promise.resolve({
        activities: mockActivities,
        activityTypes: mockActivityTypes,
        pagination: { ...mockPagination, totalPages: 2 }
      });
    });
    
    render(
      <UserProfileView
        isOpen={true}
        userId={userId}
        onClose={mockOnClose}
        getUserActivity={mockGetUserActivity}
        getUserProfile={mockGetUserProfile}
      />
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Activity Log')).toBeInTheDocument();
    });
    
    // Check if pagination is displayed
    const paginationButtons = screen.getAllByRole('button', { name: /\d+/ });
    expect(paginationButtons.length).toBe(2);
    
    // Click on page 2
    fireEvent.click(paginationButtons[1]);
    
    // Check if getUserActivity was called with correct page
    await waitFor(() => {
      expect(mockGetUserActivity).toHaveBeenCalledWith(userId, expect.objectContaining({
        page: 2
      }));
    });
    
    // Check if page 2 activities are displayed
    await waitFor(() => {
      expect(screen.getByText('Status changed from pending to active')).toBeInTheDocument();
      expect(screen.queryByText('User logged in')).not.toBeInTheDocument();
    });
  });
  
  it('formats dates correctly', async () => {
    render(
      <UserProfileView
        isOpen={true}
        userId={userId}
        onClose={mockOnClose}
        getUserActivity={mockGetUserActivity}
        getUserProfile={mockGetUserProfile}
      />
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Check if dates are formatted correctly
    const formattedJoinDate = format(new Date('2025-01-01T00:00:00Z'), 'PPpp');
    expect(screen.getByText(`Joined ${formattedJoinDate}`)).toBeInTheDocument();
    
    const formattedActivityDate = format(new Date('2025-01-02T10:00:00Z'), 'PPpp');
    expect(screen.getByText(formattedActivityDate)).toBeInTheDocument();
  });
  
  it('shows empty state when no activities', async () => {
    // Setup mock implementation for empty activities
    mockGetUserActivity.mockResolvedValue({
      activities: [],
      activityTypes: [],
      pagination: { ...mockPagination, totalCount: 0 }
    });
    
    render(
      <UserProfileView
        isOpen={true}
        userId={userId}
        onClose={mockOnClose}
        getUserActivity={mockGetUserActivity}
        getUserProfile={mockGetUserProfile}
      />
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Check if empty state message is displayed
    expect(screen.getByText('No activity records found')).toBeInTheDocument();
  });
});