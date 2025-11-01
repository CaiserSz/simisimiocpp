# Detaylı Sprint Planları ve Görev Matrisi

**Oluşturma Tarihi:** 2025-01-11  
**Son Güncelleme:** 2025-01-11  
**Versiyon:** 1.0

---

## Sprint 1: Temel Altyapı ve Çoklu Protokol Desteği

**Süre:** 4 Hafta  
**Başlangıç:** 2025-01-11  
**Bitiş:** 2025-02-08  
**Sprint Goal:** Çalışan OCPP 1.6J ve OCPP 2.0.1 çekirdeği ile temel yönetim arayüzü

### Hafta 1 Görevleri (2025-01-11 - 2025-01-17)

#### Protokol Katmanı - Foundation
**Sorumlu:** Senior Backend Developer - Protocol Specialist (OCPP 1.6J)  
**Görevler:**
1. BaseProtocolHandler soyut sınıfı tasarımı ve implementasyonu
   - EventEmitter tabanlı yapı
   - Temel connect/disconnect metodları
   - sendCommand abstraksiyonu
   - handleMessage mekanizması
   - Cleanup metodları
   - **Süre:** 2 gün
   
2. OCPP mesaj formatı utilities
   - Message parser
   - Message validator
   - Error handler
   - **Süre:** 1 gün

3. Unit test framework kurulumu
   - Jest yapılandırması
   - Test utilities
   - Mock helpers
   - **Süre:** 0.5 gün

**Sorumlu:** Senior Backend Developer - Protocol Specialist (OCPP 2.0.1)  
**Görevler:**
1. OCPP 2.0.1 spesifikasyon analizi
   - Profil yapısı inceleme
   - Mesaj formatı farklılıkları
   - Yeni özellikler araştırma
   - **Süre:** 1 gün

2. Test CSMS ortamı kurulumu
   - OCPP test server setup
   - Connection test environment
   - **Süre:** 1 gün

#### İstasyon Yönetimi - Foundation
**Sorumlu:** Senior Backend Developer - System Architecture  
**Görevler:**
1. StationManager temel yapı tasarımı
   - Class structure
   - Data structures (Map kullanımı)
   - Event system
   - **Süre:** 1 gün

2. Station nesne modeli tasarımı
   - Station interface tanımlama
   - State management yaklaşımı
   - **Süre:** 0.5 gün

#### Backend API - Foundation
**Sorumlu:** Senior Backend Developer - API Design  
**Görevler:**
1. Express.js proje yapısı
   - Route organization
   - Middleware setup
   - Error handling middleware
   - **Süre:** 1 gün

2. Temel API endpoints tasarımı
   - REST API structure
   - Response format standardization
   - **Süre:** 0.5 gün

#### Frontend - Foundation
**Sorumlu:** Senior Frontend Developer - UI/UX Specialist  
**Görevler:**
1. React proje yapısı kurulumu
   - Component structure
   - Routing setup
   - State management (Context/Redux)
   - **Süre:** 1 gün

2. Material-UI tema yapılandırması
   - Theme setup
   - Base components
   - **Süre:** 0.5 gün

#### Veri Katmanı
**Sorumlu:** Senior Backend Developer - Database Specialist  
**Görevler:**
1. MongoDB bağlantı kurulumu
   - Connection pool configuration
   - Error handling
   - **Süre:** 0.5 gün

2. Station schema tasarımı
   - Mongoose schema definition
   - Validation rules
   - Indexes
   - **Süre:** 1 gün

### Hafta 2 Görevleri (2025-01-18 - 2025-01-24)

#### Protokol Katmanı - OCPP 1.6J Implementation
**Sorumlu:** Senior Backend Developer - Protocol Specialist (OCPP 1.6J)  
**Görevler:**
1. OCPP16JHandler class implementasyonu
   - BaseProtocolHandler'dan extend
   - Protocol version: 'ocpp1.6j'
   - **Süre:** 0.5 gün

2. WebSocket bağlantı implementasyonu
   - WebSocket client setup
   - Connection lifecycle
   - Reconnection logic
   - **Süre:** 1 gün

3. BootNotification implementasyonu
   - Message format
   - Response handling
   - Status validation
   - **Süre:** 0.5 gün

4. Heartbeat implementasyonu
   - Periodic heartbeat sending
   - Interval management
   - **Süre:** 0.5 gün

