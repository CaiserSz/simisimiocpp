# Şarj İstasyonu Simülatörü - Proje Kadrosu

**Oluşturulma Tarihi:** 2025-01-XX  
**Son Revizyon:** 2025-01-XX  
**Versiyon:** 1.0.0

---

## Organizasyon Şeması

```
┌─────────────────────────────────────────┐
│         Proje Müdürü (PM)               │
│     (Proje planlama ve koordinasyon)    │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌───────▼────────┐
│  Teknik Lider   │   │  Product Owner  │
│  (Tech Lead)    │   │  (Opsiyonel)    │
└───────┬────────┘   └─────────────────┘
        │
        ├──────────────┬──────────────┬──────────────┬──────────────┐
        │              │              │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐ ┌───▼──────┐
│ Backend Lead │ │ Frontend   │ │   QA Lead  │ │  DevOps    │ │  Tech    │
│              │ │ Lead       │ │            │ │ Engineer   │ │  Writer  │
└──────┬───────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └──────────┘
       │               │              │              │
       │               │              │              │
   [Ekip]          [Ekip]        [Ekip]        [Ekip]
```

---

## Proje Yönetimi Ekibi

### Proje Müdürü (Project Manager)
**Ünvan:** Proje Müdürü  
**Sorumluluklar:**
- Proje planlaması ve takibi
- Sprint yönetimi ve koordinasyonu
- Stakeholder iletişimi
- Risk yönetimi
- Kaynak planlaması
- Budget yönetimi

**Görevler:**
- Sprint planlama ve toplantıları
- Günlük stand-up toplantıları yönetimi
- Sprint review ve retrospective organizasyonu
- İlerleme raporlama
- Risk analizi ve mitigasyon planlaması

**Tecrübe Gereksinimleri:**
- 5+ yıl proje yönetimi deneyimi
- Agile/Scrum metodolojisi uzmanlığı
- Teknik proje yönetim deneyimi
- İletişim ve liderlik becerileri

---

### Teknik Lider (Technical Lead)
**Ünvan:** Teknik Lider / Proje Mimarı  
**Sorumluluklar:**
- Teknik mimari kararları
- Kod review süreçleri
- Teknik standartların belirlenmesi
- Teknik ekip yönetimi ve mentorluk
- Teknik risk değerlendirmesi

**Görevler:**
- Mimari tasarım kararları
- Kod kalite standartları belirleme
- Teknik dokümantasyon gözden geçirme
- Teknik mentorluk ve eğitim
- Teknik debt yönetimi

**Tecrübe Gereksinimleri:**
- 7+ yıl yazılım geliştirme deneyimi
- 3+ yıl teknik liderlik deneyimi
- Full-stack geliştirme bilgisi
- Mimari tasarım deneyimi
- Sistem tasarımı uzmanlığı

---

## Backend Geliştirme Ekibi

### Backend Lead Developer
**Ünvan:** Kıdemli Backend Geliştiricisi / Proje Mimarı  
**Sorumluluklar:**
- Backend mimarisinin tasarımı ve implementasyonu
- API tasarımı ve standartları
- Veritabanı tasarımı
- Backend ekibinin yönetimi
- Kod review ve teknik mentorluk

**Görevler:**
- Express.js API geliştirme
- MongoDB şema tasarımı
- Redis cache stratejisi
- Backend kod review
- Sprint 1, 3 sorumluluğu

**Sprint Görevleri:**
- Sprint 1: Temel altyapı kurulumu
- Sprint 3: Çoklu istasyon yönetimi

**Teknik Beceriler:**
- Node.js, Express.js
- MongoDB, Redis
- RESTful API design
- WebSocket, Socket.IO
- Docker, Docker Compose

**Tecrübe:** 5+ yıl backend geliştirme deneyimi

---

### OCPP Protokol Uzmanı
**Ünvan:** Kıdemli Backend Geliştiricisi / OCPP Uzmanı  
**Sorumluluklar:**
- OCPP protokol implementasyonu
- Protokol uyumluluğu ve compliance
- Protokol testleri ve doğrulama
- OCPP spesifikasyon uzmanlığı

**Görevler:**
- OCPP 1.6J handler implementasyonu
- OCPP 2.0.1 handler implementasyonu
- Protokol mesaj doğrulama
- Protokol spesifikasyon uyumluluğu
- Sprint 2, 5 sorumluluğu

