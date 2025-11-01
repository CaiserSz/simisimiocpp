/// <reference types="cypress" />

describe('Stations Management', () => {
  // Test verileri
  const testData = {
    newStation: {
      name: 'New Test Station',
      model: 'New Test Model',
      power: '50',
      connector: 'CCS'
    },
    selectors: {
      table: 'table',
      tableRows: 'table tbody tr',
      nameInput: 'input[name="name"]',
      modelInput: 'input[name="model"]',
      powerInput: 'input[name="power"]',
      connectorSelect: '[data-testid="connector-select"]',
      submitButton: 'button[type="submit"]',
      addButton: 'button:contains("Yeni İstasyon")',
      editButton: 'button[aria-label="Düzenle"]',
      deleteButton: 'button[aria-label="Sil"]',
      startChargingButton: 'button[aria-label="Şarjı Başlat"]',
      stopChargingButton: 'button[aria-label="Şarjı Durdur"]',
      confirmButton: 'button:contains("Evet")',
      cancelButton: 'button:contains("İptal")',
      errorMessage: '[role="alert"][data-status="error"]',
      successMessage: '[role="alert"][data-status="success"]',
      loadingSpinner: '[role="progressbar"]'
    }
  };

  beforeEach(() => {
    // API isteklerini mock'la
    cy.intercept('GET', '/api/stations', { fixture: 'stations.json' }).as('getStations');
    
    // Login işlemi (eğer gerekliyse)
    // cy.login('testuser', 'password');
    
    cy.visit('/stations');
    cy.wait('@getStations');
    
    // Tablonun yüklendiğinden emin ol
    cy.get(testData.selectors.table).should('be.visible');
  });

  it('should display the stations list with correct data', () => {
    // Tablodaki satır sayısını kontrol et
    cy.get(testData.selectors.tableRows).should('have.length', 2);
    
    // İstasyon verilerini kontrol et
    cy.contains('Test Station 1').should('be.visible');
    cy.contains('Test Station 2').should('be.visible');
    
    // Durum etiketlerini kontrol et
    cy.contains('Available').should('exist');
    cy.contains('Charging').should('exist');
    
    // Konnektör tiplerini kontrol et
    cy.contains('CCS').should('exist');
    cy.contains('Type 2').should('exist');
  });

  it('should add a new station successfully', () => {
    // Yeni istasyon ekleme API'sini mock'la
    cy.intercept('POST', '/api/stations', {
      statusCode: 201,
      body: {
        id: '3',
        ...testData.newStation,
        status: 'Available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      delayMs: 500
    }).as('addStation');

    // Yeni istasyon ekleme formunu aç
    cy.get(testData.selectors.addButton).click();
    
    // Formu doldur
    cy.get(testData.selectors.nameInput).type(testData.newStation.name);
    cy.get(testData.selectors.modelInput).type(testData.newStation.model);
    cy.get(testData.selectors.powerInput).clear().type(testData.newStation.power);
    
    // Konnektör seçimi
    cy.get(testData.selectors.connectorSelect).click();
    cy.get(`li[data-value="${testData.newStation.connector}"]`).click();

    // Formu gönder
    cy.get(testData.selectors.submitButton).click();

    // Yükleme durumunu kontrol et
    cy.get(testData.selectors.submitButton).should('be.disabled');
    
    // API çağrısını doğrula
    cy.wait('@addStation').then((interception) => {
      expect(interception.request.body).to.deep.equal({
        name: testData.newStation.name,
        model: testData.newStation.model,
        power: parseInt(testData.newStation.power, 10),
        connector: testData.newStation.connector
      });
    });
    
    // Başarı mesajını kontrol et
    cy.shouldShowToast(/başarıyla eklendi/i);
    
    // Yeni istasyonun listeye eklendiğini doğrula
    cy.get(testData.selectors.tableRows).should('have.length', 3);
    cy.contains(testData.newStation.name).should('be.visible');
  });

  it('should start charging for a station', () => {
    // Şarj başlatma API'sini mock'la
    cy.intercept('POST', '/api/stations/1/start', {
      statusCode: 200,
      body: {
        id: '1',
        status: 'Charging',
        updatedAt: new Date().toISOString()
      },
      delayMs: 300
    }).as('startCharging');

    // İlk istasyon için şarj başlat butonunu bul ve tıkla
    cy.get(testData.selectors.tableRows)
      .first()
      .within(() => {
        cy.get(testData.selectors.startChargingButton).click();
      });
    
    // Onay diyaloğunu onayla
    cy.get(testData.selectors.confirmButton).click();
    
    // API çağrısını doğrula
    cy.wait('@startCharging');
    
    // Başarı mesajını kontrol et
    cy.shouldShowToast(/şarj başlatıldı/i);
    
    // Durumun güncellendiğini doğrula
    cy.get(testData.selectors.tableRows)
      .first()
      .within(() => {
        cy.contains('Charging').should('exist');
        cy.get(testData.selectors.stopChargingButton).should('exist');
      });
  });

  it('should stop charging for a station', () => {
    // Şarj durdurma API'sini mock'la
    cy.intercept('POST', '/api/stations/2/stop', {
      statusCode: 200,
      body: {
        id: '2',
        status: 'Available',
        updatedAt: new Date().toISOString()
      },
      delayMs: 300
    }).as('stopCharging');

    // İkinci istasyon için şarj durdur butonunu bul ve tıkla
    cy.get(testData.selectors.tableRows)
      .eq(1)
      .within(() => {
        cy.get(testData.selectors.stopChargingButton).click();
      });
    
    // Onay diyaloğunu onayla
    cy.get(testData.selectors.confirmButton).click();
    
    // API çağrısını doğrula
    cy.wait('@stopCharging');
    
    // Başarı mesajını kontrol et
    cy.shouldShowToast(/şarj durduruldu/i);
    
    // Durumun güncellendiğini doğrula
    cy.get(testData.selectors.tableRows)
      .eq(1)
      .within(() => {
        cy.contains('Available').should('exist');
        cy.get(testData.selectors.startChargingButton).should('exist');
      });
  });

  it('should delete a station with confirmation', () => {
    // Silme API'sini mock'la
    cy.intercept('DELETE', '/api/stations/1', {
      statusCode: 204,
      delayMs: 300
    }).as('deleteStation');

    // İlk istasyonu sil butonunu bul ve tıkla
    cy.get(testData.selectors.tableRows)
      .first()
      .within(() => {
        cy.get(testData.selectors.deleteButton).click();
      });
    
    // Onay diyaloğunda silme işlemini onayla
    cy.contains('Emin misiniz?').should('be.visible');
    cy.get(testData.selectors.confirmButton).click();
    
    // API çağrısını doğrula
    cy.wait('@deleteStation');
    
    // Başarı mesajını kontrol et
    cy.shouldShowToast(/başarıyla silindi/i);
    
    // İstasyonun listeden kaldırıldığını doğrula
    cy.get(testData.selectors.tableRows).should('have.length', 1);
    cy.contains('Test Station 1').should('not.exist');
  });

  it('should cancel station deletion when clicking cancel', () => {
    // İlk istasyonu sil butonunu bul ve tıkla
    cy.get(testData.selectors.tableRows)
      .first()
      .within(() => {
        cy.get(testData.selectors.deleteButton).click();
      });
    
    // Onay diyaloğunda iptal et
    cy.contains('Emin misiniz?').should('be.visible');
    cy.get(testData.selectors.cancelButton).click();
    
    // İstasyonun hala listede olduğunu doğrula
    cy.get(testData.selectors.tableRows).should('have.length', 2);
    cy.contains('Test Station 1').should('exist');
  });

  it('should handle API error when loading stations', () => {
    // Hata durumu için mock
    cy.intercept('GET', '/api/stations', {
      statusCode: 500,
      body: { 
        message: 'Sunucu hatası',
        details: 'Internal server error occurred'
      },
      delayMs: 300
    }).as('getStationsError');

    // Sayfayı yenile
    cy.reload();

    // Hata mesajını kontrol et
    cy.get(testData.selectors.errorMessage)
      .should('be.visible')
      .and('contain', 'İstasyonlar yüklenirken bir hata oluştu');
    
    // Yeniden dene butonunu kontrol et
    cy.contains('button', 'Yeniden Dene')
      .should('be.visible')
      .click();
    
    // API'nin tekrar çağrıldığını doğrula
    cy.wait('@getStationsError');
  });

  it('should handle network error when adding a station', () => {
    // Ağ hatası simülasyonu
    cy.intercept('POST', '/api/stations', {
      forceNetworkError: true
    }).as('addStationNetworkError');

    // Yeni istasyon ekleme formunu aç
    cy.get(testData.selectors.addButton).click();
    
    // Formu doldur
    cy.get(testData.selectors.nameInput).type('Network Error Station');
    cy.get(testData.selectors.modelInput).type('Network Error Model');
    cy.get(testData.selectors.powerInput).clear().type('50');
    cy.get(testData.selectors.connectorSelect).click();
    cy.get('li[data-value="CCS"]').click();

    // Formu gönder
    cy.get(testData.selectors.submitButton).click();

    // Hata mesajını kontrol et
    cy.get(testData.selectors.errorMessage)
      .should('be.visible')
      .and('contain', 'Ağ hatası oluştu');
  });
});