5. StatusNotification implementasyonu
   - Status update handling
   - Connector status management
   - **Süre:** 1 gün

6. OCPP 1.6J unit testleri
   - Handler testleri
   - Message handling testleri
   - **Süre:** 1 gün

#### Protokol Katmanı - OCPP 2.0.1 Implementation
**Sorumlu:** Senior Backend Developer - Protocol Specialist (OCPP 2.0.1)  
**Görevler:**
1. OCPP201Handler class implementasyonu
   - BaseProtocolHandler'dan extend
   - Protocol version: 'ocpp2.0.1'
   - Supported profiles definition
   - **Süre:** 0.5 gün

2. OCPP 2.0.1 WebSocket bağlantı
   - Subprotocol: 'ocpp2.0.1'
   - Connection setup
   - **Süre:** 0.5 gün

3. BootNotification (OCPP 2.0.1) implementasyonu
   - Enhanced fields
   - ChargingStation object
   - BootReason handling
   - **Süre:** 1 gün

4. Heartbeat (OCPP 2.0.1) implementasyonu
   - CurrentTime response
   - **Süre:** 0.5 gün

5. StatusNotification (OCPP 2.0.1) implementasyonu
   - Enhanced status reporting
   - **Süre:** 1 gün

6. OCPP 2.0.1 unit testleri
   - Handler testleri
   - **Süre:** 1 gün

#### Protokol Factory
**Sorumlu:** Lead Backend Developer  
**Görevler:**
1. ProtocolFactory implementasyonu
   - Handler creation logic
   - Protocol validation
   - **Süre:** 0.5 gün

2. Factory testleri
   - **Süre:** 0.5 gün

#### İstasyon Yönetimi
**Sorumlu:** Senior Backend Developer - System Architecture  
**Görevler:**
1. StationManager.createStation() implementasyonu
   - Station creation
   - Protocol handler initialization
   - Event setup
   - **Süre:** 1 gün

2. StationManager.removeStation() implementasyonu
   - Cleanup logic
   - **Süre:** 0.5 gün

3. StationManager bağlantı yönetimi
   - connectStation()
   - disconnectStation()
   - **Süre:** 1 gün

4. StationManager testleri
   - **Süre:** 1 gün

### Hafta 3 Görevleri (2025-01-25 - 2025-01-31)

#### Protokol Katmanı - Transaction Messages
**Sorumlu:** Senior Backend Developer - Protocol Specialist (OCPP 1.6J)  
**Görevler:**
1. Authorize mesajı implementasyonu
   - ID tag validation
   - Response handling
   - **Süre:** 0.5 gün

2. StartTransaction implementasyonu
   - Transaction ID generation
   - Meter start handling
   - **Süre:** 1 gün

3. StopTransaction implementasyonu
   - Transaction completion
   - Meter stop handling
   - **Süre:** 1 gün

4. MeterValues implementasyonu
   - Sampling interval
   - Value formatting
   - **Süre:** 1 gün

**Sorumlu:** Senior Backend Developer - Protocol Specialist (OCPP 2.0.1)  
**Görevler:**
1. RequestStartTransaction (OCPP 2.0.1)
   - Enhanced transaction start
   - **Süre:** 1 gün

2. RequestStopTransaction (OCPP 2.0.1)
   - Enhanced transaction stop
   - **Süre:** 1 gün

3. MeterValues (OCPP 2.0.1)
   - Enhanced meter values
   - **Süre:** 1 gün

#### Backend API
**Sorumlu:** Senior Backend Developer - API Design  
**Görevler:**
1. Station CRUD endpoints
   - GET /api/stations
   - POST /api/stations
   - GET /api/stations/:id
   - PUT /api/stations/:id
   - DELETE /api/stations/:id
   - **Süre:** 2 gün

2. Station connection endpoints
   - POST /api/stations/:id/connect
   - POST /api/stations/:id/disconnect
   - **Süre:** 1 gün

3. API validation middleware
   - Input validation
   - Error handling
   - **Süre:** 1 gün

#### WebSocket Server
**Sorumlu:** Senior Backend Developer - Real-time Systems  
**Görevler:**
1. WebSocket server setup
   - Socket.io server configuration
   - Connection management
   - **Süre:** 1 gün

2. WebSocket event handlers
   - station:status
   - station:connected
   - station:disconnected
   - **Süre:** 1 gün

