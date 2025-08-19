import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import BacklogManagement from '../../agile/BacklogManagement';
import { ThemeProvider } from '../../../utils/ThemeContext';

// Mock fetch for API calls
const mockFetch = (response, ok = true) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(response),
    })
  );
};

const mockFetchError = (error = 'Network error') => {
  global.fetch = jest.fn(() => Promise.reject(new Error(error)));
};

// Test wrapper with providers
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

// Mock data
const mockEpics = [
  {
    id: 'epic-1',
    title: 'User Authentication System',
    description: 'Complete user authentication with login, registration, and password reset',
    businessValue: 'Enables secure user access to the system',
    status: 'planned',
    priority: 'high',
    stories: [
      {
        id: 'story-1',
        title: 'User Registration',
        description: 'As a new user, I want to register an account, so that I can access the system',
        storyPoints: 5,
        status: 'backlog',
        priority: 'high'
      },
      {
        id: 'story-2',
        title: 'User Login',
        description: 'As a registered user, I want to login to my account, so that I can access my data',
        storyPoints: 3,
        status: 'in-progress',
        priority: 'high'
      }
    ],
    estimatedStoryPoints: 8
  },
  {
    id: 'epic-2',
    title: 'Product Management',
    description: 'Comprehensive product catalog and management system',
    businessValue: 'Allows efficient product management and organization',
    status: 'in-progress',
    priority: 'medium',
    stories: [
      {
        id: 'story-3',
        title: 'Product Creation',
        description: 'As an admin, I want to create new products, so that I can manage inventory',
        storyPoints: 8,
        status: 'backlog',
        priority: 'medium'
      }
    ],
    estimatedStoryPoints: 8
  }
];

const mockApiResponse = (data, success = true) => ({
  success,
  data,
  message: success ? 'Operation successful' : 'Operation failed'
});

