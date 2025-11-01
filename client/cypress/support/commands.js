// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
Cypress.Commands.add('login', (username, password) => {
  // Implementation for login command
  // This is a placeholder - implement according to your auth system
  cy.visit('/login')
  cy.get('input[name=username]').type(username)
  cy.get('input[name=password]').type(password)
  cy.get('form').submit()
})

// Command to check if an element is visible and contains text
Cypress.Commands.add('shouldBeVisibleWithText', (selector, text) => {
  cy.get(selector).should('be.visible').and('contain', text)
})

// Command to check if an element is visible and enabled
Cypress.Commands.add('shouldBeEnabled', (selector) => {
  cy.get(selector).should('be.visible').and('not.be.disabled')
})

// Command to check if an element is visible and disabled
Cypress.Commands.add('shouldBeDisabled', (selector) => {
  cy.get(selector).should('be.visible').and('be.disabled')
})
// Command to check if toast message is visible
Cypress.Commands.add('shouldShowToast', (message, type = 'success') => {
  cy.get(`[role="alert"][data-status="${type}"]`)
    .should('be.visible')
    .and('contain', message);
});

// Command to clear and type into an input field
Cypress.Commands.add('clearAndType', { prevSubject: 'element' }, (subject, text) => {
  cy.wrap(subject).clear().type(text)
})

// Command to select an option from a select dropdown
Cypress.Commands.add('selectOption', (selector, optionText) => {
  cy.get(selector).select(optionText)
})

// Command to upload a file
Cypress.Commands.add('uploadFile', (selector, fileName) => {
  cy.fixture(fileName, 'base64').then(fileContent => {
    return cy.get(selector).upload({
      fileContent,
      fileName,
      mimeType: 'application/octet-stream',
      encoding: 'base64'
    })
  })
})

// Command to wait for API response
Cypress.Commands.add('waitForResponse', (method, url, alias) => {
  cy.intercept(method, url).as(alias)
  return cy.wait(`@${alias}`)
})

// Command to check if element has class
Cypress.Commands.add('hasClass', { prevSubject: 'element' }, (subject, className) => {
  cy.wrap(subject).should('have.class', className)
})

// Command to check if element exists in the DOM (without failing if not found)
Cypress.Commands.add('getIfExists', (selector) => {
  cy.get('body').then(($body) => {
    if ($body.find(selector).length > 0) {
      return cy.get(selector)
    }
    return null
  })
})

// Command to check if element is in viewport
Cypress.Commands.add('isInViewport', { prevSubject: true }, (subject) => {
  cy.wrap(subject).should(($el) => {
    const bottom = Cypress.$(window).height()
    const rect = $el[0].getBoundingClientRect()
    expect(rect.top).to.be.lessThan(bottom)
    expect(rect.bottom).to.be.greaterThan(0)
    expect(rect.right).to.be.greaterThan(0)
    expect(rect.left).to.be.lessThan(Cypress.$(window).width())
  })
})

// Command to scroll to an element
Cypress.Commands.add('scrollToElement', (selector) => {
  cy.get(selector).scrollIntoView()
})

// Command to wait for loading spinner to disappear
Cypress.Commands.add('waitForLoading', () => {
  cy.get('.loading-spinner, [data-testid="loading"]', { timeout: 30000 }).should('not.exist')
})

// Command to check if element is sorted
Cypress.Commands.add('isSorted', { prevSubject: true }, (subject, order = 'asc') => {
  cy.wrap(subject).then(($elements) => {
    const texts = Array.from($elements).map(el => el.textContent.trim())
    const sorted = [...texts].sort((a, b) => 
      order === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
    )
    expect(texts).to.deep.equal(sorted)
  })
})