3. WebSocket authentication
   - JWT validation
   - **Süre:** 1 gün

#### Frontend
**Sorumlu:** Senior Frontend Developer - UI/UX Specialist  
**Görevler:**
1. Station list component
   - Table view
   - Status indicators
   - Filtering and sorting
   - **Süre:** 1.5 gün

2. Station form component
   - Create/Edit form
   - Form validation
   - Protocol selection
   - **Süre:** 1.5 gün

3. WebSocket client setup
   - Socket.io-client integration
   - Event listeners
   - **Süre:** 1 gün

#### Veri Katmanı
**Sorumlu:** Senior Backend Developer - Database Specialist  
**Görevler:**
1. Station CRUD operations
   - MongoDB operations
   - Error handling
   - **Süre:** 1 gün

2. Redis cache implementation
   - Station status cache
   - TTL management
   - **Süre:** 1 gün

### Hafta 4 Görevleri (2025-02-01 - 2025-02-08)

#### Backend API - Remote Commands
**Sorumlu:** Senior Backend Developer - API Design  
**Görevler:**
1. Command endpoint
   - POST /api/stations/:id/commands
   - Command routing
   - **Süre:** 1 gün

2. RemoteStartTransaction endpoint
   - **Süre:** 0.5 gün

3. RemoteStopTransaction endpoint
   - **Süre:** 0.5 gün

4. API dokümantasyonu (Swagger)
   - OpenAPI spec
   - **Süre:** 1 gün

#### Frontend - İyileştirmeler
**Sorumlu:** Senior Frontend Developer - UI/UX Specialist  
**Görevler:**
1. Station detail page
   - Detailed view
   - Status visualization
   - **Süre:** 1.5 gün

2. Real-time status updates
   - WebSocket integration
   - Auto-refresh
   - **Süre:** 1 gün

3. Error handling ve notifications
   - Error boundaries
   - Toast notifications
   - **Süre:** 1 gün

4. Loading states
   - Skeleton loaders
   - Progress indicators
   - **Süre:** 0.5 gün

#### Test
**Sorumlu:** QA Engineer  
**Görevler:**
1. API endpoint testleri
   - Supertest ile testler
   - **Süre:** 1.5 gün

2. Integration testleri
   - Station creation flow
   - Connection flow
   - **Süre:** 1.5 gün

3. Frontend component testleri
   - React Testing Library
   - **Süre:** 1 gün

#### Sprint Review Hazırlığı
**Tüm Ekip:**
1. Demo hazırlığı
   - **Süre:** 0.5 gün

2. Sprint retrospective
   - **Süre:** 0.5 gün

---

## Sprint 2: Simülasyon Motoru ve CSMS Entegrasyonu

**Süre:** 4 Hafta  
**Başlangıç:** 2025-02-09  
**Bitiş:** 2025-03-09  
**Sprint Goal:** Çalışan şarj simülasyonu ve CSMS entegrasyonu

### Hafta 5 Görevleri (2025-02-09 - 2025-02-15)

#### Şarj Simülasyonu - Foundation
**Sorumlu:** Senior Backend Developer - Simulation Specialist  
**Görevler:**
1. ChargingEngine tasarımı
   - Architecture design
   - State machine design
   - **Süre:** 1.5 gün

2. ChargingEngine implementasyonu
   - Start charging logic
   - Stop charging logic
   - **Süre:** 2 gün

3. MeterValues simülasyonu
   - Realistic value generation
   - Sampling interval
   - **Süre:** 1.5 gün

**Sorumlu:** Mid-Level Backend Developer  
**Görevler:**
1. Vehicle connection simülasyonu
   - Connect event
   - Disconnect event
   - **Süre:** 1 gün

2. Connector state management
   - State transitions
   - **Süre:** 1 gün

#### Transaction Yönetimi
**Sorumlu:** Mid-Level Backend Developer  
**Görevler:**
1. TransactionManager tasarımı
   - Transaction lifecycle
   - **Süre:** 0.5 gün

2. Transaction schema tasarımı
   - MongoDB schema
   - **Süre:** 0.5 gün

3. Transaction CRUD operations
   - Create transaction
   - Update transaction
   - Get transactions
   - **Süre:** 1.5 gün

