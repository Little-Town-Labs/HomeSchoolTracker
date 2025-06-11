import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserSearchFilters } from '@/components/admin/UserSearchFilters';
import '@testing-library/jest-dom';

describe('UserSearchFilters', () => {
  const mockOnSearch = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders all filter inputs correctly', () => {
    render(<UserSearchFilters onSearch={mockOnSearch} isLoading={false} />);
    
    // Check if all inputs are rendered
    expect(screen.getByPlaceholderText('Search by name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by email')).toBeInTheDocument();
    
    // Check role dropdown
    const roleSelect = screen.getByLabelText(/role/i);
    expect(roleSelect).toBeInTheDocument();
    
    // Check role options
    const roleOptions = Array.from(roleSelect.querySelectorAll('option'));
    expect(roleOptions.some(option => option.value === '')).toBe(true);
    expect(roleOptions.some(option => option.value === 'admin')).toBe(true);
    expect(roleOptions.some(option => option.value === 'guardian')).toBe(true);
    expect(roleOptions.some(option => option.value === 'student')).toBe(true);
    
    // Check status dropdown
    const statusSelect = screen.getByLabelText(/status/i);
    expect(statusSelect).toBeInTheDocument();
    
    // Check status options
    const statusOptions = Array.from(statusSelect.querySelectorAll('option'));
    expect(statusOptions.some(option => option.value === '')).toBe(true);
    expect(statusOptions.some(option => option.value === 'active')).toBe(true);
    expect(statusOptions.some(option => option.value === 'suspended')).toBe(true);
    expect(statusOptions.some(option => option.value === 'pending')).toBe(true);
    expect(statusOptions.some(option => option.value === 'deactivated')).toBe(true);
    
    // Check search button
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });
  
  it('disables inputs and button when loading', () => {
    render(<UserSearchFilters onSearch={mockOnSearch} isLoading={true} />);
    
    // Check if inputs are disabled
    expect(screen.getByPlaceholderText('Search by name')).toBeDisabled();
    expect(screen.getByPlaceholderText('Search by email')).toBeDisabled();
    expect(screen.getByLabelText(/role/i)).toBeDisabled();
    expect(screen.getByLabelText(/status/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /search/i })).toBeDisabled();
  });
  
  it('calls onSearch with correct filters when search button is clicked', async () => {
    render(<UserSearchFilters onSearch={mockOnSearch} isLoading={false} />);
    
    // Fill in filter values
    fireEvent.change(screen.getByPlaceholderText('Search by name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText('Search by email'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'guardian' } });
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'active' } });
    
    // Click search button
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    
    // Check if onSearch was called with correct filters
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith({
        name: 'John',
        email: 'john@example.com',
        role: 'guardian',
        status: 'active'
      });
    });
  });
  
  it('calls onSearch with empty filters when reset button is clicked', async () => {
    render(<UserSearchFilters onSearch={mockOnSearch} isLoading={false} />);
    
    // Fill in filter values
    fireEvent.change(screen.getByPlaceholderText('Search by name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText('Search by email'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'guardian' } });
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'active' } });
    
    // Click reset button
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    
    // Check if inputs are cleared
    expect(screen.getByPlaceholderText('Search by name')).toHaveValue('');
    expect(screen.getByPlaceholderText('Search by email')).toHaveValue('');
    expect(screen.getByLabelText(/role/i)).toHaveValue('');
    expect(screen.getByLabelText(/status/i)).toHaveValue('');
    
    // Check if onSearch was called with empty filters
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith({
        name: '',
        email: '',
        role: '',
        status: ''
      });
    });
  });
  
  it('submits form when Enter key is pressed', async () => {
    render(<UserSearchFilters onSearch={mockOnSearch} isLoading={false} />);
    
    // Fill in name field
    fireEvent.change(screen.getByPlaceholderText('Search by name'), { target: { value: 'John' } });
    
    // Press Enter key
    fireEvent.keyDown(screen.getByPlaceholderText('Search by name'), { key: 'Enter', code: 'Enter' });
    
    // Check if onSearch was called
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith({
        name: 'John',
        email: '',
        role: '',
        status: ''
      });
    });
  });
});