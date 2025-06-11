import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserRoleDialog } from '@/components/admin/UserRoleDialog';
import { UserStatusDialog } from '@/components/admin/UserStatusDialog';
import '@testing-library/jest-dom';

describe('UserRoleDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnUpdateRole = jest.fn();
  const userId = 'user123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders correctly when open', () => {
    render(
      <UserRoleDialog
        isOpen={true}
        userId={userId}
        currentRole="student"
        onClose={mockOnClose}
        onUpdateRole={mockOnUpdateRole}
      />
    );
    
    // Check if dialog is rendered
    expect(screen.getByText('Update User Role')).toBeInTheDocument();
    
    // Check if role select is rendered with current role selected
    const roleSelect = screen.getByLabelText(/role/i);
    expect(roleSelect).toBeInTheDocument();
    expect(roleSelect).toHaveValue('student');
    
    // Check if buttons are rendered
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
  });
  
  it('does not render when closed', () => {
    render(
      <UserRoleDialog
        isOpen={false}
        userId={userId}
        currentRole="student"
        onClose={mockOnClose}
        onUpdateRole={mockOnUpdateRole}
      />
    );
    
    // Check if dialog is not rendered
    expect(screen.queryByText('Update User Role')).not.toBeInTheDocument();
  });
  
  it('calls onClose when cancel button is clicked', () => {
    render(
      <UserRoleDialog
        isOpen={true}
        userId={userId}
        currentRole="student"
        onClose={mockOnClose}
        onUpdateRole={mockOnUpdateRole}
      />
    );
    
    // Click cancel button
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    
    // Check if onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('calls onUpdateRole with correct parameters when update button is clicked', async () => {
    render(
      <UserRoleDialog
        isOpen={true}
        userId={userId}
        currentRole="student"
        onClose={mockOnClose}
        onUpdateRole={mockOnUpdateRole}
      />
    );
    
    // Change role
    fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'guardian' } });
    
    // Click update button
    fireEvent.click(screen.getByRole('button', { name: /update/i }));
    
    // Check if onUpdateRole was called with correct parameters
    await waitFor(() => {
      expect(mockOnUpdateRole).toHaveBeenCalledWith(userId, 'guardian');
    });
  });
  
  it('shows loading state when updating', async () => {
    // Mock onUpdateRole to return a promise that doesn't resolve immediately
    const delayedUpdateRole = jest.fn(() => new Promise<void>(resolve => setTimeout(() => resolve(), 100)));
    
    render(
      <UserRoleDialog
        isOpen={true}
        userId={userId}
        currentRole="student"
        onClose={mockOnClose}
        onUpdateRole={delayedUpdateRole}
      />
    );
    
    // Click update button
    fireEvent.click(screen.getByRole('button', { name: /update/i }));
    
    // Check if loading state is shown
    expect(screen.getByRole('button', { name: /updating/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
  });
  
  it('handles errors during update', async () => {
    // Mock onUpdateRole to reject with an error
    const errorUpdateRole = jest.fn(() => Promise.reject(new Error('Update failed')));
    
    render(
      <UserRoleDialog
        isOpen={true}
        userId={userId}
        currentRole="student"
        onClose={mockOnClose}
        onUpdateRole={errorUpdateRole}
      />
    );
    
    // Click update button
    fireEvent.click(screen.getByRole('button', { name: /update/i }));
    
    // Check if error message is shown
    await waitFor(() => {
      expect(screen.getByText(/failed to update role/i)).toBeInTheDocument();
    });
  });
});

describe('UserStatusDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnUpdateStatus = jest.fn();
  const userId = 'user123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders correctly when open', () => {
    render(
      <UserStatusDialog
        isOpen={true}
        userId={userId}
        currentStatus="active"
        onClose={mockOnClose}
        onUpdateStatus={mockOnUpdateStatus}
      />
    );
    
    // Check if dialog is rendered
    expect(screen.getByText('Update User Status')).toBeInTheDocument();
    
    // Check if status select is rendered with current status selected
    const statusSelect = screen.getByLabelText(/status/i);
    expect(statusSelect).toBeInTheDocument();
    expect(statusSelect).toHaveValue('active');
    
    // Check if buttons are rendered
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
  });
  
  it('does not render when closed', () => {
    render(
      <UserStatusDialog
        isOpen={false}
        userId={userId}
        currentStatus="active"
        onClose={mockOnClose}
        onUpdateStatus={mockOnUpdateStatus}
      />
    );
    
    // Check if dialog is not rendered
    expect(screen.queryByText('Update User Status')).not.toBeInTheDocument();
  });
  
  it('calls onClose when cancel button is clicked', () => {
    render(
      <UserStatusDialog
        isOpen={true}
        userId={userId}
        currentStatus="active"
        onClose={mockOnClose}
        onUpdateStatus={mockOnUpdateStatus}
      />
    );
    
    // Click cancel button
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    
    // Check if onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('calls onUpdateStatus with correct parameters when update button is clicked', async () => {
    render(
      <UserStatusDialog
        isOpen={true}
        userId={userId}
        currentStatus="active"
        onClose={mockOnClose}
        onUpdateStatus={mockOnUpdateStatus}
      />
    );
    
    // Change status
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'suspended' } });
    
    // Add reason for suspension
    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'Testing suspension' } });
    
    // Click update button
    fireEvent.click(screen.getByRole('button', { name: /update/i }));
    
    // Check if onUpdateStatus was called with correct parameters
    await waitFor(() => {
      expect(mockOnUpdateStatus).toHaveBeenCalledWith(userId, 'suspended', 'Testing suspension');
    });
  });
  
  it('shows reason field only for suspended and deactivated statuses', async () => {
    render(
      <UserStatusDialog
        isOpen={true}
        userId={userId}
        currentStatus="active"
        onClose={mockOnClose}
        onUpdateStatus={mockOnUpdateStatus}
      />
    );
    
    // Initially, reason field should not be visible
    expect(screen.queryByLabelText(/reason/i)).not.toBeInTheDocument();
    
    // Change status to suspended
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'suspended' } });
    
    // Now reason field should be visible
    expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
    
    // Change status to active
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'active' } });
    
    // Reason field should be hidden again
    expect(screen.queryByLabelText(/reason/i)).not.toBeInTheDocument();
    
    // Change status to deactivated
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'deactivated' } });
    
    // Reason field should be visible again
    expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
  });
  
  it('shows loading state when updating', async () => {
    // Mock onUpdateStatus to return a promise that doesn't resolve immediately
    const delayedUpdateStatus = jest.fn(() => new Promise<void>(resolve => setTimeout(() => resolve(), 100)));
    
    render(
      <UserStatusDialog
        isOpen={true}
        userId={userId}
        currentStatus="active"
        onClose={mockOnClose}
        onUpdateStatus={delayedUpdateStatus}
      />
    );
    
    // Click update button
    fireEvent.click(screen.getByRole('button', { name: /update/i }));
    
    // Check if loading state is shown
    expect(screen.getByRole('button', { name: /updating/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
  });
  
  it('handles errors during update', async () => {
    // Mock onUpdateStatus to reject with an error
    const errorUpdateStatus = jest.fn(() => Promise.reject(new Error('Update failed')));
    
    render(
      <UserStatusDialog
        isOpen={true}
        userId={userId}
        currentStatus="active"
        onClose={mockOnClose}
        onUpdateStatus={errorUpdateStatus}
      />
    );
    
    // Click update button
    fireEvent.click(screen.getByRole('button', { name: /update/i }));
    
    // Check if error message is shown
    await waitFor(() => {
      expect(screen.getByText(/failed to update status/i)).toBeInTheDocument();
    });
  });
});