4. Transaction API endpoints
   - GET /api/transactions
   - GET /api/transactions/:id
   - GET /api/stations/:id/transactions
   - **Süre:** 1 gün

### Hafta 6 Görevleri (2025-02-16 - 2025-02-22)

#### Şarj Simülasyonu - Gelişmiş Özellikler
**Sorumlu:** Senior Backend Developer - Simulation Specialist  
**Görevler:**
1. Energy calculation logic
   - Power curve simulation
   - Energy consumption calculation
   - **Süre:** 1.5 gün

2. Charging profile simulation
   - Different charging profiles
   - Dynamic power adjustment
   - **Süre:** 1.5 gün

3. Error simulation
   - Fault injection
   - Error recovery
   - **Süre:** 1 gün

**Sorumlu:** Mid-Level Backend Developer  
**Görevler:**
1. Transaction completion logic
   - Stop transaction
   - Final meter values
   - Cost calculation
   - **Süre:** 1.5 gün

2. Transaction metrics calculation
   - Duration
   - Energy consumed
   - Average power
   - **Süre:** 1 gün

#### Station Simulator
**Sorumlu:** Senior Backend Developer - Simulation Specialist  
**Görevler:**
1. StationSimulator class tasarımı
   - Integration with ChargingEngine
   - Integration with ProtocolHandler
   - **Süre:** 1 gün

2. StationSimulator implementasyonu
   - Simulate charging session
   - Simulate vehicle actions
   - **Süre:** 2 gün

3. StationSimulator testleri
   - **Süre:** 1 gün

### Hafta 7 Görevleri (2025-02-23 - 2025-03-01)

#### CSMS Entegrasyonu
**Sorumlu:** Senior Backend Developer - Protocol Specialist (OCPP 1.6J)  
**Görevler:**
1. OCPP 1.6J - Remote mesajları
   - RemoteStartTransaction
   - RemoteStopTransaction
   - ChangeConfiguration
   - GetConfiguration
   - Reset
   - UnlockConnector
   - **Süre:** 2 gün

2. OCPP 1.6J - Additional mesajlar
   - GetDiagnostics
   - UpdateFirmware
   - **Süre:** 1 gün

**Sorumlu:** Senior Backend Developer - Protocol Specialist (OCPP 2.0.1)  
**Görevler:**
1. OCPP 2.0.1 - Remote mesajları
   - RequestStartTransaction
   - RequestStopTransaction
   - SetVariables
   - GetVariables
   - Reset
   - UnlockConnector
   - **Süre:** 2 gün

2. OCPP 2.0.1 - Smart Charging
   - SetChargingProfile
   - ClearChargingProfile
   - GetChargingProfile
   - **Süre:** 1 gün

**Sorumlu:** Senior Backend Developer - Real-time Systems  
**Görevler:**
1. Reconnection logic
   - Automatic reconnection
   - Exponential backoff
   - **Süre:** 1.5 gün

2. Connection health monitoring
   - Heartbeat monitoring
   - Timeout detection
   - **Süre:** 1 gün

3. Error handling ve retry
   - Retry mechanism
   - Error recovery
   - **Süre:** 0.5 gün

#### CSMS Test Ortamı
**Sorumlu:** DevOps Engineer  
**Görevler:**
1. CSMS test server kurulumu
   - OCPP server setup
   - **Süre:** 1 gün

### Hafta 8 Görevleri (2025-03-02 - 2025-03-09)

#### Senaryo Motoru
**Sorumlu:** Senior Backend Developer - Automation Specialist  
**Görevler:**
1. ScenarioEngine tasarımı
   - Scenario structure
   - Execution engine
   - **Süre:** 1.5 gün

2. ScenarioEngine implementasyonu
   - Load scenario
   - Run scenario
   - Stop scenario
   - Pause/Resume
   - **Süre:** 2 gün

3. Scenario schema tasarımı
   - MongoDB schema
   - **Süre:** 0.5 gün

4. Scenario CRUD operations
   - **Süre:** 1 gün

5. Scenario API endpoints
   - GET /api/scenarios
   - POST /api/scenarios
   - POST /api/scenarios/:id/run
   - POST /api/scenarios/:id/stop
   - **Süre:** 1 gün

#### Senaryo Editörü - Backend
**Sorumlu:** Mid-Level Backend Developer  
**Görevler:**
1. Scenario validation
   - Schema validation
   - Step validation
   - **Süre:** 1 gün

