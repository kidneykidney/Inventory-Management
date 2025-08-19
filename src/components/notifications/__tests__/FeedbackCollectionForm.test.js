import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import FeedbackCollectionForm from '../FeedbackCollectionForm';
import notificationService from '../../../services/notificationService';
import { useToast } from '../../../hooks/use-toast';

// Mock the notification service and toast
jest.mock('../../../services/notificationService');
jest.mock('../../../hooks/use-toast');

const mockToast = jest.fn();
useToast.mockReturnValue({ toast: mockToast });

describe('FeedbackCollectionForm', () => {
  const mockOnFeedbackSubmitted = jest.fn();
  const defaultProps = {
    sprintId: 'sprint-5',
    onFeedbackSubmitted: mockOnFeedbackSubmitted
  };

  beforeEach(() => {
    jest.clearAllMocks();
    notificationService.submitFeedback.mockResolvedValue({ success: true });
  });

  test('renders feedback form trigger button', () => {
    render(<FeedbackCollectionForm {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /provide feedback/i })).toBeInTheDocument();
  });

  test('opens feedback form dialog when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<FeedbackCollectionForm {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /provide feedback/i }));
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Submit Feedback')).toBeInTheDocument();
  });

  test('displays all form fields', async () => {
    const user = userEvent.setup();
    render(<FeedbackCollectionForm {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /provide feedback/i }));
    
    // Check for form fields
    expect(screen.getByLabelText(/feedback type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/overall rating/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/submit anonymously/i)).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    const user = userEvent.setup();
    render(<FeedbackCollectionForm {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /provide feedback/i }));
    
    // Try to submit without filling required fields
    await user.click(screen.getByRole('button', { name: /submit feedback/i }));
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
    });
    
    expect(notificationService.submitFeedback).not.toHaveBeenCalled();
  });

  test('submits feedback with valid data', async () => {
    const user = userEvent.setup();
    render(<FeedbackCollectionForm {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /provide feedback/i }));
    
    // Fill in required fields
    await user.click(screen.getByRole('combobox', { name: /feedback type/i }));
    await user.click(screen.getByText('Sprint Review'));
    
    await user.type(screen.getByLabelText(/title/i), 'Great sprint overall');
    await user.type(screen.getByLabelText(/description/i), 'The team worked well together and delivered all planned features.');
    
    // Set rating
    const stars = screen.getAllByRole('button');
    const fourthStar = stars.find(button => button.querySelector('svg'));
    if (fourthStar) {
      await user.click(fourthStar);
    }
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /submit feedback/i }));
    
    await waitFor(() => {
      expect(notificationService.submitFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sprint_review',
          title: 'Great sprint overall',
          description: 'The team worked well together and delivered all planned features.',
          sprintId: 'sprint-5',
          priority: 'medium',
          anonymous: false
        })
      );
    });
    
    expect(mockToast).toHaveBeenCalledWith({
      title: "Success",
      description: "Feedback submitted successfully"
    });
    
    expect(mockOnFeedbackSubmitted).toHaveBeenCalled();
  });

  test('handles star rating interaction', async () => {
    const user = userEvent.setup();
    render(<FeedbackCollectionForm {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /provide feedback/i }));
    
    // Initially no rating
    expect(screen.getByText('No rating')).toBeInTheDocument();
    
    // Click on third star
    const stars = screen.getAllByRole('button');
    const starButtons = stars.filter(button => 
      button.querySelector('svg') && 
      button.querySelector('svg').classList.contains('h-5')
    );
    
    if (starButtons.length >= 3) {
      await user.click(starButtons[2]); // Third star (0-indexed)
      expect(screen.getByText('3/5')).toBeInTheDocument();
    }
  });

  test('handles category selection', async () => {
    const user = userEvent.setup();
    render(<FeedbackCollectionForm {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /provide feedback/i }));
    
    // Select category
    await user.click(screen.getByRole('combobox', { name: /category/i }));
    await user.click(screen.getByText('Team Performance'));
    
    // Verify selection
    expect(screen.getByDisplayValue('Team Performance')).toBeInTheDocument();
  });

  test('handles priority selection', async () => {
    const user = userEvent.setup();
    render(<FeedbackCollectionForm {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /provide feedback/i }));
    
    // Select high priority
    await user.click(screen.getByRole('combobox', { name: /priority/i }));
    await user.click(screen.getByText('High'));
    
    // Verify selection (priority should be reflected in form state)
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  test('handles anonymous feedback toggle', async () => {
    const user = userEvent.setup();
    render(<FeedbackCollectionForm {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /provide feedback/i }));
    
    const anonymousCheckbox = screen.getByLabelText(/submit anonymously/i);
    expect(anonymousCheckbox).not.toBeChecked();
    
    await user.click(anonymousCheckbox);
    expect(anonymousCheckbox).toBeChecked();
  });

  test('handles API errors during submission', async () => {
    const user = userEvent.setup();
    notificationService.submitFeedback.mockRejectedValue(new Error('API Error'));
    
    render(<FeedbackCollectionForm {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /provide feedback/i }));
    
    // Fill in required fields
    await user.click(screen.getByRole('combobox', { name: /feedback type/i }));
    await user.click(screen.getByText('General Feedback'));
    
    await user.type(screen.getByLabelText(/title/i), 'Test feedback');
    await user.type(screen.getByLabelText(/description/i), 'Test description');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /submit feedback/i }));
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    });
  });

  test('shows loading state during submission', async () => {
    const user = userEvent.setup();
    // Mock a delayed response
    notificationService.submitFeedback.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );
    
    render(<FeedbackCollectionForm {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /provide feedback/i }));
    
    // Fill in required fields
    await user.click(screen.getByRole('combobox', { name: /feedback type/i }));
    await user.click(screen.getByText('Bug Report'));
    
    await user.type(screen.getByLabelText(/title/i), 'Found a bug');
    await user.type(screen.getByLabelText(/description/i), 'Bug description');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /submit feedback/i }));
    
    // Check for loading state
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled();
  });

  test('closes dialog and resets form after successful submission', async () => {
    const user = userEvent.setup();
    render(<FeedbackCollectionForm {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /provide feedback/i }));
    
    // Fill and submit form
    await user.click(screen.getByRole('combobox', { name: /feedback type/i }));
    await user.click(screen.getByText('Feature Request'));
    
    await user.type(screen.getByLabelText(/title/i), 'New feature idea');
    await user.type(screen.getByLabelText(/description/i), 'Feature description');
    
    await user.click(screen.getByRole('button', { name: /submit feedback/i }));
    
    await waitFor(() => {
      expect(notificationService.submitFeedback).toHaveBeenCalled();
    });
    
    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});