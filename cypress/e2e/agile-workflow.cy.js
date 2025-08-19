describe('Complete Agile Workflow E2E Tests', () => {
  beforeEach(() => {
    // Clear database and seed with test data
    cy.clearDatabase();
    cy.seedDatabase();
    
    // Mock API responses for consistent testing
    cy.intercept('GET', '/api/v1/agile/epics', { fixture: 'epics.json' }).as('getEpics');
    cy.intercept('GET', '/api/v1/agile/stories', { fixture: 'stories.json' }).as('getStories');
    cy.intercept('GET', '/api/v1/agile/sprints', { fixture: 'sprints.json' }).as('getSprints');
    
    // Visit the application
    cy.visit('/');
  });

  describe('Epic Management Workflow', () => {
    it('should create, edit, and delete an epic', () => {
      // Navigate to backlog
      cy.navigateToBacklog();
      
      // Create new epic
      cy.get('[data-testid="new-epic-button"]').click();
      
      const epicData = {
        title: 'E2E Test Epic',
        description: 'This is a comprehensive epic created during end-to-end testing to validate the complete workflow',
        businessValue: 'Provides significant business value by ensuring the system works correctly from end to end',
        status: 'planned',
        priority: 'high'
      };
      
      cy.fillEpicForm(epicData);
      cy.get('[data-testid="create-epic-button"]').click();
      
      // Verify epic was created
      cy.shouldShowSuccessMessage('Epic created successfully');
      cy.get('[data-testid="epic-card"]').should('contain', epicData.title);
      
      // Edit the epic
      cy.get('[data-testid="epic-card"]').first().within(() => {
        cy.get('[data-testid="epic-menu-button"]').click();
      });
      cy.get('[data-testid="edit-epic-option"]').click();
      
      const updatedEpicData = {
        title: 'Updated E2E Test Epic',
        description: 'This epic has been updated during end-to-end testing to validate the edit functionality'
      };
      
      cy.fillEpicForm(updatedEpicData);
      cy.get('[data-testid="update-epic-button"]').click();
      
      // Verify epic was updated
      cy.shouldShowSuccessMessage('Epic updated successfully');
      cy.get('[data-testid="epic-card"]').should('contain', updatedEpicData.title);
      
      // Delete the epic
      cy.get('[data-testid="epic-card"]').first().within(() => {
        cy.get('[data-testid="epic-menu-button"]').click();
      });
      cy.get('[data-testid="delete-epic-option"]').click();
      cy.get('[data-testid="confirm-delete-button"]').click();
      
      // Verify epic was deleted
      cy.shouldShowSuccessMessage('Epic deleted successfully');
      cy.get('[data-testid="epic-card"]').should('not.contain', updatedEpicData.title);
    });
  });

  describe('User Story Management Workflow', () => {
    it('should create, edit, and manage user stories', () => {
      cy.navigateToBacklog();
      
      // Create new user story
      cy.get('[data-testid="new-story-button"]').click();
      
      const storyData = {
        title: 'E2E Test User Story',
        description: 'As a tester, I want to create user stories through E2E tests, so that I can validate the complete workflow',
        acceptanceCriteria: [
          'WHEN tester creates story THEN it appears in backlog',
          'GIVEN valid story data WHEN tester submits THEN success message is shown'
        ],
        storyPoints: 5,
        priority: 'high'
      };
      
      cy.fillStoryForm(storyData);
      cy.get('[data-testid="create-story-button"]').click();
      
      // Verify story was created
      cy.shouldShowSuccessMessage('Story created successfully');
      cy.get('[data-testid="story-card"]').should('contain', storyData.title);
      
      // Edit story points using estimator
      cy.get('[data-testid="story-card"]').first().within(() => {
        cy.get('[data-testid="estimate-story-button"]').click();
      });
      
      cy.get('[data-testid="story-point-8"]').click();
      cy.get('[data-testid="save-estimate-button"]').click();
      
      // Verify story points were updated
      cy.get('[data-testid="story-card"]').first().should('contain', '8');
      
      // Move story to different status
      cy.get('[data-testid="story-card"]').first().within(() => {
        cy.get('[data-testid="story-status-select"]').select('in-progress');
      });
      
      // Verify status change
      cy.get('[data-testid="story-card"]').first().should('contain', 'In Progress');
    });

    it('should filter and search stories', () => {
      cy.navigateToBacklog();
      
      // Test search functionality
      cy.get('[data-testid="story-search-input"]').type('authentication');
      cy.get('[data-testid="story-card"]').should('contain', 'authentication');
      
      // Clear search
      cy.get('[data-testid="story-search-input"]').clear();
      
      // Test status filter
      cy.get('[data-testid="status-filter-select"]').select('backlog');
      cy.get('[data-testid="story-card"]').each(($card) => {
        cy.wrap($card).should('contain', 'Backlog');
      });
      
      // Test priority filter
      cy.get('[data-testid="priority-filter-select"]').select('high');
      cy.get('[data-testid="story-card"]').each(($card) => {
        cy.wrap($card).should('contain', 'High');
      });
      
      // Clear filters
      cy.get('[data-testid="clear-filters-button"]').click();
      cy.get('[data-testid="story-card"]').should('have.length.greaterThan', 0);
    });
  });

  describe('Sprint Planning Workflow', () => {
    it('should create sprint and add stories', () => {
      cy.navigateToSprintPlanning();
      
      // Create new sprint
      cy.get('[data-testid="create-sprint-button"]').click();
      
      const sprintData = {
        number: 3,
        startDate: '2024-03-01',
        endDate: '2024-03-14',
        goal: 'Complete E2E testing framework and validate all workflows',
        capacity: 40
      };
      
      cy.fillSprintForm(sprintData);
      cy.get('[data-testid="create-sprint-submit"]').click();
      
      // Verify sprint was created
      cy.shouldShowSuccessMessage('Sprint created successfully');
      cy.get('[data-testid="sprint-card"]').should('contain', `Sprint ${sprintData.number}`);
      
      // Add stories to sprint
      cy.get('[data-testid="sprint-card"]').first().within(() => {
        cy.get('[data-testid="add-stories-button"]').click();
      });
      
      // Select stories from backlog
      cy.get('[data-testid="backlog-story"]').first().click();
      cy.get('[data-testid="backlog-story"]').eq(1).click();
      cy.get('[data-testid="add-selected-stories"]').click();
      
      // Verify stories were added
      cy.shouldShowSuccessMessage('Stories added to sprint');
      cy.get('[data-testid="sprint-card"]').first().should('contain', '2 stories');
      
      // Start the sprint
      cy.get('[data-testid="sprint-card"]').first().within(() => {
        cy.get('[data-testid="start-sprint-button"]').click();
      });
      
      // Verify sprint status changed
      cy.get('[data-testid="sprint-card"]').first().should('contain', 'Active');
    });

    it('should display burndown chart for active sprint', () => {
      cy.navigateToSprintPlanning();
      
      // Verify burndown chart is visible for active sprint
      cy.get('[data-testid="burndown-chart"]').should('be.visible');
      cy.get('[data-testid="chart-canvas"]').should('be.visible');
      
      // Verify chart data points
      cy.get('[data-testid="ideal-line"]').should('exist');
      cy.get('[data-testid="actual-line"]').should('exist');
      
      // Test chart interactions
      cy.get('[data-testid="chart-canvas"]').trigger('mouseover');
      cy.get('[data-testid="chart-tooltip"]').should('be.visible');
    });
  });

  describe('Complete Story Lifecycle', () => {
    it('should follow story from creation to completion', () => {
      // Start at backlog
      cy.navigateToBacklog();
      
      // Create epic first
      cy.get('[data-testid="new-epic-button"]').click();
      cy.fillEpicForm({
        title: 'Lifecycle Test Epic',
        description: 'Epic for testing complete story lifecycle',
        businessValue: 'Validates end-to-end story management'
      });
      cy.get('[data-testid="create-epic-button"]').click();
      
      // Create story linked to epic
      cy.get('[data-testid="new-story-button"]').click();
      cy.fillStoryForm({
        title: 'Lifecycle Test Story',
        description: 'As a user, I want to test the complete lifecycle, so that I can ensure quality',
        acceptanceCriteria: ['WHEN story is created THEN it follows complete lifecycle'],
        storyPoints: 3,
        priority: 'medium',
        epicId: 'lifecycle-test-epic'
      });
      cy.get('[data-testid="create-story-button"]').click();
      
      // Move to sprint planning
      cy.navigateToSprintPlanning();
      
      // Add story to active sprint
      cy.get('[data-testid="add-stories-button"]').click();
      cy.get('[data-testid="story-checkbox"]').first().check();
      cy.get('[data-testid="add-selected-stories"]').click();
      
      // Move story through workflow states
      cy.get('[data-testid="story-card"]').first().within(() => {
        // Move to In Progress
        cy.get('[data-testid="story-status-select"]').select('in-progress');
      });
      
      cy.wait(1000); // Allow state change to process
      
      cy.get('[data-testid="story-card"]').first().within(() => {
        // Move to Review
        cy.get('[data-testid="story-status-select"]').select('review');
      });
      
      cy.wait(1000);
      
      cy.get('[data-testid="story-card"]').first().within(() => {
        // Move to Done
        cy.get('[data-testid="story-status-select"]').select('done');
      });
      
      // Verify story completion updates sprint metrics
      cy.get('[data-testid="sprint-progress"]').should('contain', '3'); // Story points completed
      cy.get('[data-testid="burndown-chart"]').should('be.visible');
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should load pages within acceptable time limits', () => {
      // Test backlog page performance
      cy.measurePageLoad('Backlog');
      cy.navigateToBacklog();
      
      // Test sprint planning page performance
      cy.measurePageLoad('Sprint Planning');
      cy.navigateToSprintPlanning();
      
      // Test with large datasets
      cy.intercept('GET', '/api/v1/agile/epics', { fixture: 'large-epics.json' }).as('getLargeEpics');
      cy.navigateToBacklog();
      cy.measurePageLoad('Backlog with Large Dataset');
    });

    it('should be responsive across different screen sizes', () => {
      // Test mobile responsiveness
      cy.setMobileViewport();
      cy.navigateToBacklog();
      cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
      cy.get('[data-testid="epic-card"]').should('be.visible');
      
      // Test tablet responsiveness
      cy.setTabletViewport();
      cy.navigateToSprintPlanning();
      cy.get('[data-testid="sprint-card"]').should('be.visible');
      cy.get('[data-testid="burndown-chart"]').should('be.visible');
      
      // Test desktop responsiveness
      cy.setDesktopViewport();
      cy.navigateToBacklog();
      cy.get('[data-testid="sidebar"]').should('be.visible');
      cy.get('[data-testid="main-content"]').should('be.visible');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle API errors gracefully', () => {
      // Mock API error responses
      cy.intercept('GET', '/api/v1/agile/epics', { statusCode: 500 }).as('getEpicsError');
      cy.intercept('POST', '/api/v1/agile/epics', { statusCode: 400, body: { success: false, message: 'Validation failed' } }).as('createEpicError');
      
      cy.navigateToBacklog();
      
      // Should show error message for failed data load
      cy.shouldShowErrorMessage('Failed to load epics');
      
      // Should handle creation errors
      cy.get('[data-testid="new-epic-button"]').click();
      cy.fillEpicForm({
        title: 'Test Epic',
        description: 'Test description'
      });
      cy.get('[data-testid="create-epic-button"]').click();
      
      cy.shouldShowErrorMessage('Validation failed');
    });

    it('should handle network connectivity issues', () => {
      // Simulate offline mode
      cy.intercept('GET', '/api/v1/agile/epics', { forceNetworkError: true }).as('networkError');
      
      cy.navigateToBacklog();
      
      // Should show appropriate offline message
      cy.get('[data-testid="offline-indicator"]').should('be.visible');
      cy.shouldShowErrorMessage('Network connection lost');
    });

    it('should validate form inputs properly', () => {
      cy.navigateToBacklog();
      
      // Test epic form validation
      cy.get('[data-testid="new-epic-button"]').click();
      cy.get('[data-testid="create-epic-button"]').click();
      
      // Should show validation errors
      cy.get('[data-testid="title-error"]').should('contain', 'Title is required');
      cy.get('[data-testid="description-error"]').should('contain', 'Description is required');
      
      // Test story form validation
      cy.get('[data-testid="cancel-epic-button"]').click();
      cy.get('[data-testid="new-story-button"]').click();
      cy.get('[data-testid="create-story-button"]').click();
      
      cy.get('[data-testid="title-error"]').should('contain', 'Title is required');
      cy.get('[data-testid="description-error"]').should('contain', 'Description is required');
    });
  });

  describe('Accessibility Testing', () => {
    it('should meet accessibility standards', () => {
      cy.navigateToBacklog();
      cy.checkA11y();
      
      cy.navigateToSprintPlanning();
      cy.checkA11y();
      
      // Test keyboard navigation
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'new-epic-button');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'new-story-button');
    });

    it('should support screen readers', () => {
      cy.navigateToBacklog();
      
      // Check for proper ARIA labels
      cy.get('[data-testid="epic-card"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="story-card"]').should('have.attr', 'aria-label');
      
      // Check for proper heading structure
      cy.get('h1').should('exist');
      cy.get('h2').should('exist');
    });
  });

  describe('Visual Regression Testing', () => {
    it('should maintain consistent visual appearance', () => {
      cy.navigateToBacklog();
      cy.compareSnapshot('backlog-page');
      
      cy.navigateToSprintPlanning();
      cy.compareSnapshot('sprint-planning-page');
      
      // Test different states
      cy.get('[data-testid="new-epic-button"]').click();
      cy.compareSnapshot('epic-form-modal');
      
      cy.get('[data-testid="cancel-epic-button"]').click();
      cy.get('[data-testid="new-story-button"]').click();
      cy.compareSnapshot('story-form-modal');
    });
  });
});