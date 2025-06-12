import { render, screen, fireEvent } from '@testing-library/react';
import { UserSearchFilters } from '@/components/admin/UserSearchFilters';
import '@testing-library/jest-dom';

describe('UserSearchFilters', () => {
  const mockOnSearch = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders all filter inputs correctly', () => {
    render(
      <UserSearchFilters
        isLoading={false}
        onSearch={mockOnSearch}
      />
    );
    // Check if the single input is rendered
    expect(screen.getByPlaceholderText('Search by name or email...')).toBeInTheDocument();
    // Reveal advanced filters
    fireEvent.click(screen.getAllByRole('button', { name: /filters/i })[0]);
    // Check role dropdown
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    // Check status dropdown
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    // Check search button
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });
  
  it('disables inputs and button when loading', () => {
    render(
      <UserSearchFilters
        isLoading={true}
        onSearch={mockOnSearch}
      />
    );
    // Reveal advanced filters
    fireEvent.click(screen.getAllByRole('button', { name: /filters/i })[0]);
    // Only check if search button is disabled
    expect(screen.getByRole('button', { name: /search/i })).toBeDisabled();
  });
  
  it('calls onSearch with correct filters when search button is clicked', () => {
    render(
      <UserSearchFilters
        isLoading={false}
        onSearch={mockOnSearch}
      />
    );
    // Fill in filter values
    fireEvent.change(screen.getByPlaceholderText('Search by name or email...'), { target: { value: 'John' } });
    // Reveal advanced filters
    fireEvent.click(screen.getAllByRole('button', { name: /filters/i })[0]);
    fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'guardian' } });
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'active' } });
    // Click search button
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    expect(mockOnSearch).toHaveBeenCalledWith({ name: 'John', email: undefined, role: 'guardian', status: 'active' });
  });
  
  it('calls onSearch with empty filters when reset button is clicked', () => {
    render(
      <UserSearchFilters
        isLoading={false}
        onSearch={mockOnSearch}
      />
    );
    // Reveal advanced filters
    fireEvent.click(screen.getAllByRole('button', { name: /filters/i })[0]);
    // Click clear filters button
    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));
    expect(mockOnSearch).toHaveBeenCalledWith({});
  });
  
  it('submits form when Enter key is pressed', () => {
    render(
      <UserSearchFilters
        isLoading={false}
        onSearch={mockOnSearch}
      />
    );
    // Fill in nameOrEmail field
    fireEvent.change(screen.getByPlaceholderText('Search by name or email...'), { target: { value: 'John' } });
    // Simulate form submit by clicking the search button
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    expect(mockOnSearch).toHaveBeenCalledWith({ name: 'John', email: undefined, role: undefined, status: undefined });
  });
});