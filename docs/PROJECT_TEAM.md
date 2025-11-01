# Proje Kadrosu ve Organizasyon Şeması

**Oluşturma Tarihi:** 2025-01-11  
**Son Güncelleme:** 2025-01-11  
**Versiyon:** 1.0

---

## Proje Organizasyon Şeması

```
┌─────────────────────────────────────────────────────────────┐
│                    Proje Yöneticisi (PM)                     │
│                  [Proje Planlama ve Takip]                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────────┐
│ Teknik Lider │ │ DevOps Lead │ │ QA Lead        │
│  (Tech Lead) │ │             │ │                │
└───────┬──────┘ └─────────────┘ └────────────────┘
        │
        ├─────────────────────────────────┐
        │                                 │
┌───────▼──────────────────┐  ┌──────────▼───────────┐
│ Lead Backend Developer   │  │ Lead Frontend        │
│                           │  │ Developer            │
└───────┬──────────────────┘  └──────────┬───────────┘
        │                                │
        │                                │
┌───────┼───────────────────────────────┼──────────────┐
│       │                               │              │
│   ┌───▼────────┐              ┌──────▼──────┐      │
│   │ Backend    │              │ Frontend    │      │
│   │ Team       │              │ Team        │      │
│   └────────────┘              └─────────────┘      │
│                                                     │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│   │ Protocol   │  │ Simulation │  │ Automation │   │
│   │ Team       │  │ Team      │  │ Team       │   │
│   └────────────┘  └────────────┘  └────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Yönetim Kadrosu

### Proje Yöneticisi (Project Manager)
**İsim:** [Atanacak]  
**Unvan:** Proje Yöneticisi  
**Deneyim:** 5+ yıl proje yönetimi, Agile/Scrum sertifikası

**Sorumluluklar:**
- Proje planlaması ve zaman yönetimi
- Kaynak planlaması ve yönetimi
- Risk yönetimi ve azaltma stratejileri
- Stakeholder iletişim yönetimi
- Sprint planlama ve takip
- Milestone ve deliverable takibi
- Budget yönetimi
- İlerleme raporlama

**Günlük Aktiviteler:**
- Daily standup koordinasyonu
- Bloker takibi ve çözümü
- Haftalık progress review
- Risk register güncelleme

**Raporlama:**
- Haftalık: İlerleme raporu
- Aylık: Executive summary
- Sprint sonu: Sprint review sunumu

---

### Teknik Lider (Tech Lead)
**İsim:** [Atanacak]  
**Unvan:** Senior Principal Engineer / Tech Lead  
**Deneyim:** 8+ yıl yazılım geliştirme, mimari tasarım

**Sorumluluklar:**
- Teknik mimari kararlar
- Kod standartları ve best practices
- Code review süreçleri
- Teknik borç yönetimi
- Teknik mentörlük
- Teknik risk değerlendirmesi
- Teknoloji seçimi ve araştırma
- Teknik dokümantasyon gözetimi

**Günlük Aktiviteler:**
- Architecture review
- Code review participation
- Technical decision making
- Team mentoring

**Karar Yetkileri:**
- Teknik mimari değişiklikler
- Framework ve kütüphane seçimleri
- Kod standartları
- Refactoring önceliklendirme

---

## Geliştirme Ekibi

### Lead Backend Developer
**İsim:** [Atanacak]  
**Unvan:** Senior Staff Engineer / Lead Developer  
**Deneyim:** 7+ yıl backend geliştirme, Node.js uzmanı

**Sorumluluklar:**
- Backend mimari tasarım
- Kritik backend kod geliştirme
- Backend team yönetimi
- Code review liderliği
- Backend best practices
- API tasarım standartları

**Özel Görevleri:**
- ProtocolFactory tasarımı ve implementasyonu
- Kritik sistem bileşenlerinin geliştirilmesi
- Performance optimizasyonları
- Security best practices uygulama

**Raporlama:**
- Tech Lead'e haftalık rapor
- Backend team progress tracking

---

### Senior Backend Developer - Protocol Specialist (OCPP 1.6J)
**İsim:** [Atanacak]  
**Unvan:** Senior Software Engineer - Protocol Specialist  
**Deneyim:** 5+ yıl backend, OCPP protokol deneyimi tercihli

**Sorumluluklar:**
- OCPP 1.6J protokol implementasyonu
- Protokol uyumluluk garantisi
- OCPP 1.6J spesifikasyon takibi
- Protokol testleri geliştirme
- Protokol dokümantasyonu

**Özel Görevleri:**
- BaseProtocolHandler tasarımı (Lead ile birlikte)
- OCPP16JHandler tam implementasyonu
- OCPP 1.6J tüm mesaj türlerinin implementasyonu
- OCPP 1.6J unit ve entegrasyon testleri
- Protokol validasyon mantığı

**Sprint Hedefleri:**
- Sprint 1: Temel OCPP 1.6J mesajlar
- Sprint 2: Transaction ve Remote mesajlar
- Sprint 3: İyileştirmeler ve optimizasyon

**İşbirliği:**
- OCPP 2.0.1 specialist ile koordinasyon
- Lead Backend Developer ile mimari kararlar
- Test ekibi ile test senaryoları

---

### Senior Backend Developer - Protocol Specialist (OCPP 2.0.1)
**İsim:** [Atanacak]  
**Unvan:** Senior Software Engineer - Protocol Specialist  
**Deneyim:** 5+ yıl backend, OCPP 2.0.1 veya modern protokol deneyimi tercihli

**Sorumluluklar:**
- OCPP 2.0.1 protokol implementasyonu
- Profil bazlı geliştirme
- OCPP 2.0.1 spesifikasyon takibi
- Protokol testleri geliştirme
- Protokol dokümantasyonu

**Özel Görevleri:**
- OCPP201Handler tam implementasyonu
- Core profil implementasyonu
- Smart Charging profil implementasyonu
- Reservation profil implementasyonu
- OCPP 2.0.1 unit ve entegrasyon testleri

**Sprint Hedefleri:**
- Sprint 1: Temel OCPP 2.0.1 mesajlar
- Sprint 2: Profil bazlı mesajlar
- Sprint 3: Gelişmiş özellikler

**İşbirliği:**
- OCPP 1.6J specialist ile koordinasyon
- Lead Backend Developer ile mimari kararlar
- Test ekibi ile test senaryoları

---

### Senior Backend Developer - System Architecture
**İsim:** [Atanacak]  
**Unvan:** Senior Software Engineer - System Architect  
**Deneyim:** 6+ yıl backend, sistem mimarisi, distributed systems

**Sorumluluklar:**
- Sistem mimari tasarım
- İstasyon yönetimi sistemi geliştirme
- Çoklu istasyon koordinasyonu
- Event-driven architecture
- State management stratejileri

**Özel Görevleri:**
- StationManager tasarımı ve implementasyonu
- Event system tasarımı
- State synchronization mekanizmaları
- Scalability tasarımı
- Performance architecture

**Sprint Hedefleri:**
- Sprint 1: StationManager temel yapı
- Sprint 2: İyileştirmeler ve optimizasyonlar
- Sprint 3: Scale testing ve optimizasyonlar

**İşbirliği:**
- Protocol specialists ile entegrasyon
- Database specialist ile veri yapıları
- Real-time systems specialist ile event handling

---

### Senior Backend Developer - Simulation Specialist
**İsim:** [Atanacak]  
**Unvan:** Senior Software Engineer - Simulation Engineer  
**Deneyim:** 5+ yıl backend, simülasyon sistemleri, fizik/elektrik bilgisi tercihli

**Sorumluluklar:**
- Şarj simülasyonu motoru geliştirme
- Gerçekçi davranış modelleri
- Zaman bazlı senkronizasyon
- Simülasyon algoritmaları

**Özel Görevleri:**
- ChargingEngine tasarımı ve implementasyonu
- StationSimulator geliştirme
- MeterValues simülasyonu (gerçekçi değerler)
- Charging profile simülasyonu
- Energy calculation mantığı

**Sprint Hedefleri:**
- Sprint 2: ChargingEngine ve StationSimulator
- Sprint 3: Gelişmiş simülasyon özellikleri

**İşbirliği:**
- Transaction Manager ile entegrasyon
- Protocol handlers ile mesaj gönderimi
- Frontend team ile real-time updates

---

### Senior Backend Developer - API Design
**İsim:** [Atanacak]  
**Unvan:** Senior Software Engineer - API Architect  
**Deneyim:** 5+ yıl backend, REST API tasarımı, API security

**Sorumluluklar:**
- REST API tasarımı ve geliştirme
- API dokümantasyonu (Swagger/OpenAPI)
- API güvenliği ve doğrulama
- API versioning stratejisi
- API performance optimizasyonu

**Özel Görevleri:**
- REST API endpoints implementasyonu
- Swagger/OpenAPI dokümantasyonu
- Authentication/Authorization implementasyonu
- Input validation ve sanitization
- Rate limiting implementasyonu

**Sprint Hedefleri:**
- Sprint 1: Temel API endpoints
- Sprint 2: Gelişmiş endpoints
- Sprint 3: Security ve optimizasyon

**İşbirliği:**
- Frontend team ile API contract
- DevOps ile API deployment
- Security team ile güvenlik kontrolü

---

### Senior Backend Developer - Real-time Systems
**İsim:** [Atanacak]  
**Unvan:** Senior Software Engineer - Real-time Systems  
**Deneyim:** 5+ yıl backend, WebSocket, real-time systems

**Sorumluluklar:**
- WebSocket implementasyonu
- Gerçek zamanlı veri akışı
- Bağlantı yönetimi ve reconnection
- Message queuing ve routing
- Real-time synchronization

**Özel Görevleri:**
- WebSocket server implementasyonu
- Socket.io entegrasyonu
- Reconnection logic
- Connection health monitoring
- Message batching ve optimization

**Sprint Hedefleri:**
- Sprint 1: WebSocket temel yapı
- Sprint 2: CSMS reconnection logic
- Sprint 3: Performance optimizasyonu

**İşbirliği:**
- Frontend team ile WebSocket contract
- Monitoring team ile metrikler
- System Architecture ile event system

---

### Senior Backend Developer - Automation Specialist
**İsim:** [Atanacak]  
**Unvan:** Senior Software Engineer - Automation Engineer  
**Deneyim:** 5+ yıl backend, automation, workflow engines

**Sorumluluklar:**
- Senaryo motoru geliştirme
- Otomasyon mekanizmaları
- Senaryo yürütme optimizasyonu
- Hata yönetimi ve geri alma

**Özel Görevleri:**
- ScenarioEngine tasarımı ve implementasyonu
- Senaryo yürütme mekanizması
- Senaryo pause/resume logic
- Senaryo hata recovery
- Senaryo scheduling

**Sprint Hedefleri:**
- Sprint 2: ScenarioEngine temel yapı
- Sprint 3: Gelişmiş senaryo özellikleri

**İşbirliği:**
- Frontend team ile senaryo editörü
- Simulation team ile senaryo çalıştırma
- Test team ile senaryo testleri

---

### Senior Backend Developer - Database Specialist
**İsim:** [Atanacak]  
**Unvan:** Senior Software Engineer - Database Engineer  
**Deneyim:** 5+ yıl backend, MongoDB, Redis, database optimization

**Sorumluluklar:**
- Veritabanı tasarımı ve optimizasyonu
- Schema tasarımı
- İndeks optimizasyonu
- Migration yönetimi
- Data integrity

**Özel Görevleri:**
- MongoDB şema tasarımı
- Redis cache stratejileri
- Database migration scriptleri
- Query optimization
- Index strategy

**Sprint Hedefleri:**
- Sprint 1: Schema tasarımı
- Sprint 2: Optimizasyonlar
- Sprint 3: Performance tuning

**İşbirliği:**
- Tüm backend developers ile schema tasarımı
- DevOps ile database deployment
- Monitoring team ile query performance

---

### Mid-Level Backend Developer × 3
**İsim:** [Atanacak × 3]  
**Unvan:** Software Engineer  
**Deneyim:** 2-4 yıl backend geliştirme

**Sorumluluklar:**
- Feature geliştirme
- Bug fix
- Unit test yazma
- Kod review katılımı
- Dokümantasyon yazma

**Özel Görev Dağılımı:**

**Developer 1 - Transaction & State Management:**
- TransactionManager implementasyonu
- Transaction API endpoints
- State management helpers

**Developer 2 - Cache & Logging:**
- Redis cache implementasyonu
- Logging sistem geliştirme
- Cache invalidation logic

**Developer 3 - Integration & Utilities:**
- Integration testleri
- Utility functions
- Helper libraries

**Raporlama:**
- Senior Backend Developers'a raporlama
- Daily standup katılımı

---

## Frontend Ekibi

### Lead Frontend Developer
**İsim:** [Atanacak]  
**Unvan:** Senior Staff Engineer / Frontend Lead  
**Deneyim:** 7+ yıl frontend, React, modern frameworks

**Sorumluluklar:**
- Frontend mimari kararlar
- Frontend kod review
- Frontend best practices
- Frontend team yönetimi
- UI/UX koordinasyonu

**Özel Görevleri:**
- Frontend architecture design
- Component library standartları
- State management strategy
- Performance optimization

**Raporlama:**
- Tech Lead'e haftalık rapor
- Frontend team progress tracking

---

### Senior Frontend Developer - UI/UX Specialist
**İsim:** [Atanacak]  
**Unvan:** Senior Software Engineer - UI/UX  
**Deneyim:** 5+ yıl frontend, UI/UX tasarımı, Material-UI

**Sorumluluklar:**
- UI/UX tasarım ve implementasyonu
- Component geliştirme
- Form validasyonları
- User experience optimizasyonu
- Accessibility

**Özel Görevleri:**
- Station management UI components
- Form components library
- Material-UI theme customization
- Validation logic
- Error handling UI

**Sprint Hedefleri:**
- Sprint 1: Temel UI bileşenleri
- Sprint 2: Gelişmiş UI özellikleri
- Sprint 3: UX iyileştirmeleri

**İşbirliği:**
- UX Designer ile tasarım koordinasyonu
- API team ile data contract
- Backend team ile real-time updates

---

### Senior Frontend Developer - Complex UI
**İsim:** [Atanacak]  
**Unvan:** Senior Software Engineer - Complex UI  
**Deneyim:** 5+ yıl frontend, complex UI components, drag-and-drop

**Sorumluluklar:**
- Karmaşık UI bileşenleri geliştirme
- Drag-and-drop arayüzler
- Visual editors
- Görselleştirme bileşenleri

**Özel Görevleri:**
- Senaryo editör geliştirme (visual/JSON)
- Configuration editor
- Visual workflow builder
- Advanced form components

**Sprint Hedefleri:**
- Sprint 2: Senaryo editörü temel yapı
- Sprint 3: Gelişmiş editör özellikleri

**İşbirliği:**
- Backend automation team ile senaryo formatı
- UX Designer ile editör tasarımı

---

### Senior Frontend Developer - Data Visualization
**İsim:** [Atanacak]  
**Unvan:** Senior Software Engineer - Data Visualization  
**Deneyim:** 5+ yıl frontend, data visualization, charts, dashboards

**Sorumluluklar:**
- Dashboard geliştirme
- Grafik ve chart implementasyonu
- Veri görselleştirme
- Real-time data visualization

**Özel Görevleri:**
- Monitoring dashboard
- Metrics charts (Recharts/Chart.js)
- Real-time data updates
- Custom visualization components

**Sprint Hedefleri:**
- Sprint 3: Dashboard ve charts

**İşbirliği:**
- Backend monitoring team ile metrik API
- DevOps ile Grafana entegrasyonu

---

### Mid-Level Frontend Developer × 3
**İsim:** [Atanacak × 3]  
**Unvan:** Software Engineer  
**Deneyim:** 2-4 yıl frontend geliştirme

**Sorumluluklar:**
- Component geliştirme
- UI implementasyonu
- State management
- Testing

**Özel Görev Dağılımı:**

**Developer 1 - Real-time & WebSocket:**
- WebSocket client implementasyonu
- Real-time update components
- Event handling

**Developer 2 - UI Components:**
- Basic UI components
- List and table components
- Form components

**Developer 3 - Integration & Testing:**
- Component integration
- Unit tests
- Integration tests

**Raporlama:**
- Senior Frontend Developers'a raporlama
- Daily standup katılımı

---

## DevOps ve Altyapı

### DevOps Engineer - Monitoring Specialist
**İsim:** [Atanacak]  
**Unvan:** DevOps Engineer - Monitoring  
**Deneyim:** 4+ yıl DevOps, monitoring, Prometheus, Grafana

**Sorumluluklar:**
- İzleme sistemleri kurulumu
- Metrik toplama sistemleri
- Alert yönetimi
- Dashboard tasarımı

**Özel Görevleri:**
- Prometheus kurulumu ve yapılandırması
- Grafana dashboard tasarımı
- Alert kuralları tanımlama
- Metric collection setup

**Sprint Hedefleri:**
- Sprint 3: Monitoring altyapısı

**İşbirliği:**
- Backend developers ile metric implementation
- Frontend team ile dashboard requirements

---

### DevOps Engineer
**İsim:** [Atanacak]  
**Unvan:** DevOps Engineer  
**Deneyim:** 4+ yıl DevOps, CI/CD, Docker, Kubernetes

**Sorumluluklar:**
- CI/CD pipeline kurulumu
- Containerization (Docker)
- Deployment automation
- Infrastructure as Code

**Özel Görevleri:**
- Docker container yapılandırması
- CI/CD pipeline (GitHub Actions/Jenkins)
- Kubernetes deployment (opsiyonel)
- Environment management

**Sprint Hedefleri:**
- Sprint 1: Temel CI/CD
- Sprint 2: Deployment automation
- Sprint 3: Production readiness

**İşbirliği:**
- Tüm development teams ile deployment
- Monitoring team ile infrastructure metrics

---

## Test Ekibi

### QA Engineer - Test Automation Specialist
**İsim:** [Atanacak]  
**Unvan:** QA Engineer - Automation  
**Deneyim:** 4+ yıl QA, test automation, Cypress, API testing

**Sorumluluklar:**
- Test otomasyonu geliştirme
- E2E test suite
- Test framework geliştirme
- Test strategy

**Özel Görevleri:**
- Cypress E2E test suite
- API test automation
- Performance testing
- Load testing

**Sprint Hedefleri:**
- Sprint 1: Test framework
- Sprint 2: API ve integration testleri
- Sprint 3: E2E test suite

**İşbirliği:**
- Tüm development teams ile test senaryoları
- DevOps ile CI/CD test integration

---

### QA Engineer × 2
**İsim:** [Atanacak × 2]  
**Unvan:** QA Engineer  
**Deneyim:** 2-4 yıl QA, manuel test, test case yazma

**Sorumluluklar:**
- Manuel test execution
- Test case yazma
- Bug reportlama ve takip
- Regression testing
- Exploratory testing

**Özel Görev Dağılımı:**

**QA Engineer 1 - Functional Testing:**
- Feature testing
- Integration testing
- User acceptance testing

**QA Engineer 2 - Performance & Security:**
- Performance testing
- Security testing
- Load testing support

**Raporlama:**
- QA Lead'e raporlama
- Daily standup katılımı
- Bug tracking

---

## Dokümantasyon

### Technical Writer
**İsim:** [Atanacak]  
**Unvan:** Technical Writer  
**Deneyim:** 3+ yıl teknik yazarlık, developer documentation

**Sorumluluklar:**
- Kullanıcı dokümantasyonu
- API dokümantasyonu
- Geliştirici kılavuzları
- Deployment dokümantasyonu
- Troubleshooting kılavuzları

**Özel Görevleri:**
- User guide yazımı
- Developer guide yazımı
- API documentation
- Deployment guide
- Video tutorials (opsiyonel)

**Sprint Hedefleri:**
- Sprint 3: Tüm dokümantasyon

**İşbirliği:**
- Tüm development teams ile dokümantasyon gereksinimleri

---

## İletişim Matrisi

| Kişi/Unvan | Rapor Ettiği | İletişim Sıklığı | Toplantılar |
|------------|--------------|------------------|-------------|
| Proje Yöneticisi | Üst Yönetim | Günlük | Daily Standup, Weekly Review |
| Teknik Lider | Proje Yöneticisi | Günlük | Daily Standup, Architecture Review |
| Lead Backend Developer | Teknik Lider | Günlük | Daily Standup, Code Review |
| Lead Frontend Developer | Teknik Lider | Günlük | Daily Standup, Code Review |
| Senior Developers | İlgili Lead | Günlük | Daily Standup |
| Mid-Level Developers | İlgili Senior | Günlük | Daily Standup |
| QA Engineers | QA Lead | Günlük | Daily Standup, Test Review |
| DevOps Engineers | Teknik Lider | Haftalık | Weekly Infrastructure Review |
| Technical Writer | Teknik Lider | Haftalık | Weekly Documentation Review |

---

## Yetkilendirme Matrisi

| Aksiyon | PM | Tech Lead | Lead Dev | Senior Dev | Mid-Level Dev |
|---------|----|-----------|----------|------------|---------------|
| Teknik Karar | ✅ | ✅ | ✅ (Backend/Frontend) | - | - |
| Mimari Değişiklik | ✅ | ✅ | - | - | - |
| Kod Review Approval | - | ✅ | ✅ | ✅ | - |
| PR Merge | - | ✅ | ✅ | ✅ | - |
| Production Deploy | ✅ | ✅ | - | - | - |
| Sprint Planning | ✅ | ✅ | ✅ | - | - |
| Bug Priority | ✅ | ✅ | ✅ | - | - |

---

**Dokümantasyon Versiyonu:** 1.0  
**Son Güncelleme:** 2025-01-11