2. Scenario execution tracking
   - Execution history
   - Status tracking
   - **Süre:** 1 gün

#### Senaryo Editörü - Frontend
**Sorumlu:** Senior Frontend Developer - Complex UI  
**Görevler:**
1. Scenario list component
   - List view
   - Filtering
   - **Süre:** 0.5 gün

2. Scenario editor component
   - JSON editor
   - Visual editor (basic)
   - **Süre:** 2 gün

3. Scenario runner component
   - Run interface
   - Status display
   - **Süre:** 1 gün

4. Scenario history component
   - Execution history
   - **Süre:** 0.5 gün

#### Test ve İyileştirmeler
**Sorumlu:** QA Engineer  
**Görevler:**
1. Charging simulation testleri
   - **Süre:** 1.5 gün

2. CSMS entegrasyon testleri
   - **Süre:** 1.5 gün

3. Senaryo motoru testleri
   - **Süre:** 1 gün

---

## Sprint 3: Gelişmiş Özellikler ve Optimizasyon

**Süre:** 4 Hafta  
**Başlangıç:** 2025-03-10  
**Bitiş:** 2025-04-06  
**Sprint Goal:** Tam özellikli yönetim ve izleme paneli, optimizasyon

### Hafta 9 Görevleri (2025-03-10 - 2025-03-16)

#### İzleme Paneli - Backend
**Sorumlu:** DevOps Engineer - Monitoring Specialist  
**Görevler:**
1. Prometheus metrik implementasyonu
   - Station metrics
   - Transaction metrics
   - System metrics
   - **Süre:** 2 gün

2. Prometheus kurulumu
   - Configuration
   - Service discovery
   - **Süre:** 1 gün

3. Grafana dashboard tasarımı
   - Station overview
   - Transaction metrics
   - System health
   - **Süre:** 1.5 gün

**Sorumlu:** Mid-Level Backend Developer  
**Görevler:**
1. Metrics API endpoints
   - GET /api/metrics/stations
   - GET /api/metrics/transactions
   - GET /api/metrics/system
   - **Süre:** 1.5 gün

2. Logging sistem iyileştirmeleri
   - Structured logging
   - Log levels
   - **Süre:** 1 gün

#### İzleme Paneli - Frontend
**Sorumlu:** Senior Frontend Developer - Data Visualization  
**Görevler:**
1. Overview dashboard component
   - Summary cards
   - Quick stats
   - **Süre:** 1.5 gün

2. Metrics chart components
   - Line charts
   - Bar charts
   - Recharts integration
   - **Süre:** 2 gün

3. Real-time metrics updates
   - WebSocket integration
   - Auto-refresh
   - **Süre:** 1 gün

### Hafta 10 Görevleri (2025-03-17 - 2025-03-23)

#### İzleme Paneli - Gelişmiş Özellikler
**Sorumlu:** Senior Frontend Developer - Data Visualization  
**Görevler:**
1. Station monitor page
   - Live station view
   - Connector status
   - Real-time updates
   - **Süre:** 2 gün

2. Transaction monitor page
   - Active transactions
   - Transaction details
   - **Süre:** 1.5 gün

3. Log viewer component
   - Log filtering
   - Log search
   - Log levels
   - **Süre:** 1.5 gün

**Sorumlu:** Mid-Level Frontend Developer  
**Görevler:**
1. Alert panel component
   - Alert display
   - Alert filtering
   - **Süre:** 1 gün

2. Notification system
   - Toast notifications
   - Alert notifications
   - **Süre:** 1 gün

### Hafta 11 Görevleri (2025-03-24 - 2025-03-30)

#### Konfigürasyon Yönetimi
**Sorumlu:** Senior Backend Developer - API Design  
**Görevler:**
1. Configuration management API
   - GET /api/stations/:id/configuration
   - PUT /api/stations/:id/configuration
   - **Süre:** 1.5 gün

2. OCPP ChangeConfiguration handler
   - **Süre:** 1 gün

3. OCPP GetConfiguration handler
   - **Süre:** 0.5 gün

**Sorumlu:** Senior Frontend Developer - Complex UI  
**Görevler:**
1. Configuration editor component
   - Form-based editor
   - JSON editor
   - **Süre:** 2 gün

2. Configuration history view
   - Change history
   - Rollback capability
   - **Süre:** 1 gün

