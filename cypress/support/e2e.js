// ***********************************************************
// E2E testing support file

// Import commands and additional libraries
import './commands';
import '@testing-library/cypress/add-commands';
import 'cypress-axe';
import 'cypress-real-events/support';

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions
  // that might occur during testing but don't affect functionality
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  return true;
});

// Performance monitoring setup
beforeEach(() => {
  // Clear performance marks and measures
  cy.window().then((win) => {
    if (win.performance && win.performance.clearMarks) {
      win.performance.clearMarks();
      win.performance.clearMeasures();
    }
  });
});

// Accessibility testing setup
beforeEach(() => {
  cy.injectAxe();
});

// Visual regression testing setup
Cypress.Commands.add('matchImageSnapshot', (name) => {
  // This would integrate with a visual regression testing tool
  // For now, we just take screenshots
  cy.screenshot(name, { capture: 'viewport' });
});

// Custom assertions
Cypress.Commands.add('shouldBeAccessible', (context = null, options = null) => {
  cy.checkA11y(context, options, (violations) => {
    violations.forEach(violation => {
      cy.task('log', `Accessibility violation: ${violation.description}`);
      cy.task('log', `Help: ${violation.helpUrl}`);
    });
  });
});

// Performance testing helpers
Cypress.Commands.add('measurePerformance', (name) => {
  cy.window().then((win) => {
    win.performance.mark(`${name}-start`);
  });
  
  return {
    end: () => {
      cy.window().then((win) => {
        win.performance.mark(`${name}-end`);
        win.performance.measure(name, `${name}-start`, `${name}-end`);
        
        const measure = win.performance.getEntriesByName(name)[0];
        cy.task('log', `Performance: ${name} took ${measure.duration}ms`);
        
        return measure.duration;
      });
    }
  };
});

// Hide fetch/XHR requests from command log
const app = window.top;
if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}