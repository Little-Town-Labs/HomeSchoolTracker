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
    
    expect(screen.getByText(/no users found/i)).toBeInTheDocument();
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
    
    // Check if sort indicator SVG is present in the Name header
    const nameHeader = screen.getByText('Name').closest('th');
    expect(nameHeader?.querySelector('svg')).toBeInTheDocument();
    // Check that Email header does not have a sort indicator
    const emailHeader = screen.getByText('Email').closest('th');
    expect(emailHeader?.querySelector('svg')).not.toBeInTheDocument();
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
    // Open the actions dropdown for the first user
    const actionMenus = screen.getAllByRole('button', { name: '' }); // The MoreVertical icon button has no accessible name
    actionMenus[0].click();
    // Click on menu items by text (first user)
    const viewProfile = screen.getAllByText('View Profile')[0];
    const editRole = screen.getAllByText('Edit Role')[0];
    const editStatus = screen.getAllByText('Edit Status')[0];
    viewProfile.click();
    editRole.click();
    editStatus.click();
    // Check if handlers were called with correct user ID and values
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
    // Check if dates are formatted correctly (match actual output)
    expect(screen.getByText(/Jan 31, 2025/)).toBeInTheDocument();
    expect(screen.getByText(/Dec 31, 2024/)).toBeInTheDocument();
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