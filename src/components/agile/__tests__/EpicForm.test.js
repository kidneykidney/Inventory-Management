import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EpicForm from '../EpicForm';

const mockEpic = {
  id: '1',
  title: 'Test Epic',
  description: 'Test description',
  businessValue: 'Test business value',
  status: 'in-progress',
  targetSprint: 2,
};

const mockHandlers = {
  onClose: jest.fn(),
  onSubmit: jest.fn(),
};

describe('EpicForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create form correctly', () => {
    render(<EpicForm isOpen={true} {...mockHandlers} />);

    expect(screen.getByText('Create New Epic')).toBeInTheDocument();
    expect(
      screen.getByText('Create a new epic to organize related user stories.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create Epic' })
    ).toBeInTheDocument();
  });

  it('renders edit form correctly', () => {
    render(<EpicForm isOpen={true} epic={mockEpic} {...mockHandlers} />);

    expect(screen.getByText('Edit Epic')).toBeInTheDocument();
    expect(
      screen.getByText('Update the epic details below.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Update Epic' })
    ).toBeInTheDocument();
  });

  it('populates form fields when editing', () => {
    render(<EpicForm isOpen={true} epic={mockEpic} {...mockHandlers} />);

    expect(screen.getByDisplayValue('Test Epic')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test business value')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<EpicForm isOpen={true} {...mockHandlers} />);

    const submitButton = screen.getByRole('button', { name: 'Create Epic' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    expect(mockHandlers.onSubmit).not.toHaveBeenCalled();
  });

  it('validates target sprint is a number', async () => {
    render(<EpicForm isOpen={true} {...mockHandlers} />);

    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const targetSprintInput = screen.getByLabelText(/target sprint/i);

    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    fireEvent.change(descriptionInput, {
      target: { value: 'Test Description' },
    });
    fireEvent.change(targetSprintInput, { target: { value: 'invalid' } });

    const submitButton = screen.getByRole('button', { name: 'Create Epic' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Target sprint must be a number')
      ).toBeInTheDocument();
    });

    expect(mockHandlers.onSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    render(<EpicForm isOpen={true} {...mockHandlers} />);

    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const businessValueInput = screen.getByLabelText(/business value/i);
    const targetSprintInput = screen.getByLabelText(/target sprint/i);

    fireEvent.change(titleInput, { target: { value: 'New Epic' } });
    fireEvent.change(descriptionInput, {
      target: { value: 'New Description' },
    });
    fireEvent.change(businessValueInput, {
      target: { value: 'New Business Value' },
    });
    fireEvent.change(targetSprintInput, { target: { value: '3' } });

    const submitButton = screen.getByRole('button', { name: 'Create Epic' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockHandlers.onSubmit).toHaveBeenCalledWith({
        title: 'New Epic',
        description: 'New Description',
        businessValue: 'New Business Value',
        status: 'planned',
        targetSprint: 3,
      });
    });
  });

  it('handles empty target sprint correctly', async () => {
    render(<EpicForm isOpen={true} {...mockHandlers} />);

    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    fireEvent.change(titleInput, { target: { value: 'New Epic' } });
    fireEvent.change(descriptionInput, {
      target: { value: 'New Description' },
    });

    const submitButton = screen.getByRole('button', { name: 'Create Epic' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockHandlers.onSubmit).toHaveBeenCalledWith({
        title: 'New Epic',
        description: 'New Description',
        businessValue: '',
        status: 'planned',
        targetSprint: null,
      });
    });
  });

  it('calls onClose when cancel is clicked', () => {
    render(<EpicForm isOpen={true} {...mockHandlers} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(mockHandlers.onClose).toHaveBeenCalled();
  });

  it('clears errors when user starts typing', async () => {
    render(<EpicForm isOpen={true} {...mockHandlers} />);

    const submitButton = screen.getByRole('button', { name: 'Create Epic' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'New Title' } });

    expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(<EpicForm isOpen={true} isLoading={true} {...mockHandlers} />);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('resets form when closed and reopened', () => {
    const { rerender } = render(
      <EpicForm isOpen={true} epic={mockEpic} {...mockHandlers} />
    );

    expect(screen.getByDisplayValue('Test Epic')).toBeInTheDocument();

    rerender(<EpicForm isOpen={false} epic={mockEpic} {...mockHandlers} />);
    rerender(<EpicForm isOpen={true} {...mockHandlers} />);

    expect(screen.getByDisplayValue('')).toBeInTheDocument();
  });

  it('changes status correctly', async () => {
    render(<EpicForm isOpen={true} {...mockHandlers} />);

    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    fireEvent.change(titleInput, { target: { value: 'New Epic' } });
    fireEvent.change(descriptionInput, {
      target: { value: 'New Description' },
    });

    // Change status to complete
    const statusSelect = screen.getByRole('combobox');
    fireEvent.click(statusSelect);

    const completeOption = screen.getByText('Complete');
    fireEvent.click(completeOption);

    const submitButton = screen.getByRole('button', { name: 'Create Epic' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockHandlers.onSubmit).toHaveBeenCalledWith({
        title: 'New Epic',
        description: 'New Description',
        businessValue: '',
        status: 'complete',
        targetSprint: null,
      });
    });
  });
});
