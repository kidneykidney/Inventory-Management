import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../utils/ThemeContext';

// Custom render function that includes providers
const AllTheProviders = ({ children }) => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </BrowserRouter>
  );
};

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Test data factories
export const createMockEpic = (overrides = {}) => ({
  id: 'epic-1',
  title: 'Test Epic',
  description: 'Test epic description that meets minimum length requirements',
  businessValue: 'Provides significant business value to users',
  status: 'planned',
  priority: 'high',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  stories: [],
  estimatedStoryPoints: 0,
  ...overrides,
});

export const createMockUserStory = (overrides = {}) => ({
  id: 'story-1',
  title: 'Test User Story',
  description: 'As a user, I want to test functionality, so that I can verify it works',
  acceptanceCriteria: [
    'WHEN user performs action THEN system responds correctly',
    'GIVEN valid input WHEN user submits THEN data is saved',
  ],
  storyPoints: 5,
  priority: 'high',
  status: 'backlog',
  epicId: 'epic-1',
  assignee: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockSprint = (overrides = {}) => ({
  id: 'sprint-1',
  number: 1,
  startDate: '2024-01-01',
  endDate: '2024-01-14',
  goal: 'Complete user authentication and basic functionality',
  status: 'planning',
  capacity: 40,
  velocity: 0,
  stories: [],
  burndownData: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Mock API responses
export const mockApiResponse = (data, success = true) => ({
  success,
  data,
  message: success ? 'Operation successful' : 'Operation failed',
});

export const mockApiError = (message = 'API Error', errors = []) => ({
  success: false,
  message,
  errors,
});

// Test helpers
export const waitForLoadingToFinish = () =>
  new Promise(resolve => setTimeout(resolve, 0));

export const mockFetch = (response, ok = true) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(response),
    })
  );
};

export const mockFetchError = (error = 'Network error') => {
  global.fetch = jest.fn(() => Promise.reject(new Error(error)));
};

// Form testing helpers
export const fillForm = async (getByLabelText, formData) => {
  const { fireEvent } = await import('@testing-library/react');
  
  Object.entries(formData).forEach(([field, value]) => {
    const input = getByLabelText(new RegExp(field, 'i'));
    fireEvent.change(input, { target: { value } });
  });
};

export const submitForm = async (getByRole, buttonText = 'submit') => {
  const { fireEvent } = await import('@testing-library/react');
  
  const submitButton = getByRole('button', { name: new RegExp(buttonText, 'i') });
  fireEvent.click(submitButton);
};