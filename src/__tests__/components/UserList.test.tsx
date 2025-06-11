import { render, screen, fireEvent } from '@testing-library/react';
import { UserList } from '@/components/admin/UserList';
import '@testing-library/jest-dom';
import type { Profile } from '@/types';

describe('UserList', () => {
  const mockUsers: Profile[] = [
    {
      id: 'user1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'guardian' as const,
      status: 'active',
      created_at: '2025-01-01T00:00:00Z'
    },
    {
      id: 'user2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'student' as const,
      status: 'pending',
      created_at: '2025-02-01T00:00:00Z'
    }
  ];
  
  const mockOnSort = jest.fn();
  const mockOnViewProfile = jest.fn();
  const mockOnEditRole = jest.fn();
  const mockOnEditStatus = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders loading state correctly', () => {
    render(
      <UserList
        users={[]}
        isLoading={true}
        sortBy="created_at"
        sortOrder="desc"
        onSort={mockOnSort}
        onViewProfile={mockOnViewProfile}
        onEditRole={mockOnEditRole}
        onEditStatus={mockOnEditStatus}
      />
    );
    
    expect(screen.getByText('Loading users...')).toBeInTheDocument();
  });
  
  it('renders empty state correctly', () => {
    render(
      <UserList
        users={[]}
        isLoading={false}
        sortBy="created_at"
        sortOrder="desc"
        onSort={mockOnSort}
        onViewProfile={mockOnViewProfile}
        onEditRole={mockOnEditRole}
        onEditStatus={mockOnEditStatus}
      />
    );
    
    expect(screen.getByText('No users found')).toBeInTheDocument();
  });
  
  it('renders user list correctly', () => {
    render(
      <UserList
        users={mockUsers}
        isLoading={false}
        sortBy="created_at"
        sortOrder="desc"
        onSort={mockOnSort}
        onViewProfile={mockOnViewProfile}
        onEditRole={mockOnEditRole}
        onEditStatus={mockOnEditStatus}
      />
    );
    
    // Check if users are rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('guardian')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('student')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });
  
  it('calls onSort when column header is clicked', () => {
    render(
      <UserList
        users={mockUsers}
        isLoading={false}
        sortBy="created_at"
        sortOrder="desc"
        onSort={mockOnSort}
        onViewProfile={mockOnViewProfile}
        onEditRole={mockOnEditRole}
        onEditStatus={mockOnEditStatus}
      />
    );
    
    // Click on name column header
    fireEvent.click(screen.getByText('Name'));
    
    // Check if onSort was called with correct parameter
    expect(mockOnSort).toHaveBeenCalledWith('name');
  });
  
  it('displays sort indicators correctly', () => {
    render(
      <UserList
        users={mockUsers}
        isLoading={false}
        sortBy="name"
        sortOrder="asc"
        onSort={mockOnSort}
        onViewProfile={mockOnViewProfile}
        onEditRole={mockOnEditRole}
        onEditStatus={mockOnEditStatus}
      />
    );
    
    // Check if sort indicator is displayed for the sorted column
    const nameHeader = screen.getByText('Name').closest('th');
    expect(nameHeader).toHaveTextContent('↑');
    
    // Check if other columns don't have sort indicators
    const emailHeader = screen.getByText('Email').closest('th');
    expect(emailHeader).not.toHaveTextContent('↑');
    expect(emailHeader).not.toHaveTextContent('↓');
  });
  
  it('calls action handlers when buttons are clicked', () => {
    render(
      <UserList
        users={mockUsers}
        isLoading={false}
        sortBy="created_at"
        sortOrder="desc"
        onSort={mockOnSort}
        onViewProfile={mockOnViewProfile}
        onEditRole={mockOnEditRole}
        onEditStatus={mockOnEditStatus}
      />
    );
    
    // Get all action buttons for the first user
    const viewButtons = screen.getAllByTestId('view-profile-button');
    const roleButtons = screen.getAllByTestId('edit-role-button');
    const statusButtons = screen.getAllByTestId('edit-status-button');
    
    // Click on buttons for the first user
    fireEvent.click(viewButtons[0]);
    fireEvent.click(roleButtons[0]);
    fireEvent.click(statusButtons[0]);
    
    // Check if handlers were called with correct user ID
    expect(mockOnViewProfile).toHaveBeenCalledWith('user1');
    expect(mockOnEditRole).toHaveBeenCalledWith('user1', 'guardian');
    expect(mockOnEditStatus).toHaveBeenCalledWith('user1', 'active');
  });
  
  it('formats dates correctly', () => {
    render(
      <UserList
        users={mockUsers}
        isLoading={false}
        sortBy="created_at"
        sortOrder="desc"
        onSort={mockOnSort}
        onViewProfile={mockOnViewProfile}
        onEditRole={mockOnEditRole}
        onEditStatus={mockOnEditStatus}
      />
    );
    
    // Check if dates are formatted correctly
    // Note: The exact format might depend on the implementation
    expect(screen.getByText(/Jan 1, 2025/)).toBeInTheDocument();
    expect(screen.getByText(/Feb 1, 2025/)).toBeInTheDocument();
  });
  
  it('displays status with correct styling', () => {
    render(
      <UserList
        users={mockUsers}
        isLoading={false}
        sortBy="created_at"
        sortOrder="desc"
        onSort={mockOnSort}
        onViewProfile={mockOnViewProfile}
        onEditRole={mockOnEditRole}
        onEditStatus={mockOnEditStatus}
      />
    );
    
    // Get status badges
    const activeStatus = screen.getByText('active').closest('span');
    const pendingStatus = screen.getByText('pending').closest('span');
    
    // Check if they have different styling classes
    expect(activeStatus).toHaveClass('bg-green-100');
    expect(pendingStatus).toHaveClass('bg-yellow-100');
  });
});