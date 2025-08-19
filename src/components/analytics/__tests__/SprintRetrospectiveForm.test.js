import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SprintRetrospectiveForm from '../SprintRetrospectiveForm';

describe('SprintRetrospectiveForm', () => {
  const mockOnSubmit = jest.fn();
  const defaultProps = {
    sprintId: 5,
    onSubmit: mockOnSubmit
  };

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders form with all required fields', () => {
    render(<SprintRetrospectiveForm {...defaultProps} />);
    
    expect(screen.getByText('Sprint Retrospective - Sprint 5')).toBeInTheDocument();
    expect(screen.getByText('What Went Well')).toBeInTheDocument();
    expect(screen.getByText('What Could Improve')).toBeInTheDocument();
    expect(screen.getByText('Action Items')).toBeInTheDocument();
    expect(screen.getByText('Team Morale (1-10)')).toBeInTheDocument();
    expect(screen.getByText('Velocity Rating (1-10)')).toBeInTheDocument();
    expect(screen.getByText('Quality Rating (1-10)')).toBeInTheDocument();
    expect(screen.getByText('Communication Rating (1-10)')).toBeInTheDocument();
    expect(screen.getByText('Additional Notes')).toBeInTheDocument();
  });

  it('allows adding and removing "What Went Well" items', async () => {
    const user = userEvent.setup();
    render(<SprintRetrospectiveForm {...defaultProps} />);
    
    // Add an item
    const addButton = screen.getAllByText('Add Item')[0];
    await user.click(addButton);
    
    const textareas = screen.getAllByPlaceholderText('Describe something that went well...');
    expect(textareas).toHaveLength(2);
    
    // Add text to first textarea
    await user.type(textareas[0], 'Great team collaboration');
    expect(textareas[0]).toHaveValue('Great team collaboration');
    
    // Remove an item (should have remove button now)
    const removeButtons = screen.getAllByRole('button');
    const removeButton = removeButtons.find(button => 
      button.querySelector('svg') && button.getAttribute('type') === 'button'
    );
    if (removeButton) {
      await user.click(removeButton);
    }
  });

  it('allows adding and removing action items', async () => {
    const user = userEvent.setup();
    render(<SprintRetrospectiveForm {...defaultProps} />);
    
    // Add an action item
    const addActionButton = screen.getByText('Add Action Item');
    await user.click(addActionButton);
    
    const descriptionTextareas = screen.getAllByPlaceholderText('Describe the action item...');
    expect(descriptionTextareas).toHaveLength(2);
    
    // Fill in action item details
    await user.type(descriptionTextareas[0], 'Improve code review process');
    
    const assigneeInputs = screen.getAllByPlaceholderText('Who will handle this?');
    await user.type(assigneeInputs[0], 'John Doe');
    
    expect(descriptionTextareas[0]).toHaveValue('Improve code review process');
    expect(assigneeInputs[0]).toHaveValue('John Doe');
  });

  it('updates rating values correctly', async () => {
    const user = userEvent.setup();
    render(<SprintRetrospectiveForm {...defaultProps} />);
    
    // Find and update team morale slider
    const moraleSlider = screen.getByDisplayValue('5');
    await user.clear(moraleSlider);
    await user.type(moraleSlider, '8');
    
    // Check if badge shows updated value
    await waitFor(() => {
      expect(screen.getByText('8')).toBeInTheDocument();
    });
  });

  it('submits form with correct data structure', async () => {
    const user = userEvent.setup();
    render(<SprintRetrospectiveForm {...defaultProps} />);
    
    // Fill in form data
    const whatWentWellTextarea = screen.getByPlaceholderText('Describe something that went well...');
    await user.type(whatWentWellTextarea, 'Great sprint planning');
    
    const whatCouldImproveTextarea = screen.getByPlaceholderText('Describe something that could be improved...');
    await user.type(whatCouldImproveTextarea, 'Better communication');
    
    const actionItemTextarea = screen.getByPlaceholderText('Describe the action item...');
    await user.type(actionItemTextarea, 'Schedule team building');
    
    const assigneeInput = screen.getByPlaceholderText('Who will handle this?');
    await user.type(assigneeInput, 'Team Lead');
    
    const additionalNotesTextarea = screen.getByPlaceholderText('Any additional observations or notes...');
    await user.type(additionalNotesTextarea, 'Overall good sprint');
    
    // Submit form
    const submitButton = screen.getByText('Save Retrospective');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        sprintId: 5,
        whatWentWell: ['Great sprint planning'],
        whatCouldImprove: ['Better communication'],
        actionItems: [{
          description: 'Schedule team building',
          assignee: 'Team Lead',
          priority: 'medium'
        }],
        teamMorale: 5,
        velocityRating: 5,
        qualityRating: 5,
        communicationRating: 5,
        additionalNotes: 'Overall good sprint'
      });
    });
  });

  it('renders with initial data when provided', () => {
    const initialData = {
      whatWentWell: ['Good teamwork', 'Met sprint goals'],
      whatCouldImprove: ['Better testing'],
      actionItems: [{
        description: 'Improve test coverage',
        assignee: 'QA Team',
        priority: 'high'
      }],
      teamMorale: 8,
      velocityRating: 7,
      qualityRating: 6,
      communicationRating: 9,
      additionalNotes: 'Great sprint overall'
    };
    
    render(<SprintRetrospectiveForm {...defaultProps} initialData={initialData} />);
    
    expect(screen.getByDisplayValue('Good teamwork')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Better testing')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Improve test coverage')).toBeInTheDocument();
    expect(screen.getByDisplayValue('QA Team')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Great sprint overall')).toBeInTheDocument();
  });

  it('filters out empty items on submit', async () => {
    const user = userEvent.setup();
    render(<SprintRetrospectiveForm {...defaultProps} />);
    
    // Add multiple items, leave some empty
    const addWentWellButton = screen.getAllByText('Add Item')[0];
    await user.click(addWentWellButton);
    await user.click(addWentWellButton);
    
    const textareas = screen.getAllByPlaceholderText('Describe something that went well...');
    await user.type(textareas[0], 'Good item');
    // Leave textareas[1] and textareas[2] empty
    
    const submitButton = screen.getByText('Save Retrospective');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          whatWentWell: ['Good item'] // Empty items should be filtered out
        })
      );
    });
  });

  it('handles priority selection for action items', async () => {
    const user = userEvent.setup();
    render(<SprintRetrospectiveForm {...defaultProps} />);
    
    const actionItemTextarea = screen.getByPlaceholderText('Describe the action item...');
    await user.type(actionItemTextarea, 'Critical bug fix');
    
    const prioritySelect = screen.getByDisplayValue('medium');
    await user.selectOptions(prioritySelect, 'high');
    
    const submitButton = screen.getByText('Save Retrospective');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          actionItems: [{
            description: 'Critical bug fix',
            assignee: '',
            priority: 'high'
          }]
        })
      );
    });
  });
});