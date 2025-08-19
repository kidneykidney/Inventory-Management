import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TechnicalDebtDashboard from '../TechnicalDebtDashboard';

describe('TechnicalDebtDashboard', () => {
  test('renders dashboard with header', () => {
    render(<TechnicalDebtDashboard />);
    
    expect(screen.getByText('Technical Debt Management')).toBeInTheDocument();
    expect(screen.getByText('Track and manage technical debt across the codebase')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add technical debt/i })).toBeInTheDocument();
  });

  test('displays metrics cards', () => {
    render(<TechnicalDebtDashboard />);
    
    expect(screen.getByText('Total Items')).toBeInTheDocument();
    expect(screen.getByText('High Priority')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
  });

  test('shows technical debt items in table', () => {
    render(<TechnicalDebtDashboard />);
    
    expect(screen.getByText('Migrate Material-UI to Shadcn UI')).toBeInTheDocument();
    expect(screen.getByText('Implement proper error handling in API routes')).toBeInTheDocument();
    expect(screen.getByText('Add comprehensive unit tests for utility functions')).toBeInTheDocument();
  });

  test('filters items by category', async () => {
    const user = userEvent.setup();
    render(<TechnicalDebtDashboard />);
    
    const categorySelect = screen.getByRole('combobox');
    await user.click(categorySelect);
    
    const uiFrameworkOption = screen.getByRole('option', { name: 'UI Framework' });
    await user.click(uiFrameworkOption);
    
    // Should show only UI Framework items
    expect(screen.getByText('Migrate Material-UI to Shadcn UI')).toBeInTheDocument();
    expect(screen.queryByText('Implement proper error handling in API routes')).not.toBeInTheDocument();
  });

  test('displays priority badges correctly', () => {
    render(<TechnicalDebtDashboard />);
    
    const highPriorityBadges = screen.getAllByText('high');
    const mediumPriorityBadges = screen.getAllByText('medium');
    
    expect(highPriorityBadges.length).toBeGreaterThan(0);
    expect(mediumPriorityBadges.length).toBeGreaterThan(0);
  });

  test('shows category breakdown', () => {
    render(<TechnicalDebtDashboard />);
    
    expect(screen.getByText('Debt by Category')).toBeInTheDocument();
    expect(screen.getByText('Distribution of technical debt across categories')).toBeInTheDocument();
  });

  test('shows priority distribution', () => {
    render(<TechnicalDebtDashboard />);
    
    expect(screen.getByText('Priority Distribution')).toBeInTheDocument();
    expect(screen.getByText('Technical debt items by priority level')).toBeInTheDocument();
  });

  test('displays completion rate progress bar', () => {
    render(<TechnicalDebtDashboard />);
    
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  test('shows effort in story points', () => {
    render(<TechnicalDebtDashboard />);
    
    const storyPointElements = screen.getAllByText('SP');
    expect(storyPointElements.length).toBeGreaterThan(0);
  });

  test('displays tags for technical debt items', () => {
    render(<TechnicalDebtDashboard />);
    
    expect(screen.getByText('ui')).toBeInTheDocument();
    expect(screen.getByText('migration')).toBeInTheDocument();
    expect(screen.getByText('modernization')).toBeInTheDocument();
  });

  test('shows assignee information', () => {
    render(<TechnicalDebtDashboard />);
    
    expect(screen.getByText('Frontend Team')).toBeInTheDocument();
    expect(screen.getByText('Backend Team')).toBeInTheDocument();
    expect(screen.getByText('QA Team')).toBeInTheDocument();
  });

  test('displays due dates', () => {
    render(<TechnicalDebtDashboard />);
    
    // Should show formatted dates
    const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  test('filters by priority', async () => {
    const user = userEvent.setup();
    render(<TechnicalDebtDashboard />);
    
    const prioritySelects = screen.getAllByRole('combobox');
    const prioritySelect = prioritySelects.find(select => 
      select.getAttribute('aria-label')?.includes('priority') || 
      select.textContent?.includes('Priority')
    );
    
    if (prioritySelect) {
      await user.click(prioritySelect);
      
      const highOption = screen.getByRole('option', { name: 'High' });
      await user.click(highOption);
      
      // Should filter to show only high priority items
      await waitFor(() => {
        expect(screen.getByText('Migrate Material-UI to Shadcn UI')).toBeInTheDocument();
      });
    }
  });

  test('filters by status', async () => {
    const user = userEvent.setup();
    render(<TechnicalDebtDashboard />);
    
    const statusSelects = screen.getAllByRole('combobox');
    const statusSelect = statusSelects.find(select => 
      select.getAttribute('aria-label')?.includes('status') || 
      select.textContent?.includes('Status')
    );
    
    if (statusSelect) {
      await user.click(statusSelect);
      
      const inProgressOption = screen.getByRole('option', { name: 'In Progress' });
      await user.click(inProgressOption);
      
      // Should filter to show only in-progress items
      await waitFor(() => {
        expect(screen.getByText('Migrate Material-UI to Shadcn UI')).toBeInTheDocument();
      });
    }
  });
});