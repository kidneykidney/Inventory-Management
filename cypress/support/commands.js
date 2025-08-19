// Custom commands for E2E testing

// Authentication commands
Cypress.Commands.add('login', (email = Cypress.env('testUser').email, password = Cypress.env('testUser').password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('not.include', '/login');
    cy.window().its('localStorage.token').should('exist');
  });
});

Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('token');
    win.localStorage.removeItem('user');
  });
  cy.visit('/login');
});

// API commands
Cypress.Commands.add('apiRequest', (method, endpoint, body = null) => {
  return cy.request({
    method,
    url: `${Cypress.env('apiUrl')}${endpoint}`,
    body,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${window.localStorage.getItem('token')}`
    },
    failOnStatusCode: false
  });
});

// Database commands
Cypress.Commands.add('seedDatabase', () => {
  cy.task('seedDatabase');
});

Cypress.Commands.add('clearDatabase', () => {
  cy.task('clearDatabase');
});

// Navigation commands
Cypress.Commands.add('navigateToBacklog', () => {
  cy.visit('/agile/backlog');
  cy.get('[data-testid="backlog-page"]').should('be.visible');
});

Cypress.Commands.add('navigateToSprintPlanning', () => {
  cy.visit('/agile/sprint-planning');
  cy.get('[data-testid="sprint-planning-page"]').should('be.visible');
});

// Form commands
Cypress.Commands.add('fillEpicForm', (epicData) => {
  cy.get('[data-testid="epic-title-input"]').clear().type(epicData.title);
  cy.get('[data-testid="epic-description-input"]').clear().type(epicData.description);
  if (epicData.businessValue) {
    cy.get('[data-testid="epic-business-value-input"]').clear().type(epicData.businessValue);
  }
  if (epicData.status) {
    cy.get('[data-testid="epic-status-select"]').select(epicData.status);
  }
  if (epicData.priority) {
    cy.get('[data-testid="epic-priority-select"]').select(epicData.priority);
  }
});

Cypress.Commands.add('fillStoryForm', (storyData) => {
  cy.get('[data-testid="story-title-input"]').clear().type(storyData.title);
  cy.get('[data-testid="story-description-input"]').clear().type(storyData.description);
  
  if (storyData.acceptanceCriteria && storyData.acceptanceCriteria.length > 0) {
    storyData.acceptanceCriteria.forEach((criteria, index) => {
      cy.get(`[data-testid="acceptance-criteria-${index}"]`).clear().type(criteria);
    });
  }
  
  if (storyData.storyPoints) {
    cy.get('[data-testid="story-points-select"]').select(storyData.storyPoints.toString());
  }
  
  if (storyData.priority) {
    cy.get('[data-testid="story-priority-select"]').select(storyData.priority);
  }
  
  if (storyData.epicId) {
    cy.get('[data-testid="story-epic-select"]').select(storyData.epicId);
  }
});

Cypress.Commands.add('fillSprintForm', (sprintData) => {
  cy.get('[data-testid="sprint-number-input"]').clear().type(sprintData.number.toString());
  cy.get('[data-testid="sprint-start-date-input"]').clear().type(sprintData.startDate);
  cy.get('[data-testid="sprint-end-date-input"]').clear().type(sprintData.endDate);
  cy.get('[data-testid="sprint-goal-input"]').clear().type(sprintData.goal);
  if (sprintData.capacity) {
    cy.get('[data-testid="sprint-capacity-input"]').clear().type(sprintData.capacity.toString());
  }
});

// Assertion commands
Cypress.Commands.add('shouldShowSuccessMessage', (message) => {
  cy.get('[data-testid="success-message"]').should('be.visible').and('contain', message);
});

Cypress.Commands.add('shouldShowErrorMessage', (message) => {
  cy.get('[data-testid="error-message"]').should('be.visible').and('contain', message);
});

// Wait commands
Cypress.Commands.add('waitForApiResponse', (alias) => {
  cy.wait(alias).its('response.statusCode').should('eq', 200);
});

Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-testid="loading-spinner"]').should('not.exist');
});

// Drag and drop commands
Cypress.Commands.add('dragAndDrop', (sourceSelector, targetSelector) => {
  cy.get(sourceSelector).trigger('mousedown', { button: 0 });
  cy.get(targetSelector).trigger('mousemove').trigger('mouseup');
});

// Performance testing commands
Cypress.Commands.add('measurePageLoad', (pageName) => {
  cy.window().then((win) => {
    const startTime = win.performance.now();
    cy.wrap(startTime).as('startTime');
  });
  
  cy.waitForPageLoad();
  
  cy.window().then((win) => {
    cy.get('@startTime').then((startTime) => {
      const loadTime = win.performance.now() - startTime;
      cy.task('log', `${pageName} load time: ${loadTime}ms`);
      expect(loadTime).to.be.lessThan(3000); // 3 second threshold
    });
  });
});

// Visual regression testing commands
Cypress.Commands.add('compareSnapshot', (name) => {
  cy.screenshot(name);
  // This would integrate with a visual regression testing tool
  // For now, we just take screenshots for manual comparison
});

// Accessibility testing commands
Cypress.Commands.add('checkA11y', (context = null, options = null) => {
  // This would integrate with cypress-axe for accessibility testing
  // cy.injectAxe();
  // cy.checkA11y(context, options);
  cy.log('Accessibility check placeholder - integrate cypress-axe for full functionality');
});

// Mobile testing commands
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(375, 667); // iPhone SE dimensions
});

Cypress.Commands.add('setTabletViewport', () => {
  cy.viewport(768, 1024); // iPad dimensions
});

Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 720); // Desktop dimensions
});

// Legacy commands for existing tests
Cypress.Commands.add('createTestSprint', (sprintData = {}) => {
  const defaultData = {
    number: '1',
    goal: 'Test sprint for E2E testing',
    capacity: '20',
    startDate: '2024-01-15',
    endDate: '2024-01-29',
    ...sprintData
  };

  cy.get('[data-testid="create-sprint-button"]').click();
  cy.get('[data-testid="sprint-number-input"]').clear().type(defaultData.number);
  cy.get('[data-testid="sprint-goal-input"]').clear().type(defaultData.goal);
  cy.get('[data-testid="sprint-capacity-input"]').clear().type(defaultData.capacity);
  cy.get('[data-testid="sprint-start-date-input"]').clear().type(defaultData.startDate);
  cy.get('[data-testid="sprint-end-date-input"]').clear().type(defaultData.endDate);
  cy.get('[data-testid="create-sprint-submit"]').click();
});

Cypress.Commands.add('waitForSprintData', () => {
  cy.intercept('GET', '/api/v1/sprints').as('getSprints');
  cy.intercept('GET', '/api/v1/sprints/planning/velocity').as('getVelocity');
  cy.wait(['@getSprints', '@getVelocity']);
});

Cypress.Commands.add('mockSprintAPI', () => {
  // Mock sprints endpoint
  cy.intercept('GET', '/api/v1/sprints', {
    statusCode: 200,
    body: {
      success: true,
      data: [
        {
          id: 'test-sprint-1',
          number: 1,
          goal: 'Test sprint goal',
          status: 'planning',
          capacity: 20,
          startDate: '2024-01-15',
          endDate: '2024-01-29',
          storyCount: 0,
          totalStoryPoints: 0,
          completedStoryPoints: 0
        }
      ]
    }
  }).as('getSprints');

  // Mock velocity endpoint
  cy.intercept('GET', '/api/v1/sprints/planning/velocity', {
    statusCode: 200,
    body: {
      success: true,
      data: {
        averageVelocity: 15,
        basedOnSprints: 3
      }
    }
  }).as('getVelocity');

  // Mock stories endpoint
  cy.intercept('GET', '/api/v1/stories', {
    statusCode: 200,
    body: {
      success: true,
      data: [
        {
          id: 'story-1',
          title: 'Test User Story 1',
          description: 'Test description',
          status: 'backlog',
          priority: 'high',
          story_points: 5,
          sprint_id: null
        },
        {
          id: 'story-2',
          title: 'Test User Story 2',
          description: 'Another test description',
          status: 'backlog',
          priority: 'medium',
          story_points: 3,
          sprint_id: null
        }
      ]
    }
  }).as('getStories');
});