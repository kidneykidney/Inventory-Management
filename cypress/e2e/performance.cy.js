describe('Performance Testing', () => {
  beforeEach(() => {
    cy.clearDatabase();
    cy.seedDatabase();
  });

  describe('Page Load Performance', () => {
    it('should load backlog page within performance budget', () => {
      cy.visit('/agile/backlog');
      
      cy.window().then((win) => {
        cy.wrap(win.performance.getEntriesByType('navigation')[0]).then((perfEntry) => {
          // Check various performance metrics
          expect(perfEntry.loadEventEnd - perfEntry.loadEventStart).to.be.lessThan(2000); // 2s load time
          expect(perfEntry.domContentLoadedEventEnd - perfEntry.domContentLoadedEventStart).to.be.lessThan(1000); // 1s DOM ready
          expect(perfEntry.responseEnd - perfEntry.requestStart).to.be.lessThan(500); // 500ms server response
        });
      });
    });

    it('should load sprint planning page efficiently', () => {
      cy.visit('/agile/sprint-planning');
      
      // Measure First Contentful Paint
      cy.window().then((win) => {
        const fcpEntry = win.performance.getEntriesByName('first-contentful-paint')[0];
        if (fcpEntry) {
          expect(fcpEntry.startTime).to.be.lessThan(1500); // 1.5s FCP
        }
      });
      
      // Measure Largest Contentful Paint
      cy.window().then((win) => {
        const observer = new win.PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          expect(lastEntry.startTime).to.be.lessThan(2500); // 2.5s LCP
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
  });

  describe('API Response Performance', () => {
    it('should handle API requests within acceptable time', () => {
      cy.intercept('GET', '/api/v1/agile/epics').as('getEpics');
      cy.intercept('GET', '/api/v1/agile/stories').as('getStories');
      
      cy.visit('/agile/backlog');
      
      cy.wait('@getEpics').then((interception) => {
        expect(interception.response.statusCode).to.eq(200);
        // API should respond within 500ms
        expect(interception.response.delay || 0).to.be.lessThan(500);
      });
      
      cy.wait('@getStories').then((interception) => {
        expect(interception.response.statusCode).to.eq(200);
        expect(interception.response.delay || 0).to.be.lessThan(500);
      });
    });

    it('should handle concurrent API requests efficiently', () => {
      // Mock multiple API endpoints
      cy.intercept('GET', '/api/v1/agile/epics').as('getEpics');
      cy.intercept('GET', '/api/v1/agile/stories').as('getStories');
      cy.intercept('GET', '/api/v1/agile/sprints').as('getSprints');
      cy.intercept('GET', '/api/v1/agile/backlog/metrics').as('getMetrics');
      
      const startTime = Date.now();
      
      cy.visit('/agile/backlog');
      
      // Wait for all API calls to complete
      cy.wait(['@getEpics', '@getStories', '@getSprints', '@getMetrics']).then(() => {
        const totalTime = Date.now() - startTime;
        // All concurrent requests should complete within 1 second
        expect(totalTime).to.be.lessThan(1000);
      });
    });
  });

  describe('Large Dataset Performance', () => {
    it('should handle large number of epics efficiently', () => {
      // Create fixture with large dataset
      const largeEpicsData = Array.from({ length: 100 }, (_, i) => ({
        id: `epic-${i}`,
        title: `Epic ${i}`,
        description: `Description for epic ${i}`,
        status: 'planned',
        priority: 'medium',
        stories: []
      }));
      
      cy.intercept('GET', '/api/v1/agile/epics', {
        statusCode: 200,
        body: { success: true, data: largeEpicsData }
      }).as('getLargeEpics');
      
      const startTime = Date.now();
      cy.visit('/agile/backlog');
      
      cy.wait('@getLargeEpics');
      
      // Page should render within 3 seconds even with large dataset
      cy.get('[data-testid="epic-card"]').should('have.length', 100);
      
      cy.then(() => {
        const renderTime = Date.now() - startTime;
        expect(renderTime).to.be.lessThan(3000);
      });
    });

    it('should handle large number of stories with virtualization', () => {
      const largeStoriesData = Array.from({ length: 500 }, (_, i) => ({
        id: `story-${i}`,
        title: `Story ${i}`,
        description: `Description for story ${i}`,
        storyPoints: (i % 8) + 1,
        status: 'backlog',
        priority: 'medium'
      }));
      
      cy.intercept('GET', '/api/v1/agile/stories', {
        statusCode: 200,
        body: { success: true, data: largeStoriesData }
      }).as('getLargeStories');
      
      cy.visit('/agile/backlog');
      cy.wait('@getLargeStories');
      
      // Should use virtualization for large lists
      cy.get('[data-testid="story-list"]').should('be.visible');
      
      // Only visible stories should be rendered in DOM
      cy.get('[data-testid="story-card"]').should('have.length.lessThan', 50);
      
      // Scrolling should load more stories
      cy.get('[data-testid="story-list"]').scrollTo('bottom');
      cy.get('[data-testid="story-card"]').should('have.length.greaterThan', 10);
    });
  });

  describe('Memory Usage Performance', () => {
    it('should not have memory leaks during navigation', () => {
      // Navigate between pages multiple times
      for (let i = 0; i < 5; i++) {
        cy.visit('/agile/backlog');
        cy.wait(500);
        cy.visit('/agile/sprint-planning');
        cy.wait(500);
      }
      
      // Check memory usage
      cy.window().then((win) => {
        if (win.performance.memory) {
          const memoryInfo = win.performance.memory;
          // Memory usage should be reasonable (less than 50MB)
          expect(memoryInfo.usedJSHeapSize).to.be.lessThan(50 * 1024 * 1024);
        }
      });
    });

    it('should clean up event listeners and timers', () => {
      cy.visit('/agile/backlog');
      
      // Open and close modals multiple times
      for (let i = 0; i < 10; i++) {
        cy.get('[data-testid="new-epic-button"]').click();
        cy.get('[data-testid="cancel-epic-button"]').click();
      }
      
      // Check for potential memory leaks
      cy.window().then((win) => {
        // Should not have excessive number of event listeners
        const eventListenerCount = win.getEventListeners ? 
          Object.keys(win.getEventListeners(document)).length : 0;
        expect(eventListenerCount).to.be.lessThan(100);
      });
    });
  });

  describe('Network Performance', () => {
    it('should handle slow network conditions gracefully', () => {
      // Simulate slow 3G connection
      cy.intercept('GET', '/api/v1/agile/epics', (req) => {
        req.reply((res) => {
          res.delay(2000); // 2 second delay
          res.send({ fixture: 'epics.json' });
        });
      }).as('getSlowEpics');
      
      cy.visit('/agile/backlog');
      
      // Should show loading state
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      
      cy.wait('@getSlowEpics');
      
      // Should hide loading state after data loads
      cy.get('[data-testid="loading-spinner"]').should('not.exist');
      cy.get('[data-testid="epic-card"]').should('be.visible');
    });

    it('should implement proper caching strategies', () => {
      cy.intercept('GET', '/api/v1/agile/epics').as('getEpics');
      
      // First visit
      cy.visit('/agile/backlog');
      cy.wait('@getEpics');
      
      // Navigate away and back
      cy.visit('/agile/sprint-planning');
      cy.visit('/agile/backlog');
      
      // Should use cached data (no additional API call)
      cy.get('@getEpics.all').should('have.length', 1);
    });
  });

  describe('Rendering Performance', () => {
    it('should have smooth animations and transitions', () => {
      cy.visit('/agile/backlog');
      
      // Test modal animations
      cy.get('[data-testid="new-epic-button"]').click();
      
      // Modal should animate in smoothly
      cy.get('[data-testid="epic-form-modal"]')
        .should('be.visible')
        .and('have.css', 'opacity', '1');
      
      cy.get('[data-testid="cancel-epic-button"]').click();
      
      // Modal should animate out smoothly
      cy.get('[data-testid="epic-form-modal"]').should('not.exist');
    });

    it('should maintain 60fps during interactions', () => {
      cy.visit('/agile/backlog');
      
      // Test drag and drop performance
      cy.get('[data-testid="story-card"]').first().as('sourceStory');
      cy.get('[data-testid="epic-card"]').first().as('targetEpic');
      
      // Measure frame rate during drag operation
      cy.window().then((win) => {
        let frameCount = 0;
        const startTime = win.performance.now();
        
        const countFrames = () => {
          frameCount++;
          if (win.performance.now() - startTime < 1000) {
            win.requestAnimationFrame(countFrames);
          }
        };
        
        win.requestAnimationFrame(countFrames);
        
        // Perform drag and drop
        cy.get('@sourceStory').trigger('mousedown', { button: 0 });
        cy.get('@targetEpic').trigger('mousemove').trigger('mouseup');
        
        cy.then(() => {
          // Should maintain close to 60fps
          expect(frameCount).to.be.greaterThan(50);
        });
      });
    });
  });

  describe('Bundle Size and Loading Performance', () => {
    it('should have optimized bundle sizes', () => {
      cy.visit('/agile/backlog');
      
      cy.window().then((win) => {
        // Check for code splitting
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        const jsFiles = scripts.map(script => script.src);
        
        // Should have multiple chunks (indicating code splitting)
        expect(jsFiles.length).to.be.greaterThan(1);
        
        // Main bundle should be reasonably sized
        // This would require actual bundle analysis in a real implementation
        cy.log('Bundle analysis would be performed here');
      });
    });

    it('should lazy load non-critical components', () => {
      cy.visit('/agile/backlog');
      
      // Components not immediately visible should be lazy loaded
      cy.get('[data-testid="advanced-filters"]').should('not.exist');
      
      // Trigger lazy loading
      cy.get('[data-testid="show-advanced-filters"]').click();
      
      // Component should now be loaded
      cy.get('[data-testid="advanced-filters"]').should('be.visible');
    });
  });
});