// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
// ***********************************************************

// Import commands and add custom commands
import './commands';

// Code coverage setup
import '@cypress/code-coverage/support';

// Global before hook - runs before all tests
before(() => {
  // Seed test data or perform initial setup
  cy.log('Running global before hook');
  
  // Set default API intercepts
  cy.intercept('GET', '/api/stations', { fixture: 'stations.json' }).as('getStations');
  cy.intercept('POST', '/api/stations', { statusCode: 201, body: { success: true } }).as('createStation');
  cy.intercept('PUT', '/api/stations/*', { statusCode: 200, body: { success: true } }).as('updateStation');
  cy.intercept('DELETE', '/api/stations/*', { statusCode: 204 }).as('deleteStation');
});

// Global after hook - runs after all tests
after(() => {
  // Clean up test data or perform teardown
  cy.log('Running global after hook');
});

// Global beforeEach hook - runs before each test
beforeEach(() => {
  // Reset test state
  cy.log('Running before each test');
  
  // Clear local storage and cookies
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // Visit the base URL before each test
  cy.visit('/');
  
  // Wait for initial data to load
  cy.wait('@getStations');
});

// Global afterEach hook - runs after each test
afterEach(() => {
  // Take a screenshot on test failure
  if (Cypress.currentTest.state === 'failed') {
    const screenshotName = `${Cypress.spec.name} -- ${Cypress.currentTest.title} (failed).png`;
    cy.screenshot(screenshotName, { capture: 'runner' });
  }
});

// Global test hooks
beforeEach(() => {
  // Reset API mocks before each test
  cy.intercept('GET', '/api/stations', { fixture: 'stations.json' }).as('getStations');
  
  // Handle uncaught exceptions
  cy.on('uncaught:exception', (err) => {
    console.error('Uncaught exception:', err);
    return false; // Prevent test from failing
  });
});

// Global afterEach hook
afterEach(() => {
  // Add any cleanup code here
});

// Global before hook
before(() => {
  // Runs once before all tests
  // Example: seed database, set up test data
});

// Global after hook
after(() => {
  // Runs once after all tests
  // Example: clean up test data
});
