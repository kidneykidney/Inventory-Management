// Component testing support file
import './commands';
import '@testing-library/cypress/add-commands';
import 'cypress-real-events/support';

// Import global styles
import '../../src/styles/global.css';

// Mock window.matchMedia for components that use it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: cy.stub().returns({
    matches: false,
    addListener: cy.stub(),
    removeListener: cy.stub(),
  }),
});

// Mock ResizeObserver
global.ResizeObserver = cy.stub().returns({
  observe: cy.stub(),
  unobserve: cy.stub(),
  disconnect: cy.stub(),
});

// Mock IntersectionObserver
global.IntersectionObserver = cy.stub().returns({
  observe: cy.stub(),
  unobserve: cy.stub(),
  disconnect: cy.stub(),
});

// Component testing configuration
Cypress.Commands.add('mount', (component, options = {}) => {
  const { routerProps = {}, ...mountOptions } = options;
  
  const wrapped = (
    <BrowserRouter {...routerProps}>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
  
  return cy.mount(wrapped, mountOptions);
});

// Custom commands for component testing
Cypress.Commands.add('getByTestId', (testId) => {
  return cy.get(`[data-testid="${testId}"]`);
});

Cypress.Commands.add('findByTestId', (testId) => {
  return cy.find(`[data-testid="${testId}"]`);
});

// Form testing helpers
Cypress.Commands.add('fillForm', (formData) => {
  Object.entries(formData).forEach(([field, value]) => {
    cy.get(`[name="${field}"], [id="${field}"]`).clear().type(value);
  });
});

Cypress.Commands.add('submitForm', (buttonText = 'Submit') => {
  cy.contains('button', buttonText).click();
});