**Sprint Görevleri:**
- Sprint 2: Protokol implementasyonu
- Sprint 5: İleri özellikler (OCPP profilleri)

**Teknik Beceriler:**
- OCPP protokol bilgisi (1.6J, 2.0.1)
- WebSocket protokolü
- Message routing ve validation
- Protocol testing ve compliance
- JSON-RPC

**Tecrübe:** 3+ yıl OCPP protokol deneyimi veya benzer protokol deneyimi

---

### Senaryo Motoru Geliştiricisi
**Ünvan:** Backend Geliştiricisi (Mid-Senior)  
**Sorumluluklar:**
- Senaryo motoru implementasyonu
- Senaryo yönetim API'leri
- Senaryo çalıştırma motoru
- Senaryo kayıt ve tekrar oynatma

**Görevler:**
- ScenarioEngine implementasyonu
- Senaryo modeli tasarımı
- Senaryo API endpoints
- Senaryo kayıt ve tekrar oynatma
- Sprint 4 sorumluluğu

**Sprint Görevleri:**
- Sprint 4: Senaryo motoru

**Teknik Beceriler:**
- Node.js
- Event-driven programming
- State machine design
- API development
- Queue systems

**Tecrübe:** 3+ yıl backend geliştirme deneyimi

---

### Backend Developer (Junior/Mid-level) - 2 Adet
**Ünvan:** Backend Geliştiricisi  
**Sorumluluklar:**
- Backend geliştirme görevleri
- Unit test yazımı
- Kod dokümantasyonu
- API endpoint implementasyonu

**Görevler:**
- API endpoint implementasyonu
- Service layer geliştirme
- Test yazımı
- Kod dokümantasyonu
- Bug fixing

**Teknik Beceriler:**
- Node.js, Express.js
- MongoDB
- Jest/Mocha
- RESTful API
- Git

**Tecrübe:** 1-3 yıl backend geliştirme deneyimi

---

## Frontend Geliştirme Ekibi

### Frontend Lead Developer
**Ünvan:** Kıdemli Frontend Geliştiricisi  
**Sorumluluklar:**
- Frontend mimarisinin tasarımı
- UI/UX koordinasyonu
- Frontend ekibinin yönetimi
- State management stratejisi
- Performance optimizasyonu

**Görevler:**
- React component mimarisi
- State management stratejisi (Redux/Context)
- WebSocket client implementasyonu
- Frontend kod review
- Sprint 6, 7 sorumluluğu

**Sprint Görevleri:**
- Sprint 6: Yönetim paneli
- Sprint 7: İzleme paneli

**Teknik Beceriler:**
- React 18+
- Material-UI
- Redux/Context API
- WebSocket client
- TypeScript
- Performance optimization

**Tecrübe:** 5+ yıl frontend geliştirme deneyimi

---

### UI/UX Designer
**Ünvan:** UI/UX Tasarımcısı  
**Sorumluluklar:**
- Kullanıcı arayüzü tasarımı
- Kullanıcı deneyimi optimizasyonu
- Tasarım sisteminin oluşturulması
- Kullanıcı araştırması

**Görevler:**
- Mockup ve wireframe tasarımı
- Component tasarımı
- Kullanıcı akışı tasarımı
- Tasarım sistem dokümantasyonu
- Sprint 6, 7 tasarım sorumluluğu

**Sprint Görevleri:**
- Sprint 6: Yönetim paneli tasarımı
- Sprint 7: İzleme paneli tasarımı

**Teknik Beceriler:**
- Figma/Sketch
- Design systems
- UX research
- Prototyping
- HTML/CSS

**Tecrübe:** 3+ yıl UI/UX tasarım deneyimi

---

### Frontend Developer (Senior)
**Ünvan:** Kıdemli Frontend Geliştiricisi  
**Sorumluluklar:**
- Kompleks component geliştirme
- State management implementasyonu
- Performance optimizasyonu
- Real-time data visualization

**Görevler:**
- Dashboard component geliştirme
- Real-time data visualization
- Performance optimizasyonu
- Frontend test yazımı
- Advanced React patterns

**Teknik Beceriler:**
- React hooks
- Chart.js/Recharts/D3.js
- WebSocket
- Performance optimization
- TypeScript

**Tecrübe:** 4+ yıl frontend geliştirme deneyimi

---

