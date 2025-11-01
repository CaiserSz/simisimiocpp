/// <reference types="cypress" />

describe('Station Form Validation', () => {
  // Test verileri
  const testData = {
    validStation: {
      name: 'Test Station',
      model: 'Test Model',
      power: '50',
      connector: 'CCS'
    },
    invalidPowers: ['abc', '12.34.56', '-10', '0', '1000'],
    selectors: {
      nameInput: 'input[name="name"]',
      modelInput: 'input[name="model"]',
      powerInput: 'input[name="power"]',
      connectorSelect: '[data-testid="connector-select"]',
      submitButton: 'button[type="submit"]',
      form: 'form',
      errorMessage: '.MuiFormHelperText-root.Mui-error'
    }
  };

  beforeEach(() => {
    // API isteklerini mock'la
    cy.intercept('GET', '/api/stations', { fixture: 'stations.json' }).as('getStations');
    
    // Login işlemi (eğer gerekliyse)
    // cy.login('testuser', 'password');
    
    cy.visit('/stations');
    cy.wait('@getStations');
    
    // Yeni istasyon ekleme butonuna tıkla
    cy.contains('Yeni İstasyon').should('be.visible').click();
    
    // Formun yüklendiğinden emin ol
    cy.get(testData.selectors.form).should('be.visible');
  });

  it('should show validation errors for empty form submission', () => {
    // Doğrudan submit butonuna tıkla
    cy.get(testData.selectors.submitButton).click();

    // Tüm zorunlu alan hatalarını kontrol et
    cy.get(testData.selectors.errorMessage).should('have.length.at.least', 3);
    cy.contains('İsim zorunludur').should('be.visible');
    cy.contains('Model zorunludur').should('be.visible');
    cy.contains('Güç değeri zorunludur').should('be.visible');
  });

  it('should validate power input format', () => {
    // Geçersiz güç değerleri
    testData.invalidPowers.forEach(power => {
      cy.get(testData.selectors.powerInput).clear().type(power);
      cy.get(testData.selectors.submitButton).click();
      cy.contains(/Geçerli bir güç değeri girin/i).should('be.visible');
      cy.get(testData.selectors.errorMessage).should('contain', 'Geçerli bir güç değeri girin');
    });

    // Geçerli güç değeri
    cy.get(testData.selectors.powerInput).clear().type('50');
    cy.get(testData.selectors.submitButton).click();
    cy.get(testData.selectors.errorMessage).should('not.contain', 'Geçerli bir güç değeri girin');
  });

  it('should validate name length', () => {
    // Çok kısa isim
    cy.get(testData.selectors.nameInput).type('ab');
    cy.get(testData.selectors.submitButton).click();
    cy.get(testData.selectors.errorMessage)
      .should('be.visible')
      .and('contain', 'en az 3 karakter');

    // Çok uzun isim
    const longName = 'a'.repeat(101);
    cy.get(testData.selectors.nameInput).clear().type(longName);
    cy.get(testData.selectors.submitButton).click();
    cy.get(testData.selectors.errorMessage)
      .should('be.visible')
      .and('contain', 'en fazla 100 karakter');
  });

  it('should validate model length', () => {
    // Çok kısa model
    cy.get(testData.selectors.modelInput).type('a');
    cy.get(testData.selectors.submitButton).click();
    cy.get(testData.selectors.errorMessage)
      .should('be.visible')
      .and('contain', 'en az 2 karakter');

    // Çok uzun model
    const longModel = 'm'.repeat(51);
    cy.get(testData.selectors.modelInput).clear().type(longModel);
    cy.get(testData.selectors.submitButton).click();
    cy.get(testData.selectors.errorMessage)
      .should('be.visible')
      .and('contain', 'en fazla 50 karakter');
  });

  it('should show success message on valid form submission', () => {
    // Mock API yanıtı
    cy.intercept('POST', '/api/stations', {
      statusCode: 201,
      body: {
        id: 'test-id',
        ...testData.validStation,
        status: 'Available'
      },
      delayMs: 500 // Gerçekçi bir gecikme ekle
    }).as('createStation');

    // Formu doldur
    cy.get(testData.selectors.nameInput).type(testData.validStation.name);
    cy.get(testData.selectors.modelInput).type(testData.validStation.model);
    cy.get(testData.selectors.powerInput).clear().type(testData.validStation.power);
    
    // Konnektör seçimi
    cy.get(testData.selectors.connectorSelect).click();
    cy.get(`li[data-value="${testData.validStation.connector}"]`).click();

    // Formu gönder
    cy.get(testData.selectors.submitButton).click();

    // Yükleme durumunu kontrol et
    cy.get(testData.selectors.submitButton).should('be.disabled');

    // API çağrısını ve başarı mesajını kontrol et
    cy.wait('@createStation').then((interception) => {
      expect(interception.request.body).to.deep.equal({
        name: testData.validStation.name,
        model: testData.validStation.model,
        power: parseInt(testData.validStation.power, 10),
        connector: testData.validStation.connector
      });
    });
    
    // Başarı mesajını kontrol et
    cy.shouldShowToast(/başarıyla eklendi/i);
    
    // Formun kapatıldığını doğrula
    cy.get(testData.selectors.form).should('not.exist');
  });
});
