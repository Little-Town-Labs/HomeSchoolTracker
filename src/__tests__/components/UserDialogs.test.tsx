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
    
    // Check if radio buttons are rendered and correct one is checked
    const studentRadio = screen.getByRole('radio', { name: /student/i });
    const guardianRadio = screen.getByRole('radio', { name: /guardian/i });
    const adminRadio = screen.getByRole('radio', { name: /admin/i });
    expect(studentRadio).toBeChecked();
    expect(guardianRadio).not.toBeChecked();
    expect(adminRadio).not.toBeChecked();
    
    // Check if buttons are rendered
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update role/i })).toBeInTheDocument();
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
    
    // Change role to guardian
    fireEvent.click(screen.getByRole('radio', { name: /guardian/i }));
    
    // Click update button
    fireEvent.click(screen.getByRole('button', { name: /update role/i }));
    
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
    fireEvent.click(screen.getByRole('button', { name: /update role/i }));
    
    // Check if update button is disabled
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /update role/i })).toBeDisabled();
    });
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
    fireEvent.click(screen.getByRole('button', { name: /update role/i }));
    
    // Check if error message is shown (use a flexible matcher)
    await waitFor(() => {
      expect(screen.getByText(/update failed/i, { exact: false })).toBeInTheDocument();
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
    
    // Check if radio buttons are rendered and correct one is checked
    const activeRadio = screen.getByRole('radio', { name: /active/i });
    const pendingRadio = screen.getByRole('radio', { name: /pending/i });
    const suspendedRadio = screen.getByRole('radio', { name: /suspended/i });
    const deactivatedRadio = screen.getByRole('radio', { name: /deactivated/i });
    expect(activeRadio).toBeChecked();
    expect(pendingRadio).not.toBeChecked();
    expect(suspendedRadio).not.toBeChecked();
    expect(deactivatedRadio).not.toBeChecked();
    
    // Check if buttons are rendered
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update status/i })).toBeInTheDocument();
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
    // Change status to suspended
    fireEvent.click(screen.getByRole('radio', { name: /suspended/i }));
    // Fill in reason field
    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'Testing suspension' } });
    // Click update button
    fireEvent.click(screen.getByRole('button', { name: /update status/i }));
    // Check if onUpdateStatus was called with correct parameters
    await waitFor(() => {
      expect(mockOnUpdateStatus).toHaveBeenCalledWith(userId, 'suspended', 'Testing suspension');
    });
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
    fireEvent.click(screen.getByRole('button', { name: /update status/i }));
    
    // Check if update button is disabled
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /update status/i })).toBeDisabled();
    });
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
    // Change status to suspended
    fireEvent.click(screen.getByRole('radio', { name: /suspended/i }));
    // Fill in reason field
    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'Testing suspension' } });
    // Click update button
    fireEvent.click(screen.getByRole('button', { name: /update status/i }));
    // Check if error message is shown (use a flexible matcher)
    await waitFor(() => {
      expect(screen.getByText(/update failed/i, { exact: false })).toBeInTheDocument();
    });
  });
});