### Frontend Developer (Junior/Mid-level) - 2 Adet
**Ünvan:** Frontend Geliştiricisi  
**Sorumluluklar:**
- Component geliştirme
- UI implementasyonu
- Test yazımı
- Responsive tasarım

**Görevler:**
- Form component geliştirme
- List/table component geliştirme
- UI test yazımı
- Kod dokümantasyonu
- Bug fixing

**Teknik Beceriler:**
- React
- Material-UI
- Jest/React Testing Library
- HTML/CSS
- Git

**Tecrübe:** 1-3 yıl frontend geliştirme deneyimi

---

## Test ve Kalite Güvencesi Ekibi

### QA Lead
**Ünvan:** QA Lideri  
**Sorumluluklar:**
- Test stratejisi oluşturma
- Test planlaması
- Test ekibinin yönetimi
- Quality assurance süreçleri

**Görevler:**
- Test planı oluşturma
- Test senaryoları yazma
- Test automation stratejisi
- Bug tracking ve yönetimi
- Sprint 8 sorumluluğu

**Sprint Görevleri:**
- Sprint 8: Test ve kalite güvencesi

**Teknik Beceriler:**
- Test planning
- Test automation
- QA processes
- Bug tracking tools (Jira)
- Test methodologies

**Tecrübe:** 5+ yıl QA deneyimi, 2+ yıl QA liderlik deneyimi

---

### Test Automation Engineer
**Ünvan:** Test Otomasyon Mühendisi  
**Sorumluluklar:**
- Otomatik test geliştirme
- Test framework kurulumu
- CI/CD test entegrasyonu
- Test coverage analizi

**Görevler:**
- E2E test yazımı (Cypress)
- API test yazımı
- Integration test yazımı
- Test automation pipeline
- Performance testing

**Teknik Beceriler:**
- Cypress
- Jest/Mocha
- API testing (Supertest)
- CI/CD
- Load testing (Artillery, k6)

**Tecrübe:** 3+ yıl test automation deneyimi

---

### Manual QA Tester - 2 Adet
**Ünvan:** Manuel Test Uzmanı  
**Sorumluluklar:**
- Manuel testler
- Exploratory testing
- Regression testing
- User acceptance testing

**Görevler:**
- Test case execution
- Bug reporting
- Exploratory testing
- User acceptance testing
- Test documentation

**Teknik Beceriler:**
- Manual testing
- Bug tracking
- Test case writing
- OCPP knowledge (tercihen)
- Testing tools

**Tecrübe:** 2+ yıl QA deneyimi

---

## DevOps ve Altyapı Ekibi

### DevOps Engineer
**Ünvan:** DevOps Mühendisi  
**Sorumluluklar:**
- CI/CD pipeline kurulumu
- Containerization
- Deployment otomasyonu
- Monitoring ve logging
- Infrastructure as Code

**Görevler:**
- Docker/Docker Compose yapılandırması
- CI/CD pipeline kurulumu (GitHub Actions)
- Monitoring ve logging kurulumu (Prometheus, Grafana)
- Deployment otomasyonu
- Infrastructure management
- Sprint 1, 9 DevOps sorumluluğu

**Sprint Görevleri:**
- Sprint 1: CI/CD ve Docker kurulumu
- Sprint 9: Deployment dokümantasyonu

**Teknik Beceriler:**
- Docker, Docker Compose
- Kubernetes (opsiyonel)
- CI/CD (GitHub Actions/Jenkins)
- Monitoring (Prometheus, Grafana)
- Infrastructure as Code
- Linux system administration

**Tecrübe:** 3+ yıl DevOps deneyimi

---

## Dokümantasyon ve Teknik Yazım

### Teknik Dokümantasyon Uzmanı
**Ünvan:** Teknik Yazı Uzmanı  
**Sorumluluklar:**
- Teknik dokümantasyon yazımı
- API dokümantasyonu
- Kullanıcı kılavuzu
- Geliştirici dokümantasyonu

**Görevler:**
- API dokümantasyonu (Swagger/OpenAPI)
- Geliştirici dokümantasyonu
- Kullanıcı kılavuzu
- Mimari dokümantasyonu
- Sprint 9 dokümantasyon sorumluluğu

**Sprint Görevleri:**
- Sprint 9: Optimizasyon ve dokümantasyon

**Teknik Beceriler:**
- Technical writing
- API documentation tools (Swagger)
- Markdown
- OpenAPI/Swagger
- Documentation tools (Confluence, Wiki)