#### Anlık Kontrol
**Sorumlu:** Senior Backend Developer - API Design  
**Görevler:**
1. Command API endpoints
   - POST /api/stations/:id/commands/remote-start
   - POST /api/stations/:id/commands/remote-stop
   - POST /api/stations/:id/commands/reset
   - POST /api/stations/:id/commands/unlock
   - **Süre:** 1.5 gün

**Sorumlu:** Senior Frontend Developer - UI/UX Specialist  
**Görevler:**
1. Command control panel
   - Command buttons
   - Command confirmation
   - Command history
   - **Süre:** 1.5 gün

### Hafta 12 Görevleri (2025-03-31 - 2025-04-06)

#### Test ve Kalite
**Sorumlu:** QA Engineer - Test Automation Specialist  
**Görevler:**
1. E2E test suite (Cypress)
   - User flows
   - Critical paths
   - **Süre:** 2 gün

2. Performance testleri
   - Load testing
   - Stress testing
   - **Süre:** 1.5 gün

3. Security testing
   - Vulnerability scan
   - Penetration testing
   - **Süre:** 1 gün

#### Optimizasyon
**Sorumlu:** Senior Backend Developer - Database Specialist  
**Görevler:**
1. Database query optimization
   - Index optimization
   - Query analysis
   - **Süre:** 1 gün

2. Cache strategy optimization
   - Redis optimization
   - Cache invalidation
   - **Süre:** 1 gün

**Sorumlu:** Senior Backend Developer - Real-time Systems  
**Görevler:**
1. WebSocket performance optimization
   - Connection pooling
   - Message batching
   - **Süre:** 1 gün

**Sorumlu:** Senior Frontend Developer  
**Görevler:**
1. Frontend bundle optimization
   - Code splitting
   - Lazy loading
   - **Süre:** 1 gün

#### Dokümantasyon
**Sorumlu:** Technical Writer  
**Görevler:**
1. User guide
   - **Süre:** 1.5 gün

2. Developer guide
   - **Süre:** 1 gün

3. API documentation
   - **Süre:** 1 gün

4. Deployment guide
   - **Süre:** 0.5 gün

---

## Görev Dağılımı ve Bağımlılıklar

### Kritik Bağımlılıklar

1. **Protokol Handler → Station Manager**
   - StationManager, ProtocolHandler'ları kullanır
   - Bağımlılık: Sprint 1 Hafta 2 sonrası

2. **Station Manager → API Endpoints**
   - API endpoints, StationManager'ı kullanır
   - Bağımlılık: Sprint 1 Hafta 3

3. **Charging Engine → Station Simulator**
   - StationSimulator, ChargingEngine'i kullanır
   - Bağımlılık: Sprint 2 Hafta 6

4. **Transaction Manager → Charging Engine**
   - ChargingEngine, TransactionManager'ı kullanır
   - Bağımlılık: Sprint 2 Hafta 5

### Paralel Çalışma Fırsatları

- OCPP 1.6J ve OCPP 2.0.1 handler'ları paralel geliştirilebilir
- Frontend ve Backend API geliştirme paralel yapılabilir
- Senaryo editörü ve senaryo motoru kısmen paralel geliştirilebilir

---

## Başarı Kriterleri

### Sprint 1 Başarı Kriterleri
- [ ] OCPP 1.6J temel mesajlar çalışıyor
- [ ] OCPP 2.0.1 temel mesajlar çalışıyor
- [ ] İstasyon oluşturma ve yönetimi çalışıyor
- [ ] Temel frontend arayüz çalışıyor
- [ ] API endpoints test edilmiş

### Sprint 2 Başarı Kriterleri
- [ ] Şarj simülasyonu çalışıyor
- [ ] CSMS entegrasyonu başarılı
- [ ] Senaryo motoru çalışıyor
- [ ] Transaction yönetimi tamamlanmış

### Sprint 3 Başarı Kriterleri
- [ ] İzleme paneli tam özellikli
- [ ] Metrikler toplanıyor ve görselleştiriliyor
- [ ] Konfigürasyon yönetimi çalışıyor
- [ ] Performans hedefleri karşılanmış
- [ ] Dokümantasyon tamamlanmış

---

**Dokümantasyon Versiyonu:** 1.0  
**Son Güncelleme:** 2025-01-11