# EV Şarj İstasyonu Simülatörü - Proje Kadrosi ve Rol Tanımları
**Oluşturma Tarihi:** 01 Kasım 2025 - 15:00  
**Son Güncelleme:** 01 Kasım 2025 - 15:00  
**Versiyon:** 1.0  

---

## 📋 İçindekiler

1. [Organizasyon Yapısı](#organizasyon-yapısı)
2. [Yönetim Ekibi](#yönetim-ekibi)
3. [Geliştirme Ekipleri](#geliştirme-ekipleri)
4. [Destek Ekipleri](#destek-ekipleri)
5. [Rol Detayları](#rol-detayları)
6. [Karar Matrisi (RACI)](#karar-matrisi-raci)
7. [İletişim Planı](#iletişim-planı)

---

## 🏢 Organizasyon Yapısı

```
                        ┌─────────────┐
                        │     CTO     │
                        │  (Sponsor)  │
                        └──────┬──────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
         ┌──────▼──────┐ ┌────▼────┐ ┌───────▼──────┐
         │   Product   │ │ Project │ │VP Engineering│
         │   Owner     │ │ Manager │ │              │
         └─────────────┘ └────┬────┘ └──────┬───────┘
                              │              │
                ┌─────────────┼──────────────┼──────────────┐
                │             │              │              │
         ┌──────▼──────┐ ┌───▼────┐ ┌───────▼───┐ ┌────────▼────┐
         │  Technical  │ │  Scrum │ │   Tech    │ │   DevOps    │
         │  Architect  │ │ Master │ │   Lead    │ │    Lead     │
         └──────┬──────┘ └────────┘ └─────┬─────┘ └──────┬──────┘
                │                          │              │
    ┌───────────┼───────────┐             │              │
    │           │           │             │              │
┌───▼────┐ ┌───▼────┐ ┌───▼────┐    ┌───▼────────┬─────▼─────┬──────────┐
│Backend │ │Frontend│ │Protocol│    │ Backend    │ Frontend  │ DevOps   │
│ Team   │ │ Team   │ │  Team  │    │Developers  │Developers │Engineers │
└────────┘ └────────┘ └────────┘    └────────────┴───────────┴──────────┘
                │
         ┌──────┴──────┐
         │             │
    ┌────▼────┐   ┌────▼────┐
    │   QA    │   │Security │
    │  Team   │   │  Team   │
    └─────────┘   └─────────┘
```

---

## 👔 Yönetim Ekibi

### 1. CTO (Chief Technology Officer) - Proje Sponsoru
**İsim:** [Atanacak]  
**Rol Tipi:** Executive / Sponsor  
**Zaman Dilimi:** Proje boyunca (danışmanlık)

#### Sorumluluklar
- 🎯 Stratejik vizyon ve yön belirleme
- 💰 Bütçe onayı ve kaynak tahsisi
- 🚀 Proje başlatma ve onay
- 📊 Üst yönetime raporlama
- 🔑 Kritik kararlar için final approval

#### Yetkinlikler
- 15+ yıl teknoloji liderliği
- EV şarj altyapısı bilgisi
- Enterprise architecture deneyimi
- Stratejik planlama

#### Performans Kriterleri
- Proje zamanında teslim
- Bütçe hedeflerine uyum
- Teknik kalite standartları

---

### 2. Product Owner (PO)
**İsim:** [Kıdemli Ürün Yöneticisi - Atanacak]  
**Rol Tipi:** Product Management  
**Zaman Dilimi:** Full-time (12 hafta)

#### Sorumluluklar
- 📝 Product backlog yönetimi
- 🎯 User story'leri yazma ve priorizasyonu
- ✅ Sprint deliverables kabul kriteri belirleme
- 👥 Stakeholder yönetimi
- 🔄 Gereksinim değişiklik yönetimi
- 📊 Product vision ve roadmap
- 💼 ROI analizi ve business case

#### Günlük Aktiviteler
- Backlog refinement
- Sprint planning katılımı
- User story review
- Stakeholder meetings
- Sprint review ve demo

#### Yetkinlikler
- **Gerekli:**
  - 5+ yıl product management
  - Agile/Scrum methodology
  - EV charging domain knowledge
  - Stakeholder management
- **İstenen:**
  - OCPP protokol bilgisi
  - Technical background
  - CSPO (Certified Scrum Product Owner)

#### Performans KPI'ları
- Sprint acceptance rate: >90%
- Stakeholder satisfaction: >4.5/5
- Feature completion rate: >85%
- ROI targets met

#### Takım Etkileşimleri
- Daily: Scrum Master, Tech Lead
- Weekly: CTO, VP Engineering
- Sprint-based: Tüm development team

---

### 3. Project Manager (PM)
**İsim:** [Kıdemli Proje Yöneticisi - Atanacak]  
**Rol Tipi:** Project Management  
**Zaman Dilimi:** Full-time (12 hafta + 2 hafta closure)

#### Sorumluluklar
- 📅 Proje planı ve timeline yönetimi
- 📊 İlerleme takibi ve raporlama
- ⚠️ Risk ve issue management
- 💰 Bütçe takibi
- 🔗 Cross-team koordinasyonu
- 📈 Metrics ve KPI tracking
- 📝 Dökümentasyon yönetimi
- 🎯 Milestone tracking

#### Günlük Aktiviteler
- Daily standup facilitation
- Risk register güncelleme
- Progress dashboard güncelleme
- Blocker resolution
- Stakeholder communication

#### Haftalık Aktiviteler
- Sprint planning
- Retrospective facilitation
- Weekly status report
- Resource allocation review
- Budget variance analysis

#### Yetkinlikler
- **Gerekli:**
  - 7+ yıl project management
  - PMP veya PRINCE2 sertifikası
  - Agile project management
  - Risk management
  - Budgeting ve financial tracking
- **İstenen:**
  - Software development background
  - EV industry experience
  - Jira/Confluence expert

#### Araçlar
- **Project Management:** Jira, MS Project
- **Communication:** Slack, MS Teams
- **Documentation:** Confluence, Google Docs
- **Reporting:** Excel, PowerBI

#### Performans KPI'ları
- On-time delivery: 100%
- Budget variance: <5%
- Risk mitigation success: >80%
- Stakeholder satisfaction: >4.5/5

---

### 4. Scrum Master
**İsim:** [Sertifikalı Scrum Master - Atanacak]  
**Rol Tipi:** Agile Coach  
**Zaman Dilimi:** Full-time (12 hafta)

#### Sorumluluklar
- 🎯 Scrum process facilitation
- 🚧 Blocker removal
- 📚 Team coaching (Agile practices)
- 🔄 Continuous improvement
- 📊 Sprint metrics tracking
- 🤝 Team collaboration enhancement
- 🛡️ Team protection (interruptions)

#### Daily Scrum Facilitation
```
09:30 - Daily Standup (15 min)
- What I did yesterday
- What I'll do today
- Any blockers/impediments

Follow-up:
- Blocker resolution
- Team sync issues
- Parking lot items
```

#### Sprint Ceremonies
| Ceremony | Duration | Frequency | Participants |
|----------|----------|-----------|--------------|
| Sprint Planning | 4 hours | Bi-weekly | All team |
| Daily Standup | 15 min | Daily | Dev team |
| Sprint Review | 2 hours | Bi-weekly | All + stakeholders |
| Retrospective | 1.5 hours | Bi-weekly | Dev team |
| Backlog Refinement | 1 hour | Weekly | PO + Dev team |

#### Yetkinlikler
- **Gerekli:**
  - CSM (Certified Scrum Master)
  - 5+ yıl Scrum Master deneyimi
  - Agile coaching
  - Conflict resolution
  - Servant leadership
- **İstenen:**
  - PSM II (Professional Scrum Master)
  - SAFe experience
  - Technical background

#### Performans KPI'ları
- Sprint velocity stability: ±15%
- Team happiness: >4/5
- Sprint goals achieved: >85%
- Retrospective action items completed: >70%

---

## 💻 Geliştirme Ekipleri

### 🏗️ Architecture & Platform Team

#### 1. Technical Architect / Software Architect
**İsim:** [Kıdemli Yazılım Mimarı - Atanacak]  
**Rol Tipi:** Technical Leadership  
**Zaman Dilimi:** Full-time (12 hafta) + advisory (ongoing)  
**Seniorlik:** 10+ yıl deneyim

##### Sorumluluklar
- 🏛️ Sistem mimarisi tasarımı (High-level & Low-level)
- 🔧 Teknoloji stack seçimi ve standardizasyonu
- 📐 Design patterns ve best practices belirleme
- 🔍 Code review ve architecture governance
- 📚 Technical documentation ownership
- 🎓 Team mentoring ve knowledge transfer
- 🔗 Integration architecture
- 📈 Scalability planning

##### Teknik Sorumluluklar
```
┌─────────────────────────────────────────┐
│   Architecture Responsibilities         │
├─────────────────────────────────────────┤
│ • System Architecture Design            │
│ • Database Schema Design                │
│ • API Design & Standards                │
│ • Security Architecture                 │
│ • Performance Architecture              │
│ • Integration Patterns                  │
│ • DevOps Architecture                   │
│ • Monitoring Architecture               │
└─────────────────────────────────────────┘
```

##### Sprint 별 Odak
- **Sprint 1-2:** Core architecture, infrastructure design
- **Sprint 3-4:** Protocol architecture, simulator engine design
- **Sprint 5-6:** Scalability architecture, performance optimization

##### Yetkinlikler
- **Zorunlu:**
  - 10+ yıl software development
  - 5+ yıl architecture experience
  - Microservices architecture
  - Cloud architecture (AWS/Azure)
  - System design expertise
  - Node.js/JavaScript expert
- **İstenen:**
  - OCPP protokol bilgisi
  - EV charging systems
  - Real-time systems
  - Enterprise integration patterns

##### Performans KPI'ları
- Architecture documentation completeness: 100%
- Technical debt ratio: <10%
- System performance targets met: 100%
- Code review coverage: 100%

##### Aylık Ücret Aralığı
💰 **Senior Level:** $12,000 - $18,000/ay (Türkiye için ₺350,000 - ₺520,000)

---

### 🔧 Backend Development Team

#### Team Lead - Backend Lead Developer
**İsim:** [Kıdemli Backend Developer - Atanacak]  
**Rol Tipi:** Technical Lead + Developer  
**Zaman Dilimi:** Full-time (12 hafta)  
**Seniorlik:** 8+ yıl deneyim  
**Team Size:** 3 backend developers

##### Sorumluluklar
- 👨‍💼 Backend team coordination
- 🔧 Technical decision making
- 📝 Code review ownership
- 🎯 Sprint planning & estimation
- 🐛 Bug triage ve prioritization
- 🎓 Junior developer mentoring
- 🏗️ Backend architecture implementation
- 📊 Performance monitoring

##### Teknik Sorumluluklar
- Node.js/Express backend development
- REST API implementation
- WebSocket server development
- Database design & optimization
- Caching strategy (Redis)
- Background jobs (Bull queues)
- Authentication & Authorization
- API documentation

##### Sprint Görevleri Dağılımı
```
Sprint 1-2: Infrastructure & Core API
├─ REST API Endpoints
├─ Authentication System
├─ WebSocket Server
└─ Database Schema

Sprint 3-4: Simulator Engine
├─ Simulator Core Logic
├─ Station Manager
├─ Event System
└─ Power Calculation

Sprint 5-6: Integration & Optimization
├─ CSMS Integration
├─ Performance Optimization
├─ Monitoring Setup
└─ Production Readiness
```

##### Yetkinlikler
- **Zorunlu:**
  - 8+ yıl backend development
  - Node.js expert (3+ years)
  - Express.js, Socket.IO
  - MongoDB expert
  - Redis caching
  - RESTful API design
  - Microservices
- **İstenen:**
  - WebSocket expertise
  - Real-time systems
  - Queue systems (Bull, RabbitMQ)
  - Docker/Kubernetes

##### Performans KPI'ları
- Code quality: >8/10 (SonarQube)
- Sprint commitment: >90%
- Code review turnaround: <24h
- Bug resolution time: <48h

##### Aylık Ücret Aralığı
💰 **Senior Level:** $9,000 - $13,000/ay (₺260,000 - ₺380,000)

---

#### Backend Developer #1 - Core API Specialist
**İsim:** [Backend Developer - Atanacak]  
**Rol Tipi:** Developer  
**Seniorlik:** Mid-Senior (5-7 yıl)  
**Odak:** REST API, WebSocket

##### Ana Sorumluluklar
- REST API endpoint development
- WebSocket server enhancement
- API documentation (Swagger)
- Integration testing
- Performance optimization

##### Sprint 1-2 Görevleri
- [x] REST API Endpoints tamamlama
- [x] WebSocket Server güçlendirme
- [ ] API rate limiting
- [ ] Request validation middleware

##### Yetkinlikler
- Node.js/Express: Advanced
- WebSocket (Socket.IO): Advanced
- MongoDB: Intermediate
- Redis: Intermediate
- Testing (Jest, Supertest): Advanced

##### Aylık Ücret
💰 $6,500 - $9,000/ay (₺190,000 - ₺260,000)

---

#### Backend Developer #2 - Data & Cache Specialist
**İsim:** [Backend Developer - Atanacak]  
**Rol Tipi:** Developer  
**Seniorlik:** Mid-Senior (5-7 yıl)  
**Odak:** Database, Caching, Performance

##### Ana Sorumluluklar
- MongoDB schema design
- Redis caching implementation
- Database query optimization
- Data migration scripts
- Performance profiling

##### Sprint 1-2 Görevleri
- [x] Redis Cache Layer implementasyonu
- [ ] Database indexes optimization
- [ ] Query performance tuning
- [ ] Caching strategy implementation

##### Yetkinlikler
- MongoDB: Expert
- Redis: Advanced
- Database optimization: Advanced
- Data modeling: Advanced
- Performance tuning: Intermediate

##### Aylık Ücret
💰 $6,500 - $9,000/ay (₺190,000 - ₺260,000)

---

#### Backend Developer #3 - Integration Specialist
**İsim:** [Backend Developer - Atanacak]  
**Rol Tipi:** Developer  
**Seniorlik:** Mid (4-6 yıl)  
**Odak:** External integrations, Background jobs

##### Ana Sorumluluklar
- CSMS connection management
- Background job processing (Bull)
- Email service integration
- Third-party API integrations
- Error handling & retry logic

##### Sprint Görevleri
- Sprint 3-4: CSMS integration
- Sprint 3-4: Job queue setup
- Sprint 5-6: Email notifications
- Sprint 5-6: Monitoring integration

##### Yetkinlikler
- Node.js: Advanced
- API Integration: Advanced
- Bull/Queue systems: Intermediate
- Error handling: Advanced
- Third-party APIs: Advanced

##### Aylık Ücret
💰 $5,500 - $8,000/ay (₺160,000 - ₺230,000)

---

### 🔌 Protocol Development Team

#### OCPP Protocol Lead / OCPP Specialist #1
**İsim:** [Kıdemli OCPP Uzmanı - Atanacak]  
**Rol Tipi:** Domain Expert + Developer  
**Zaman Dilimi:** Full-time (Özellikle Sprint 3-4)  
**Seniorlik:** 6+ yıl (3+ yıl OCPP deneyimi)

##### Sorumluluklar
- 📡 OCPP protocol implementation lead
- 📋 OCPP 1.6J complete implementation
- 📋 OCPP 2.0.1 complete implementation
- 🔧 Protocol Factory development
- ✅ OCPP conformance testing
- 📚 OCPP technical documentation
- 🎓 Team OCPP training

##### Teknik Derinlik
```
OCPP 1.6J Expertise:
├─ Core Profile ✅
├─ Smart Charging Profile 🔄
├─ Firmware Management 📋
├─ Local Auth List 📋
└─ Remote Trigger 📋

OCPP 2.0.1 Expertise:
├─ Core Messages 📋
├─ Smart Charging 📋
├─ ISO 15118 Support 📋
├─ Device Management 📋
└─ Security 📋
```

##### Sprint 3 Görevleri (Detaylı)
```javascript
Week 1:
- [ ] OCPP 1.6J Core Profile (remaining messages)
- [ ] MeterValues implementation
- [ ] DataTransfer support

Week 2:
- [ ] OCPP 1.6J Smart Charging
- [ ] SetChargingProfile
- [ ] ClearChargingProfile
- [ ] GetCompositeSchedule
```

##### Yetkinlikler
- **Zorunlu:**
  - OCPP 1.6J expert
  - OCPP 2.0.1 advanced knowledge
  - WebSocket protocol
  - EV charging domain
  - Message queue systems
- **İstenen:**
  - ISO 15118 knowledge
  - IEC 61851 standard
  - CSMS experience
  - Certification experience

##### Performans KPI'ları
- OCPP 1.6J conformance: >95%
- OCPP 2.0.1 conformance: >90%
- Message processing time: <200ms
- Protocol switch success: 100%

##### Aylık Ücret Aralığı
💰 **Specialist:** $8,000 - $12,000/ay (₺230,000 - ₺350,000)
*(OCPP expertise premium)*

---

#### OCPP Specialist #2
**İsim:** [OCPP Developer - Atanacak]  
**Seniorlik:** Mid-Senior (4-6 yıl, 2+ yıl OCPP)  
**Odak:** OCPP 2.0.1, Advanced features

##### Ana Sorumluluklar
- OCPP 2.0.1 Core implementation
- Device Management
- Security features (certificates)
- Remote trigger support
- Protocol testing

##### Aylık Ücret
💰 $6,500 - $9,500/ay (₺190,000 - ₺275,000)

---

#### OCPP Specialist #3
**İsim:** [OCPP Developer - Atanacak]  
**Seniorlik:** Mid (3-5 yıl, 1+ yıl OCPP)  
**Odak:** ISO 15118, Advanced charging features

##### Ana Sorumluluklar
- ISO 15118 support
- Plug & Charge implementation
- Certificate management
- Advanced smart charging
- Load balancing algorithms

##### Aylık Ücret
💰 $6,000 - $8,500/ay (₺175,000 - ₺245,000)

---

### 🎮 Simulator Development Team

#### Simulator Architect / Simulation Lead
**İsim:** [Kıdemli Simülasyon Uzmanı - Atanacak]  
**Rol Tipi:** Technical Lead + Developer  
**Seniorlik:** 7+ yıl (3+ yıl simulation)  
**Zaman Dilimi:** Full-time (Özellikle Sprint 2-4)

##### Sorumluluklar
- 🎮 Simulator Engine architecture
- ⚡ Power delivery modeling
- 🔋 Energy calculation algorithms
- 🔌 Charging lifecycle state machine
- 🚗 Vehicle behavior simulation
- 📊 Physics-based calculations
- 🎯 Realistic scenario modeling

##### Teknik Uzmanlık
```
Simulation Domain:
├─ Electrical Engineering (Power, Voltage, Current)
├─ Battery Charging Physics
├─ State Machine Design
├─ Real-time Event Processing
├─ Time-series Data Generation
└─ Error Injection Modeling
```

##### Core Algorithms
```javascript
// Power Delivery Calculation
calculatePower(stationMax, vehicleMax, soc, temp, time)

// Energy Consumption
calculateEnergy(power, duration, efficiency, losses)

// Battery SOC
calculateSOC(initialSOC, energy, batteryCapacity)

// Charging Curve
getChargingCurve(soc, temperature, batteryHealth)

// Thermal Modeling
calculateTemperature(ambient, power, cooling, time)
```

##### Sprint 2 Deliverables
- [ ] Simulator Engine core
- [ ] Power calculation algorithms
- [ ] Energy metering
- [ ] State machine implementation
- [ ] Event emitter system

##### Yetkinlikler
- **Zorunlu:**
  - 7+ yıl software development
  - Electrical engineering background
  - State machine design
  - Real-time systems
  - Physics-based modeling
  - Algorithm design
- **İstenen:**
  - EV charging physics
  - Battery technology
  - Control systems
  - Digital twin experience

##### Performans KPI'ları
- Simulation accuracy: >95%
- Real-time performance: <50ms latency
- State transition correctness: 100%
- Physics model validation: Passed

##### Aylık Ücret Aralığı
💰 **Specialist:** $8,500 - $12,500/ay (₺245,000 - ₺360,000)

---

#### Simulation Developer #1
**İsim:** [Simulation Developer - Atanacak]  
**Seniorlik:** Mid-Senior (5-7 yıl)  
**Odak:** User interactions, cable simulation

##### Ana Sorumluluklar
- Cable plug/unplug simulation
- Authorization flow
- User interaction modeling
- Error injection system
- State transitions

##### Aylık Ücret
💰 $6,500 - $9,000/ay (₺190,000 - ₺260,000)

---

#### Simulation Developer #2
**İsim:** [Simulation Developer - Atanacak]  
**Seniorlik:** Mid-Senior (5-7 yıl)  
**Odak:** Charging session, power delivery

##### Ana Sorumluluklar
- Charging session lifecycle
- Power delivery calculation
- State machine implementation
- Transaction management
- Real-time data generation

##### Aylık Ücret
💰 $6,500 - $9,000/ay (₺190,000 - ₺260,000)

---

#### Simulation Developer #3
**İsim:** [Simulation Developer - Atanacak]  
**Seniorlik:** Mid (4-6 yıl)  
**Odak:** Meter values, energy calculations

##### Ana Sorumluluklar
- Meter values generation
- Energy consumption modeling
- Data sampling algorithms
- Time-series generation
- Measurement accuracy

##### Aylık Ücret
💰 $5,500 - $8,000/ay (₺160,000 - ₺230,000)

---

### 🎨 Frontend Development Team

#### Frontend Lead Developer
**İsim:** [Kıdemli Frontend Developer - Atanacak]  
**Rol Tipi:** Technical Lead + Developer  
**Seniorlik:** 7+ yıl frontend  
**Zaman Dilimi:** Full-time (Özellikle Sprint 5)

##### Sorumluluklar
- 🎨 Frontend architecture
- 📱 Component library design
- 🔄 State management (Redux)
- 🌐 Real-time updates (Socket.IO)
- 📊 Data visualization
- ♿ Accessibility (A11y)
- 📱 Responsive design
- 🎓 Frontend team mentoring

##### Teknik Stack
```
Core:
├─ React 18.x
├─ Redux Toolkit
├─ Material-UI (MUI)
├─ Socket.IO Client
└─ React Router

Visualization:
├─ Recharts
├─ D3.js (if needed)
└─ Real-time charts

Forms & Validation:
├─ Formik
├─ Yup
└─ React Hook Form

Testing:
├─ Jest
├─ React Testing Library
└─ Cypress
```

##### Sprint 5 Deliverables
- [ ] Dashboard layout
- [ ] Real-time station grid
- [ ] WebSocket integration
- [ ] State management setup
- [ ] Component library
- [ ] Responsive design

##### Yetkinlikler
- **Zorunlu:**
  - 7+ yıl frontend development
  - React expert (3+ years)
  - Redux/State management
  - Material-UI
  - WebSocket/Real-time
  - Responsive design
  - Performance optimization
- **İstenen:**
  - Data visualization
  - Accessibility expert
  - Design systems
  - Micro-frontends

##### Performans KPI'ları
- Page load time: <2s
- Component reusability: >70%
- Accessibility score: AA (WCAG 2.1)
- Code review turnaround: <24h

##### Aylık Ücret Aralığı
💰 **Senior:** $8,000 - $11,000/ay (₺230,000 - ₺320,000)

---

#### Frontend Developer #1 - Dashboard Specialist
**İsim:** [Frontend Developer - Atanacak]  
**Seniorlik:** Mid-Senior (5-7 yıl)  
**Odak:** Dashboard, Real-time updates

##### Ana Sorumluluklar
- Main dashboard implementation
- Real-time station grid
- WebSocket integration
- Analytics dashboard
- Performance optimization

##### Aylık Ücret
💰 $6,000 - $8,500/ay (₺175,000 - ₺245,000)

---

#### Frontend Developer #2 - Forms & Configuration
**İsim:** [Frontend Developer - Atanacak]  
**Seniorlik:** Mid-Senior (5-7 yıl)  
**Odak:** Station management, Configuration UI

##### Ana Sorumluluklar
- Station detail view
- Configuration panel
- Real-time charts (Recharts)
- Form validation
- CRUD operations

##### Aylık Ücret
💰 $6,000 - $8,500/ay (₺175,000 - ₺245,000)

---

#### Frontend Developer #3 - Scenario UI Specialist
**İsim:** [Frontend Developer - Atanacak]  
**Seniorlik:** Mid (4-6 yıl)  
**Odak:** Scenario builder, Monitoring

##### Ana Sorumluluklar
- Scenario builder UI
- Scenario execution monitor
- Visual scenario editor
- Test result visualization
- Responsive design

##### Aylık Ücret
💰 $5,500 - $7,500/ay (₺160,000 - ₺215,000)

---

### 🧪 Test & Quality Assurance Team

#### QA Lead / Test Architect
**İsim:** [Kıdemli QA Engineer - Atanacak]  
**Rol Tipi:** QA Leadership  
**Seniorlik:** 8+ yıl QA  
**Zaman Dilimi:** Full-time (12 hafta)

##### Sorumluluklar
- 📋 Test strategy & planning
- 🧪 Test framework setup
- 🤖 Test automation architecture
- 📊 Quality metrics & reporting
- 🎓 QA team mentoring
- ✅ Test coverage analysis
- 🐛 Bug lifecycle management

##### Test Strategy
```
Test Pyramid:
├─ Unit Tests (70%)
│  ├─ Backend: Jest
│  └─ Frontend: Jest + RTL
├─ Integration Tests (20%)
│  ├─ API: Supertest
│  └─ OCPP: Custom framework
└─ E2E Tests (10%)
   └─ Cypress

Additional Testing:
├─ Performance Testing (k6)
├─ Security Testing (OWASP ZAP)
├─ Load Testing (k6, Artillery)
└─ Conformance Testing (OCPP)
```

##### Quality Gates
```
Pre-Merge:
✓ Unit tests pass
✓ Code coverage > 70%
✓ Linter passed
✓ Code review approved

Pre-Deploy:
✓ Integration tests pass
✓ E2E tests pass
✓ Performance tests pass
✓ Security scan clean
```

##### Yetkinlikler
- **Zorunlu:**
  - 8+ yıl QA/Testing
  - Test automation expert
  - CI/CD integration
  - Performance testing
  - Security testing
  - Test strategy
- **İstenen:**
  - ISTQB Advanced/Expert
  - DevOps knowledge
  - OCPP testing experience

##### Performans KPI'ları
- Code coverage: >75%
- Bug escape rate: <5%
- Test automation coverage: >80%
- Regression test cycle: <4 hours

##### Aylık Ücret Aralığı
💰 **Senior:** $7,500 - $10,500/ay (₺215,000 - ₺305,000)

---

#### QA Engineer #1 - Backend Testing
**İsim:** [QA Engineer - Atanacak]  
**Seniorlik:** Mid-Senior (5-7 yıl)  
**Odak:** Backend, API, Integration testing

##### Ana Sorumluluklar
- Unit test yazımı (Jest)
- Integration test (Supertest)
- API testing
- Database testing
- Performance testing

##### Aylık Ücret
💰 $5,500 - $7,500/ay (₺160,000 - ₺215,000)

---

#### QA Engineer #2 - Frontend & E2E Testing
**İsim:** [QA Engineer - Atanacak]  
**Seniorlik:** Mid-Senior (5-7 yıl)  
**Odak:** Frontend, E2E, UI testing

##### Ana Sorumluluklar
- E2E testing (Cypress)
- UI component testing
- Accessibility testing
- Cross-browser testing
- Visual regression testing

##### Aylık Ücret
💰 $5,500 - $7,500/ay (₺160,000 - ₺215,000)

---

#### Test Automation Engineer #1
**İsim:** [Test Automation Engineer - Atanacak]  
**Seniorlik:** Mid-Senior (5-7 yıl)  
**Odak:** Scenario engine testing, Automation framework

##### Ana Sorumluluklar
- Scenario Engine core testing
- Scenario DSL parser testing
- Automated test execution framework
- CI/CD test integration
- Test reporting automation

##### Aylık Ücret
💰 $6,000 - $8,000/ay (₺175,000 - ₺230,000)

---

#### Test Automation Engineer #2
**İsim:** [Test Automation Engineer - Atanacak]  
**Seniorlik:** Mid (4-6 yıl)  
**Odak:** Scenario executor, Pre-built scenarios

##### Ana Sorumluluklar
- Scenario executor testing
- Pre-built scenario library development
- Scenario validation testing
- Load testing scenarios
- Performance scenario testing

##### Aylık Ücret
💰 $5,500 - $7,500/ay (₺160,000 - ₺215,000)

---

#### Test Automation Engineer #3
**İsim:** [Test Automation Engineer - Atanacak]  
**Seniorlik:** Mid (3-5 yıl)  
**Odak:** Scenario library, Analytics

##### Ana Sorumluluklar
- Pre-built scenario library expansion
- Scenario analytics testing
- Test result analysis
- Scenario debugging support
- Test data management

##### Aylık Ücret
💰 $5,000 - $7,000/ay (₺145,000 - ₺200,000)

---

#### Performance Engineer
**İsim:** [Performance Engineer - Atanacak]  
**Seniorlik:** Senior (6+ yıl)  
**Odak:** Load testing, Performance optimization

##### Sorumluluklar
- 📊 Performance testing (k6, Artillery)
- 🔥 Load testing (1000+ stations)
- 📈 Performance profiling
- ⚡ Optimization recommendations
- 📉 Performance monitoring setup
- 🎯 Performance KPI tracking

##### Araçlar
- k6 (load testing)
- Artillery (load testing)
- Clinic.js (Node.js profiling)
- Chrome DevTools (frontend profiling)
- New Relic / DataDog (APM)

##### Yetkinlikler
- Performance testing expert
- Load testing frameworks
- Application profiling
- Database optimization
- Caching strategies

##### Aylık Ücret
💰 $7,000 - $10,000/ay (₺200,000 - ₺290,000)

---

## 🔒 Destek Ekipleri

### Security Team

#### Security Engineer
**İsim:** [Security Engineer - Atanacak]  
**Seniorlik:** Senior (6+ yıl)  
**Zaman Dilimi:** Part-time (Sprint 1-2, Sprint 6)

##### Sorumluluklar
- 🔒 Security architecture review
- 🛡️ Authentication & authorization design
- 🔐 Encryption implementation
- 🕵️ Security audit
- 🚨 Vulnerability assessment
- 📋 Security documentation
- 🎓 Security training

##### Security Checklist Ownership
```
Application Security:
✓ JWT implementation review
✓ Password hashing (bcrypt)
✓ Input validation
✓ SQL injection prevention
✓ XSS protection
✓ CSRF protection

Network Security:
✓ HTTPS/TLS configuration
✓ Certificate management
✓ Firewall rules
✓ DDoS protection

Data Security:
✓ Encryption at rest
✓ Encryption in transit
✓ Backup security
✓ Access control
```

##### Yetkinlikler
- **Zorunlu:**
  - 6+ yıl security engineering
  - OWASP Top 10
  - Penetration testing
  - Security auditing
  - Encryption protocols
- **İstenen:**
  - CEH, OSCP sertifikaları
  - Cloud security
  - DevSecOps

##### Aylık Ücret
💰 $7,500 - $11,000/ay (₺215,000 - ₺320,000)

---

#### Security Consultant (External)
**İsim:** [Dış Güvenlik Danışmanı - Atanacak]  
**Rol Tipi:** External Consultant  
**Zaman Dilimi:** Sprint 6 (1 hafta)

##### Sorumluluklar
- Penetration testing
- Security audit (external perspective)
- Vulnerability assessment
- Security report & recommendations

##### Ücret
💰 $5,000 - $8,000 (Proje bazlı)

---

### DevOps Team

#### DevOps Lead / Senior DevOps Engineer
**İsim:** [Kıdemli DevOps Engineer - Atanacak]  
**Seniorlik:** Senior (7+ yıl)  
**Zaman Dilimi:** Full-time (12 hafta)

##### Sorumluluklar
- 🐳 Docker & containerization
- ☸️ Kubernetes orchestration (if needed)
- 🔄 CI/CD pipeline setup
- 📊 Monitoring & observability
- 📈 Infrastructure as Code (Terraform)
- 🔧 Build & deployment automation
- 💾 Backup & recovery strategy
- 🚀 Production deployment

##### Tech Stack
```
Containerization:
├─ Docker
├─ Docker Compose
└─ Container Registry

CI/CD:
├─ GitHub Actions
├─ Jenkins (alternative)
└─ GitLab CI (alternative)

Monitoring:
├─ Prometheus
├─ Grafana
├─ Winston (logging)
└─ ELK Stack (optional)

Infrastructure:
├─ Nginx (reverse proxy)
├─ MongoDB (database)
├─ Redis (cache)
└─ Cloud provider (AWS/Azure)
```

##### Sprint Deliverables
```
Sprint 1:
- Docker setup
- Docker Compose configuration
- Development environment
- CI pipeline basic

Sprint 6:
- Production deployment
- Monitoring dashboard
- Backup automation
- CD pipeline
- Health checks
```

##### Yetkinlikler
- **Zorunlu:**
  - 7+ yıl DevOps
  - Docker expert
  - CI/CD (GitHub Actions)
  - Monitoring (Prometheus/Grafana)
  - Linux administration
  - Cloud platforms (AWS/Azure)
- **İstenen:**
  - Kubernetes
  - Terraform/IaC
  - Security best practices

##### Performans KPI'ları
- Deployment success rate: >95%
- Deployment time: <15 min
- Uptime: >99.9%
- Monitoring coverage: 100%

##### Aylık Ücret
💰 $7,500 - $11,000/ay (₺215,000 - ₺320,000)

---

#### DevOps Engineer
**İsim:** [DevOps Engineer - Atanacak]  
**Seniorlik:** Mid-Senior (5-7 yıl)  
**Zaman Dilimi:** Full-time (Sprint 1, Sprint 6)

##### Ana Sorumluluklar
- Docker image optimization
- CI/CD maintenance
- Deployment scripts
- Infrastructure monitoring
- Log aggregation
- Backup automation

##### Aylık Ücret
💰 $6,000 - $8,500/ay (₺175,000 - ₺245,000)

---

### Database Team

#### Database Specialist
**İsim:** [Database Specialist - Atanacak]  
**Seniorlik:** Senior (6+ yıl)  
**Zaman Dilimi:** Part-time (Sprint 1, Sprint 6)

##### Sorumluluklar
- 🗄️ MongoDB schema design
- 📊 Index optimization
- ⚡ Query performance tuning
- 💾 Backup & recovery strategy
- 📈 Database monitoring
- 🔧 Data migration
- 🎯 Capacity planning

##### Yetkinlikler
- MongoDB expert (4+ years)
- Database design & modeling
- Index optimization
- Query performance tuning
- Replication & sharding
- Backup & recovery

##### Aylık Ücret (Part-time)
💰 $4,000 - $6,000/ay (₺115,000 - ₺175,000) - 50% allocation

---

### UX/UI Team

#### UX Designer
**İsim:** [UX Designer - Atanacak]  
**Seniorlik:** Mid-Senior (5+ yıl)  
**Zaman Dilimi:** Sprint 5 (2 hafta full-time)

##### Sorumluluklar
- 🎨 UI/UX design system
- 📱 Wireframes & mockups
- 🖌️ Visual design
- ♿ Accessibility design
- 📊 User research
- 🧪 Usability testing

##### Deliverables
- Design system
- Component library design
- Dashboard mockups
- User flows
- Accessibility guidelines

##### Aylık Ücret
💰 $5,500 - $8,000/ay (₺160,000 - ₺230,000)

---

### Documentation Team

#### Technical Writer
**İsim:** [Technical Writer - Atanacak]  
**Seniorlik:** Mid-Senior (4+ yıl)  
**Zaman Dilimi:** Part-time (tüm sprint'ler)

##### Sorumluluklar
- 📚 API documentation (Swagger)
- 📖 User manual
- 🔧 Administrator guide
- 📋 Deployment guide
- 🆘 Troubleshooting guide
- 📹 Video tutorials (scripts)

##### Deliverables
- API Reference
- User Manual (100+ pages)
- Admin Guide
- Deployment Guide
- FAQ Document

##### Aylık Ücret (Part-time)
💰 $3,500 - $5,000/ay (₺100,000 - ₺145,000) - 50% allocation

---

### Data Analytics

#### Data Analyst
**İsim:** [Data Analyst - Atanacak]  
**Seniorlik:** Mid (4+ yıl)  
**Zaman Dilimi:** Sprint 4-5 (part-time)

##### Sorumluluklar
- 📊 Scenario analytics design
- 📈 Performance metrics dashboard
- 🎯 KPI tracking
- 📉 Data visualization
- 📋 Reports & insights

##### Aylık Ücret (Part-time)
💰 $4,000 - $6,000/ay (₺115,000 - ₺175,000) - 50% allocation

---

## 📊 Ekip Özeti

### Tam Zamanlı Ekip (Core Team)

| Rol | Kişi Sayısı | Toplam |
|-----|-------------|---------|
| **Management** | | |
| Product Owner | 1 | 1 |
| Project Manager | 1 | 1 |
| Scrum Master | 1 | 1 |
| **Architecture** | | |
| Technical Architect | 1 | 1 |
| **Backend** | | |
| Backend Lead | 1 | 1 |
| Backend Developer | 3 | 3 |
| **Protocol** | | |
| OCPP Specialist | 3 | 3 |
| **Simulator** | | |
| Simulator Lead | 1 | 1 |
| Simulation Developer | 3 | 3 |
| **Frontend** | | |
| Frontend Lead | 1 | 1 |
| Frontend Developer | 3 | 3 |
| **QA** | | |
| QA Lead | 1 | 1 |
| QA Engineer | 2 | 2 |
| Test Automation Engineer | 3 | 3 |
| Performance Engineer | 1 | 1 |
| **DevOps** | | |
| DevOps Lead | 1 | 1 |
| DevOps Engineer | 1 | 1 |
| **TOPLAM** | | **29 kişi** |

### Part-time / Consultant Ekip

| Rol | Allocation |
|-----|------------|
| Security Engineer | 50% |
| Database Specialist | 50% |
| UX Designer | Sprint 5 only |
| Technical Writer | 50% |
| Data Analyst | 30% |
| Security Consultant | 1 week |

### Toplam Ekip Büyüklüğü
**Full-time:** 29 kişi  
**Part-time equivalent:** ~4 kişi  
**Toplam FTE:** ~33 kişi

---

## 💰 Bütçe Özeti (Aylık)

### Maliyet Tahmini (Türkiye Bazlı)

| Kategori | Kişi | Ortalama Maaş | Toplam/Ay |
|----------|------|---------------|-----------|
| **Management** | 3 | ₺250,000 | ₺750,000 |
| **Architecture** | 1 | ₺400,000 | ₺400,000 |
| **Backend** | 4 | ₺240,000 | ₺960,000 |
| **Protocol** | 3 | ₺280,000 | ₺840,000 |
| **Simulator** | 4 | ₺250,000 | ₺1,000,000 |
| **Frontend** | 4 | ₺230,000 | ₺920,000 |
| **QA & Testing** | 7 | ₺200,000 | ₺1,400,000 |
| **DevOps** | 2 | ₺240,000 | ₺480,000 |
| **Part-time** | ~4 | ₺140,000 | ₺560,000 |
| **TOPLAM** | | | **₺7,310,000/ay** |

### Proje Toplam Maliyet (3 Ay)
**Doğrudan Maliyetler:** ₺7,310,000 x 3 = **₺21,930,000**

**Dolaylı Maliyetler (+30%):**
- Ofis & infrastructure: ₺1,500,000
- Araç ve lisanslar: ₺800,000
- Eğitim ve sertifikalar: ₺500,000
- Contingency (risk reserve): ₺2,000,000
- **Toplam Dolaylı:** ₺4,800,000

**PROJE TOPLAM BÜTÇE:** ~₺26,730,000 (~$920,000 USD)

---

## 📋 RACI Matrix (Karar Matrisi)

### Ana Deliverable'lar için RACI

| Aktivite | CTO | PO | PM | Arch | Tech Lead | Dev Team | QA | DevOps |
|----------|-----|----|----|------|-----------|----------|----|----|
| **Requirements Definition** | A | R | C | C | C | I | I | I |
| **Architecture Design** | A | C | I | R | C | I | I | C |
| **Sprint Planning** | I | R | R | C | C | C | C | C |
| **Development** | I | C | I | C | R | R | C | C |
| **Code Review** | I | I | I | C | R | R | I | I |
| **Testing** | I | I | I | I | C | C | R | C |
| **Deployment** | A | I | C | C | C | I | C | R |
| **Production Support** | A | C | R | C | C | C | C | R |

**Legend:**
- **R**esponsible: İşi yapan
- **A**ccountable: Sorumlu (tek kişi)
- **C**onsulted: Danışılan
- **I**nformed: Bilgilendirilen

---

## 📞 İletişim Planı

### Günlük İletişim
```
09:30 - Daily Standup (15 min)
├─ Tüm development team
├─ Scrum Master (facilitator)
└─ Outputs: Today's plan, blockers

10:00 - Tech Sync (30 min, as needed)
├─ Technical Architect
├─ Tech Leads
└─ Topics: Technical decisions, architecture

14:00 - Blocker Resolution (ad-hoc)
├─ Relevant team members
└─ PM, Scrum Master
```

### Haftalık İletişim
```
Monday 14:00 - Sprint Planning (4h, bi-weekly)
├─ Product Owner (presenter)
├─ Development Team
├─ Scrum Master (facilitator)
└─ Outputs: Sprint backlog, commitment

Wednesday 10:00 - Backlog Refinement (1h)
├─ Product Owner
├─ Tech Lead
├─ Selected developers
└─ Outputs: Refined user stories

Friday 14:00 - Sprint Review (2h, bi-weekly)
├─ All team + stakeholders
├─ Product Owner (acceptance)
└─ Outputs: Demo, feedback

Friday 16:00 - Retrospective (1.5h, bi-weekly)
├─ Development Team
├─ Scrum Master (facilitator)
└─ Outputs: Action items

Friday 15:00 - Weekly Stakeholder Update
├─ CTO, VP Eng
├─ PM (presenter)
└─ Format: Progress, risks, plans
```

### Aylık İletişim
```
Last Friday - Monthly Review
├─ Executive team
├─ PM, PO (presenters)
└─ Format: Achievements, metrics, roadmap
```

### İletişim Kanalları

| Kanal | Kullanım | Yanıt Süresi |
|-------|----------|--------------|
| **Slack** | Daily communication | <2 hours |
| **Jira** | Task management | Daily check |
| **Confluence** | Documentation | Updated weekly |
| **Email** | Formal communication | <24 hours |
| **Video Call** | Meetings, Pair programming | Scheduled |
| **Emergency** | Phone | Immediate |

---

## 🎓 Eğitim ve Onboarding

### Onboarding Planı (İlk Hafta)

**Day 1: Welcome & Setup**
- Welcome meeting
- System access setup
- Tool setup (Jira, Slack, Git, etc.)
- Codebase tour

**Day 2: Domain Training**
- EV charging basics
- OCPP protocol overview
- Project vision & roadmap
- Architecture overview

**Day 3: Technical Deep Dive**
- Codebase structure
- Development workflow
- CI/CD pipeline
- Testing strategy

**Day 4: Team Integration**
- Team introductions
- Pair programming session
- First task assignment
- Q&A session

**Day 5: First Sprint**
- Sprint planning participation
- First commit
- Code review process
- Retrospective

---

## ✅ Sonuç

Bu doküman, EV Şarj İstasyonu Simülatörü projesinin tam ekip yapısını, rol tanımlarını, sorumlulukları ve bütçeyi detaylandırmaktadır.

### Önemli Notlar

1. **Ekip Büyüklüğü:** 29 full-time + 4 part-time FTE
2. **Proje Bütçesi:** ~₺27M (~$920K USD)
3. **Süre:** 12 hafta (3 ay)
4. **Metodoloji:** Agile/Scrum

### Kritik Başarı Faktörleri

✅ **Doğru Kişiler:** Her rol için senior/expert kişiler  
✅ **Net Sorumluluklar:** RACI matrix ile tanımlanmış  
✅ **İyi İletişim:** Günlük, haftalık, aylık ritüeller  
✅ **Agile Mindset:** Sprint-based, iterative development  
✅ **Quality Focus:** Dedicated QA team, test automation  
✅ **Domain Expertise:** OCPP specialists, simulator experts  

### İşe Alım Öncelikleri

**Acil (Hemen):**
1. Technical Architect
2. Backend Lead
3. OCPP Specialist #1
4. Simulator Architect
5. Project Manager
6. Product Owner

**Hafta 1-2:**
- Backend Developers (3)
- OCPP Specialists (2)
- Frontend Lead
- QA Lead
- DevOps Lead

**Hafta 3-4:**
- Simulation Developers (3)
- Frontend Developers (3)
- QA Engineers (2)
- Test Automation Engineers (3)

---

**Doküman Sahibi:** HR Director, CTO  
**Onay:** CEO, CFO  
**Dağıtım:** Hiring Team, Management  
**Sonraki Revizyon:** Hiring başladığında

---

**NOT:** Bu doküman hiring blueprint'idir. Gerçek kişiler atandıkça güncellenecektir.
