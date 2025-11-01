/// <reference types="cypress" />

// API base URL from environment variable or default to localhost:3001
const API_BASE_URL = Cypress.env('apiUrl') || 'http://localhost:3001';

describe('Station Error Handling', () => {
  // Increase timeout for all tests in this suite
  Cypress.config('defaultCommandTimeout', 10000);
  Cypress.config('responseTimeout', 30000);
  // Test verileri
  const testData = {
    station: {
      id: '1',
      name: 'Test Station',
      model: 'Test Model',
      power: '50',
      connector: 'CCS',
      status: 'Available'
    },
    selectors: {
      nameInput: 'input[name="name"]',
      modelInput: 'input[name="model"]',
      powerInput: 'input[name="power"]',
      connectorSelect: '[data-testid="connector-select"]',
      submitButton: 'button[type="submit"]',
      addButton: 'button:contains("Yeni İstasyon")',
      editButton: 'button[aria-label="Düzenle"]',
      deleteButton: 'button[aria-label="Sil"]',
      errorMessage: '[role="alert"][data-status="error"]',
      successMessage: '[role="alert"][data-status="success"]',
      loadingSpinner: '[role="progressbar"]'
    }
  };

  beforeEach(() => {
    // Clear all existing interceptors
    cy.intercept('GET', '**', (req) => {
      req.continue();
    });
    
    // Set up default mocks
    cy.intercept('GET', `${API_BASE_URL}/api/stations`, { 
      fixture: 'stations.json',
      statusCode: 200
    }).as('getStations');
    
    // Visit the page and wait for initial data load
    cy.visit('/stations');
    
    // Wait for the stations to load with a timeout
    cy.wait('@getStations', { timeout: 10000 }).then((interception) => {
      if (interception.response) {
        cy.log('Stations loaded successfully');
      } else {
        cy.log('Warning: Using fallback stations data');
      }
    });
  });

  it('should handle API error when loading stations', () => {
    // Mock for error case
    cy.intercept('GET', `${API_BASE_URL}/api/stations`, {
      statusCode: 500,
      body: { 
        success: false,
        message: 'Sunucu hatası',
        details: 'Internal server error occurred',
        timestamp: new Date().toISOString()
      },
      delay: 500
    }).as('getStationsError');

    // Refresh the page
    cy.reload();

    // Check for loading indicator
    cy.get(testData.selectors.loadingSpinner, { timeout: 5000 })
      .should('be.visible')
      .then(() => {
        cy.log('Loading indicator is visible');
      });

    // Wait for the error response
    cy.wait('@getStationsError', { timeout: 10000 }).then((interception) => {
      expect(interception.response.statusCode).to.eq(500);
      cy.log('Received error response from server');
    });

    // Check for error message
    cy.get(testData.selectors.errorMessage, { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'İstasyonlar yüklenirken bir hata oluştu')
      .and('contain', 'Sunucu hatası');
    
    // Check for retry button and click it
    cy.contains('button', /yeniden dene/i)
      .should('be.visible')
      .click();
    
    // Verify the API was called again
    cy.wait('@getStationsError');
  });

  it('should handle network error when adding a station', () => {
    // Network error simulation
    cy.intercept('POST', `${API_BASE_URL}/api/stations`, (req) => {
      req.destroy(); // Simulate network failure
    }).as('addStationNetworkError');

    // Open add station form
    cy.get(testData.selectors.addButton, { timeout: 10000 })
      .should('be.visible')
      .click();
    
    // Fill out the form
    cy.get(testData.selectors.nameInput, { timeout: 5000 })
      .should('be.visible')
      .type(testData.station.name);
      
    cy.get(testData.selectors.modelInput)
      .should('be.visible')
      .type(testData.station.model);
      
    cy.get(testData.selectors.powerInput)
      .should('be.visible')
      .clear()
      .type(testData.station.power);
      
    cy.get(testData.selectors.connectorSelect)
      .should('be.visible')
      .click();
      
    cy.get(`li[data-value="${testData.station.connector}"]`, { timeout: 5000 })
      .should('be.visible')
      .click();

    // Submit the form
    cy.get(testData.selectors.submitButton)
      .should('be.visible')
      .should('be.enabled')
      .click();

    // Check for loading state
    cy.get(testData.selectors.submitButton, { timeout: 10000 })
      .should('be.disabled');

    // Check for network error message
    cy.get(testData.selectors.errorMessage, { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'Ağ hatası oluştu')
      .and('contain', 'bağlantınızı kontrol edin');
      
    // Log the error for debugging
    cy.log('Network error test completed');
  });

  it('should handle 404 when station not found', () => {
    const nonExistentId = 'non-existent-id-123';
    const errorMessage = 'İstasyon bulunamadı';
    
    // Mock 404 response for non-existent station
    cy.intercept('GET', `${API_BASE_URL}/api/stations/${nonExistentId}`, {
      statusCode: 404,
      body: { 
        success: false,
        message: errorMessage,
        details: `Station with id ${nonExistentId} not found`,
        timestamp: new Date().toISOString()
      },
      delay: 300
    }).as('getStationNotFound');

    // Try to visit edit page for non-existent station
    cy.visit(`/stations/edit/${nonExistentId}`, {
      failOnStatusCode: false,
      timeout: 10000
    });
    
    // Wait for the API call to complete
    cy.wait('@getStationNotFound', { timeout: 10000 }).then((interception) => {
      expect(interception.response.statusCode).to.eq(404);
      cy.log('Received 404 response as expected');
    });
    
    // Check for error message
    cy.get(testData.selectors.errorMessage, { timeout: 10000 })
      .should('be.visible')
      .and('contain', errorMessage);
    
    // Verify redirection back to stations list
    cy.url({ timeout: 5000 })
      .should('include', '/stations')
      .and('not.include', `/edit/${nonExistentId}`);
  });

  it('should handle concurrent modification error', () => {
    // First, get the first station's data
    cy.get('table tbody tr', { timeout: 10000 })
      .first()
      .within(() => {
        cy.get(testData.selectors.editButton)
          .should('be.visible')
          .click();
      });
    
    // Mock concurrent modification error
    const conflictMessage = 'Bu kayıt başka bir kullanıcı tarafından güncellendi';
    const currentData = {
      ...testData.station,
      name: 'Güncellenmiş İstasyon',
      version: 2,
      updatedAt: new Date().toISOString()
    };
    
    cy.intercept('PUT', `${API_BASE_URL}/api/stations/${testData.station.id}`, {
      statusCode: 409,
      body: { 
        success: false,
        message: conflictMessage,
        details: 'Concurrent modification detected',
        currentVersion: 2,
        currentData: currentData,
        timestamp: new Date().toISOString()
      },
      delay: 300
    }).as('updateConflict');
    
    // Update a field
    const updatedName = 'Güncellenmiş İstasyon Test';
    cy.get(testData.selectors.nameInput, { timeout: 5000 })
      .should('be.visible')
      .clear()
      .type(updatedName);
    
    // Click save button
    cy.get(testData.selectors.submitButton)
      .should('be.visible')
      .should('be.enabled')
      .click();

    // Check for conflict error message
    cy.get(testData.selectors.errorMessage, { timeout: 10000 })
      .should('be.visible')
      .and('contain', conflictMessage);
    
    // Check for reload button and click it
    cy.contains('button', /yeniden yükle/i, { timeout: 5000 })
      .should('be.visible')
      .click();
    
    // Verify form is updated with current data
    cy.get(testData.selectors.nameInput, { timeout: 5000 })
      .should('have.value', currentData.name);
  });

  it('should handle session timeout', () => {
    // Mock session timeout error
    const errorMessage = 'Oturum süreniz doldu';
    
    cy.intercept('GET', `${API_BASE_URL}/api/stations`, {
      statusCode: 401,
      body: { 
        success: false,
        message: errorMessage,
        code: 'SESSION_EXPIRED',
        timestamp: new Date().toISOString()
      },
      delay: 300
    }).as('sessionTimeout');

    // Refresh the page
    cy.reload();
    
    // Wait for the session timeout response
    cy.wait('@sessionTimeout', { timeout: 10000 }).then((interception) => {
      expect(interception.response.statusCode).to.eq(401);
      cy.log('Received session timeout response');
    });

    // Verify redirection to login page
    cy.url({ timeout: 5000 })
      .should('include', '/login')
      .and('not.include', '/stations');
    
    // Check for error message
    cy.get(testData.selectors.errorMessage, { timeout: 5000 })
      .should('be.visible')
      .and('contain', errorMessage)
      .and('contain', 'tekrar giriş yapın');
  });

  it('should handle 403 Forbidden error', () => {
    // Mock 403 Forbidden error
    const errorMessage = 'Bu işlem için yetkiniz yok';
    const stationId = '1';
    
    cy.intercept('DELETE', `${API_BASE_URL}/api/stations/${stationId}`, {
      statusCode: 403,
      body: {
        success: false,
        message: errorMessage,
        code: 'FORBIDDEN',
        timestamp: new Date().toISOString()
      },
      delay: 300
    }).as('deleteForbidden');

    // Find and click delete button for the first station
    cy.get('table tbody tr', { timeout: 10000 })
      .first()
      .within(() => {
        cy.get(testData.selectors.deleteButton)
          .should('be.visible')
          .click();
      });
    
    // Confirm deletion in the dialog
    cy.get('[role="dialog"]', { timeout: 5000 })
      .should('be.visible')
      .within(() => {
        cy.contains('button', /sil/i)
          .should('be.visible')
          .click();
      });
    
    // Wait for the API call to complete
    cy.wait('@deleteForbidden', { timeout: 10000 }).then((interception) => {
      expect(interception.response.statusCode).to.eq(403);
      cy.log('Received 403 Forbidden response as expected');
    });
    
    // Check for error message
    cy.get(testData.selectors.errorMessage, { timeout: 5000 })
      .should('be.visible')
      .and('contain', errorMessage);
      
    // Verify the station is still in the list
    cy.get('table tbody tr')
      .should('have.length.gt', 0)
      .and('contain', testData.station.name);
    cy.get('table tbody tr').first().find(testData.selectors.deleteButton).click();
    
    // Silme onay diyaloğunu onayla
    cy.contains('button', 'Sil').click();

    // Hata mesajını kontrol et
    cy.get(testData.selectors.errorMessage)
      .should('be.visible')
      .and('contain', 'yetkiniz yok');
  });
});