**Tecrübe:** 2+ yıl teknik yazım deneyimi

---

## Ekip Organizasyonu ve İletişim

### Takım Yapısı

**Backend Takımı (5 kişi):**
- Backend Lead Developer (1)
- OCPP Protokol Uzmanı (1)
- Senaryo Motoru Geliştiricisi (1)
- Backend Developer (2)

**Frontend Takımı (5 kişi):**
- Frontend Lead Developer (1)
- UI/UX Designer (1)
- Frontend Developer Senior (1)
- Frontend Developer (2)

**QA Takımı (4 kişi):**
- QA Lead (1)
- Test Automation Engineer (1)
- Manual QA Tester (2)

**DevOps ve Altyapı (1 kişi):**
- DevOps Engineer (1)

**Dokümantasyon (1 kişi):**
- Teknik Dokümantasyon Uzmanı (1)

**Toplam Ekip:** 16 kişi + Proje Yönetimi (2 kişi) = **18 kişi**

---

### İletişim Kanalları

#### Günlük İletişim
- **Günlük Stand-up:** Her gün sabah 09:00 (15 dakika)
- **Slack/Teams:** Günlük iletişim kanalı
- **Code Review:** GitHub Pull Requests

#### Haftalık İletişim
- **Teknik Toplantı:** Haftalık (1 saat)
- **Backend Sync:** Haftalık (30 dakika)
- **Frontend Sync:** Haftalık (30 dakika)
- **QA Sync:** Haftalık (30 dakika)

#### Sprint İletişimi
- **Sprint Planning:** Sprint başında (2 saat)
- **Sprint Review:** Sprint sonunda (1 saat)
- **Retrospective:** Sprint sonunda (1 saat)

---

## Görev Atama ve Sorumluluk Matrisi

| Görev Kategorisi | Sorumlu | Katılımcılar |
|------------------|---------|--------------|
| Mimari Tasarım | Teknik Lider | Backend Lead, Frontend Lead |
| Backend Geliştirme | Backend Lead | Backend Team |
| OCPP Protokol | OCPP Protokol Uzmanı | Backend Lead |
| Senaryo Motoru | Senaryo Motoru Dev | Backend Lead |
| Frontend Geliştirme | Frontend Lead | Frontend Team |
| UI/UX Tasarım | UI/UX Designer | Frontend Lead |
| Test Stratejisi | QA Lead | Tüm ekip |
| Test Automation | Test Automation Engineer | QA Lead |
| DevOps | DevOps Engineer | Backend Lead |
| Dokümantasyon | Teknik Dokümantasyon Uzmanı | Teknik Lider |

---

## Ekip Geliştirme ve Mentorluk

### Mentorluk Programı
- Teknik Lider → Backend/Frontend Lead'ler
- Backend Lead → Backend Developer'lar
- Frontend Lead → Frontend Developer'lar
- QA Lead → QA Tester'lar

### Eğitim ve Gelişim
- OCPP protokol eğitimi (OCPP Protokol Uzmanı)
- React best practices (Frontend Lead)
- Node.js best practices (Backend Lead)
- Test automation eğitimi (Test Automation Engineer)

---

## Ekip Üyeleri ve Roller Özeti

| Ünvan | Sayı | Sprint Sorumlulukları |
|-------|------|----------------------|
| Proje Müdürü | 1 | Tüm sprintler |
| Teknik Lider | 1 | Tüm sprintler |
| Backend Lead | 1 | Sprint 1, 3 |
| OCPP Protokol Uzmanı | 1 | Sprint 2, 5 |
| Senaryo Motoru Dev | 1 | Sprint 4 |
| Backend Developer | 2 | Tüm sprintler |
| Frontend Lead | 1 | Sprint 6, 7 |
| UI/UX Designer | 1 | Sprint 6, 7 |
| Frontend Developer Senior | 1 | Sprint 6, 7 |
| Frontend Developer | 2 | Sprint 6, 7 |
| QA Lead | 1 | Sprint 8 |
| Test Automation Engineer | 1 | Sprint 8 |
| Manual QA Tester | 2 | Sprint 8 |
| DevOps Engineer | 1 | Sprint 1, 9 |
| Teknik Dokümantasyon Uzmanı | 1 | Sprint 9 |

---

**Dokümantasyon Versiyonu:** 1.0.0  
**Son Güncelleme:** 2025-01-XX  
**Hazırlayan:** Proje Yönetimi Ekibi