describe('BacklogManagement Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Data Loading Integration', () => {
    it('should load and display epics and stories from API', async () => {
      mockFetch(mockApiResponse(mockEpics));

      render(
        <TestWrapper>
          <BacklogManagement />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('User Authentication System')).toBeInTheDocument();
      });

      // Verify epics are displayed
      expect(screen.getByText('User Authentication System')).toBeInTheDocument();
      expect(screen.getByText('Product Management')).toBeInTheDocument();

      // Verify stories are displayed
      expect(screen.getByText(/User Registration/)).toBeInTheDocument();
      expect(screen.getByText(/User Login/)).toBeInTheDocument();
      expect(screen.getByText(/Product Creation/)).toBeInTheDocument();

      // Verify stats are calculated correctly
      expect(screen.getByText('2')).toBeInTheDocument(); // Total Epics
      expect(screen.getByText('3')).toBeInTheDocument(); // Total Stories
      expect(screen.getByText('16')).toBeInTheDocument(); // Total Story Points
    });

    it('should handle API errors gracefully', async () => {
      mockFetchError('Failed to fetch epics');

      render(
        <TestWrapper>
          <BacklogManagement />
        </TestWrapper>
      );

      // Should show error state or empty state
      await waitFor(() => {
        expect(screen.getByText('No stories found matching your criteria.')).toBeInTheDocument();
      });
    });

    it('should handle empty data response', async () => {
      mockFetch(mockApiResponse([]));

      render(
        <TestWrapper>
          <BacklogManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No stories found matching your criteria.')).toBeInTheDocument();
      });

      // Stats should show zeros
      expect(screen.getByText('0')).toBeInTheDocument(); // Should appear multiple times for different stats
    });
  });

  describe('Epic Creation Integration', () => {
    it('should create epic and refresh data', async () => {
      // Initial load
      mockFetch(mockApiResponse(mockEpics));

      render(
        <TestWrapper>
          <BacklogManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('User Authentication System')).toBeInTheDocument();
      });

      // Open epic form
      const newEpicButton = screen.getByRole('button', { name: /New Epic/ });
      fireEvent.click(newEpicButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Epic')).toBeInTheDocument();
      });

      // Fill form
      const titleInput = screen.getByLabelText(/title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const businessValueInput = screen.getByLabelText(/business value/i);

      fireEvent.change(titleInput, { target: { value: 'New Integration Test Epic' } });
      fireEvent.change(descriptionInput, { 
        target: { value: 'This is a comprehensive description for the new epic created during integration testing' } 
      });
      fireEvent.change(businessValueInput, { 
        target: { value: 'Provides significant business value for testing integration workflows' } 
      });

      // Mock successful creation
      const newEpic = {
        id: 'epic-3',
        title: 'New Integration Test Epic',
        description: 'This is a comprehensive description for the new epic created during integration testing',
        businessValue: 'Provides significant business value for testing integration workflows',
        status: 'planned',
        priority: 'high',
        stories: [],
        estimatedStoryPoints: 0
      };

      // Mock the create API call
      mockFetch(mockApiResponse(newEpic));

      const createButton = screen.getByRole('button', { name: 'Create Epic' });
      fireEvent.click(createButton);

      // Mock the refresh call with updated data
      const updatedEpics = [...mockEpics, newEpic];
      mockFetch(mockApiResponse(updatedEpics));

      // Form should close and data should refresh
      await waitFor(() => {
        expect(screen.queryByText('Create New Epic')).not.toBeInTheDocument();
      });

      // Verify API was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/agile/epics'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('New Integration Test Epic')
        })
      );
    });

    it('should handle epic creation errors', async () => {
      mockFetch(mockApiResponse(mockEpics));

      render(
        <TestWrapper>
          <BacklogManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('User Authentication System')).toBeInTheDocument();
      });

      // Open epic form
      const newEpicButton = screen.getByRole('button', { name: /New Epic/ });
      fireEvent.click(newEpicButton);

      // Fill form with invalid data
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Bad' } }); // Too short

      // Mock error response
      mockFetch({
        success: false,
        message: 'Validation failed',
        errors: ['Title must be between 5 and 200 characters']
      }, false);

      const createButton = screen.getByRole('button', { name: 'Create Epic' });
      fireEvent.click(createButton);

      // Should show error (implementation dependent)
      // Form should remain open for correction
      await waitFor(() => {
        expect(screen.getByText('Create New Epic')).toBeInTheDocument();
      });
    });
  });

  describe('Story Creation Integration', () => {
    it('should create story and refresh data', async () => {
      mockFetch(mockApiResponse(mockEpics));

      render(
        <TestWrapper>
          <BacklogManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('User Authentication System')).toBeInTheDocument();
      });

      // Open story form
      const newStoryButton = screen.getByRole('button', { name: /New Story/ });
      fireEvent.click(newStoryButton);

      await waitFor(() => {
        expect(screen.getByText('Create New User Story')).toBeInTheDocument();
      });

      // Fill form
      const titleInput = screen.getByLabelText(/title/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      fireEvent.change(titleInput, { target: { value: 'New Integration Test Story' } });
      fireEvent.change(descriptionInput, { 
        target: { value: 'As a developer, I want to test story creation, so that integration works correctly' } 
      });

      // Add acceptance criteria
      const criteriaInputs = screen.getAllByPlaceholderText(/WHEN/);
      fireEvent.change(criteriaInputs[0], { 
        target: { value: 'WHEN developer creates story THEN it appears in backlog' } 
      });

      // Mock successful creation
      const newStory = {
        id: 'story-4',
        title: 'New Integration Test Story',
        description: 'As a developer, I want to test story creation, so that integration works correctly',
        storyPoints: 5,
        status: 'backlog',
        priority: 'medium',
        epicId: null
      };

      mockFetch(mockApiResponse(newStory));

      const createButton = screen.getByRole('button', { name: 'Create Story' });
      fireEvent.click(createButton);

      // Form should close
      await waitFor(() => {
        expect(screen.queryByText('Create New User Story')).not.toBeInTheDocument();
      });

      // Verify API was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/agile/stories'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('New Integration Test Story')
        })
      );
    });
  });

  describe('Filtering Integration', () => {
    it('should filter stories by search term', async () => {
      mockFetch(mockApiResponse(mockEpics));

      render(
        <TestWrapper>
          <BacklogManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('User Registration')).toBeInTheDocument();
      });

      // Search for specific story
      const searchInput = screen.getByPlaceholderText('Search stories...');
      fireEvent.change(searchInput, { target: { value: 'registration' } });

      // Should filter results
      await waitFor(() => {
        expect(screen.getByText(/User Registration/)).toBeInTheDocument();
        expect(screen.queryByText(/User Login/)).not.toBeInTheDocument();
      });
    });

    it('should filter stories by epic', async () => {
      mockFetch(mockApiResponse(mockEpics));

      render(
        <TestWrapper>
          <BacklogManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('User Registration')).toBeInTheDocument();
      });

      // Filter by epic
      const epicSelect = screen.getByDisplayValue('All Epics');
      fireEvent.change(epicSelect, { target: { value: 'User Authentication System' } });

      // Should show filter badge
      await waitFor(() => {
        expect(screen.getByText('Filtered by: User Authentication System')).toBeInTheDocument();
      });
    });

    it('should combine multiple filters', async () => {
      mockFetch(mockApiResponse(mockEpics));

      render(
        <TestWrapper>
          <BacklogManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('User Registration')).toBeInTheDocument();
      });

      // Apply search filter
      const searchInput = screen.getByPlaceholderText('Search stories...');
      fireEvent.change(searchInput, { target: { value: 'user' } });

      // Apply status filter
      const statusSelect = screen.getByDisplayValue('All Status');
      fireEvent.change(statusSelect, { target: { value: 'backlog' } });

      // Should show combined filtering results
      await waitFor(() => {
        expect(screen.getByText(/User Registration/)).toBeInTheDocument();
        expect(screen.queryByText(/User Login/)).not.toBeInTheDocument(); // This is in-progress, not backlog
      });
    });
  });

  describe('Real-time Updates Integration', () => {
    it('should handle concurrent user actions', async () => {
      mockFetch(mockApiResponse(mockEpics));

      render(
        <TestWrapper>
          <BacklogManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('User Authentication System')).toBeInTheDocument();
      });

      // Simulate multiple rapid actions
      const newEpicButton = screen.getByRole('button', { name: /New Epic/ });
      const newStoryButton = screen.getByRole('button', { name: /New Story/ });

      // Rapid clicks should be handled gracefully
      fireEvent.click(newEpicButton);
      fireEvent.click(newStoryButton);

      // Only one form should be open (last one clicked)
      await waitFor(() => {
        expect(screen.getByText('Create New User Story')).toBeInTheDocument();
        expect(screen.queryByText('Create New Epic')).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', async () => {
      // Create large dataset
      const largeEpicList = [];
      for (let i = 0; i < 50; i++) {
        largeEpicList.push({
          id: `epic-${i}`,
          title: `Epic ${i}`,
          description: `Description for epic ${i} with sufficient length to meet validation requirements`,
          businessValue: `Business value for epic ${i}`,
          status: 'planned',
          priority: 'medium',
          stories: [],
          estimatedStoryPoints: 0
        });
      }

      mockFetch(mockApiResponse(largeEpicList));

      const startTime = Date.now();

      render(
        <TestWrapper>
          <BacklogManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Epic 0')).toBeInTheDocument();
      });

      const endTime = Date.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time
      expect(renderTime).toBeLessThan(2000); // 2 seconds
    });
  });
});