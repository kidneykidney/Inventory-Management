describe('Sprint Planning Dashboard', () => {
  beforeEach(() => {
    // Mock API responses to avoid dependency on backend
    cy.mockSprintAPI();
    cy.login();
  });

  describe('Dashboard Loading and Display', () => {
    it('should load the sprint planning dashboard successfully', () => {
      cy.navigateToSprintPlanning();
      
      // Check main elements are present
      cy.contains('Sprint Planning').should('be.visible');
      cy.contains('Manage sprints, track progress, and plan iterations').should('be.visible');
      cy.get('[data-testid="create-sprint-button"]').should('be.visible');
    });

    it('should display sprint metrics cards', () => {
      cy.navigateToSprintPlanning();
      
      // Check metrics cards are displayed
      cy.contains('Team Velocity').should('be.visible');
      cy.contains('Sprint Progress').should('be.visible');
      cy.contains('Days Remaining').should('be.visible');
      cy.contains('Active Stories').should('be.visible');
    });

    it('should display sprint list', () => {
      cy.navigateToSprintPlanning();
      
      // Check sprint list is displayed
      cy.contains('Sprints').should('be.visible');
      cy.contains('All sprints and their status').should('be.visible');
    });
  });

  describe('Sprint Creation', () => {
    it('should open create sprint dialog when button is clicked', () => {
      cy.navigateToSprintPlanning();
      
      cy.get('[data-testid="create-sprint-button"]').click();
      
      // Check dialog is open
      cy.contains('Create New Sprint').should('be.visible');
      cy.contains('Set up a new sprint with goals and capacity planning').should('be.visible');
      
      // Check form fields are present
      cy.get('[data-testid="sprint-number-input"]').should('be.visible');
      cy.get('[data-testid="sprint-goal-input"]').should('be.visible');
      cy.get('[data-testid="sprint-capacity-input"]').should('be.visible');
      cy.get('[data-testid="sprint-start-date-input"]').should('be.visible');
      cy.get('[data-testid="sprint-end-date-input"]').should('be.visible');
    });

    it('should create a new sprint with valid data', () => {
      cy.navigateToSprintPlanning();
      
      // Mock the create sprint API call
      cy.intercept('POST', '/api/v1/sprints', {
        statusCode: 201,
        body: {
          success: true,
          message: 'Sprint created successfully',
          data: {
            id: 'new-sprint-id',
            number: 2,
            goal: 'New test sprint',
            capacity: 25,
            status: 'planning'
          }
        }
      }).as('createSprint');

      cy.createTestSprint({
        number: '2',
        goal: 'New test sprint',
        capacity: '25'
      });

      // Verify API was called
      cy.wait('@createSprint');
      
      // Dialog should close
      cy.contains('Create New Sprint').should('not.exist');
    });

    it('should validate required fields', () => {
      cy.navigateToSprintPlanning();
      
      cy.get('[data-testid="create-sprint-button"]').click();
      cy.get('[data-testid="create-sprint-submit"]').click();
      
      // Form should not submit without required fields
      cy.contains('Create New Sprint').should('be.visible');
    });
  });

  describe('Sprint Management', () => {
    it('should start a sprint in planning status', () => {
      cy.navigateToSprintPlanning();
      
      // Mock start sprint API call
      cy.intercept('POST', '/api/v1/sprints/test-sprint-1/start', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Sprint started successfully',
          data: {
            id: 'test-sprint-1',
            status: 'active'
          }
        }
      }).as('startSprint');

      // Click start button (assuming sprint is in planning status)
      cy.contains('Start').click();
      
      cy.wait('@startSprint');
    });

    it('should display burndown chart for active sprint', () => {
      // Mock active sprint data
      cy.intercept('GET', '/api/v1/sprints', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 'active-sprint',
              number: 1,
              goal: 'Active test sprint',
              status: 'active',
              capacity: 20,
              startDate: '2024-01-15',
              endDate: '2024-01-29',
              storyCount: 3,
              totalStoryPoints: 15,
              completedStoryPoints: 5
            }
          ]
        }
      }).as('getActiveSprints');

      // Mock burndown data
      cy.intercept('GET', '/api/v1/sprints/active-sprint/burndown', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            sprintId: 'active-sprint',
            totalStoryPoints: 15,
            completedStoryPoints: 5,
            remainingStoryPoints: 10,
            workingDays: 10,
            daysElapsed: 3,
            burndownData: [
              { date: '2024-01-15', idealRemaining: 15, actualRemaining: null },
              { date: '2024-01-16', idealRemaining: 13.5, actualRemaining: null },
              { date: '2024-01-17', idealRemaining: 12, actualRemaining: 10 }
            ],
            currentProgress: {
              idealRemaining: 12,
              actualRemaining: 10,
              isOnTrack: true,
              variance: -2
            },
            completionRate: 33
          }
        }
      }).as('getBurndownData');

      // Mock sprint stories
      cy.intercept('GET', '/api/v1/sprints/active-sprint/stories', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            stories: [
              {
                id: 'story-1',
                title: 'Active Story 1',
                status: 'done',
                story_points: 5
              },
              {
                id: 'story-2',
                title: 'Active Story 2',
                status: 'in-progress',
                story_points: 5
              },
              {
                id: 'story-3',
                title: 'Active Story 3',
                status: 'todo',
                story_points: 5
              }
            ]
          }
        }
      }).as('getSprintStories');

      cy.navigateToSprintPlanning();
      
      // Check burndown chart is displayed
      cy.contains('Burndown Chart').should('be.visible');
      cy.contains('Sprint 1 progress tracking').should('be.visible');
    });
  });

  describe('Story Management', () => {
    beforeEach(() => {
      // Mock active sprint with stories
      cy.intercept('GET', '/api/v1/sprints/active-sprint/stories', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            stories: [
              {
                id: 'story-1',
                title: 'Test Story 1',
                description: 'Test description',
                status: 'todo',
                priority: 'high',
                story_points: 5,
                sprint_id: 'active-sprint'
              }
            ]
          }
        }
      }).as('getSprintStories');
    });

    it('should open add stories dialog', () => {
      cy.navigateToSprintPlanning();
      
      // Mock recommendations
      cy.intercept('POST', '/api/v1/sprints/planning/recommend', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            recommendedStories: [
              {
                id: 'story-2',
                title: 'Recommended Story',
                priority: 'high',
                story_points: 3
              }
            ],
            totalStoryPoints: 3,
            capacityUtilization: 15
          }
        }
      }).as('getRecommendations');

      cy.contains('Add Stories').click();
      
      // Check dialog opens
      cy.contains('Add Stories to Sprint').should('be.visible');
      cy.contains('Select stories to add to Sprint').should('be.visible');
      
      // Check filters are present
      cy.get('input[placeholder="Search stories..."]').should('be.visible');
    });

    it('should filter stories by search term', () => {
      cy.navigateToSprintPlanning();
      
      cy.contains('Add Stories').click();
      
      // Type in search box
      cy.get('input[placeholder="Search stories..."]').type('Test User Story 1');
      
      // Should filter results
      cy.contains('Test User Story 1').should('be.visible');
      cy.contains('Test User Story 2').should('not.exist');
    });

    it('should add selected stories to sprint', () => {
      cy.navigateToSprintPlanning();
      
      // Mock allocate stories API
      cy.intercept('POST', '/api/v1/sprints/active-sprint/allocate', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Stories allocated successfully'
        }
      }).as('allocateStories');

      cy.contains('Add Stories').click();
      
      // Select a story
      cy.get('input[type="checkbox"]').first().check();
      
      // Add stories
      cy.contains('Add 1 Stories').click();
      
      cy.wait('@allocateStories');
    });
  });

  describe('Sprint Review and Retrospective', () => {
    it('should open sprint review dialog', () => {
      // Mock completed sprint
      cy.intercept('GET', '/api/v1/sprints', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 'completed-sprint',
              number: 1,
              goal: 'Completed sprint',
              status: 'active', // Active sprint can have review
              capacity: 20
            }
          ]
        }
      }).as('getCompletedSprints');

      cy.navigateToSprintPlanning();
      
      cy.contains('Sprint Review').click();
      
      // Check dialog opens
      cy.contains('Sprint 1 Review').should('be.visible');
      cy.contains('Review completed work and gather stakeholder feedback').should('be.visible');
    });

    it('should save sprint review data', () => {
      cy.navigateToSprintPlanning();
      
      cy.contains('Sprint Review').click();
      
      // Fill in review data
      cy.get('textarea').first().type('Sprint went well overall');
      cy.get('textarea').last().type('Stakeholders were satisfied');
      
      // Save review
      cy.contains('Save Review').click();
      
      // Dialog should close
      cy.contains('Sprint 1 Review').should('not.exist');
    });

    it('should open retrospective dialog', () => {
      // Mock completed sprint
      cy.intercept('GET', '/api/v1/sprints', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 'completed-sprint',
              number: 1,
              goal: 'Completed sprint',
              status: 'complete', // Complete sprint can have retrospective
              capacity: 20
            }
          ]
        }
      }).as('getCompletedSprints');

      cy.navigateToSprintPlanning();
      
      cy.contains('Retrospective').click();
      
      // Check dialog opens
      cy.contains('Sprint 1 Retrospective').should('be.visible');
      cy.contains('Reflect on the sprint and identify improvements').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should display correctly on mobile devices', () => {
      cy.viewport('iphone-x');
      cy.navigateToSprintPlanning();
      
      // Check main elements are still visible
      cy.contains('Sprint Planning').should('be.visible');
      cy.get('[data-testid="create-sprint-button"]').should('be.visible');
      
      // Metrics should stack vertically
      cy.contains('Team Velocity').should('be.visible');
    });

    it('should display correctly on tablet devices', () => {
      cy.viewport('ipad-2');
      cy.navigateToSprintPlanning();
      
      // Check layout adapts to tablet
      cy.contains('Sprint Planning').should('be.visible');
      cy.contains('Burndown Chart').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Mock API error
      cy.intercept('GET', '/api/v1/sprints', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('getSprintsError');

      cy.navigateToSprintPlanning();
      
      // Should display error message
      cy.contains('Failed to load sprint planning data').should('be.visible');
    });

    it('should handle network errors', () => {
      // Mock network failure
      cy.intercept('GET', '/api/v1/sprints', { forceNetworkError: true }).as('networkError');

      cy.navigateToSprintPlanning();
      
      // Should handle network error gracefully
      cy.contains('Loading sprint planning dashboard...').should('be.visible');
    });
  });
});