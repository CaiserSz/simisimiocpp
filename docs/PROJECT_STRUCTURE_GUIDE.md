# 📁 PROJE YAPISI REHBERİ
**Tarih**: 2025-01-11  
**Versiyon**: 2.0.0  
**Durum**: Standartlaştırılmış Yapı

---

## 🎯 GENEL BAKIŞ

Bu dokümantasyon, EV Charging Station Simulator projesinin standartlaştırılmış dosya yapısını ve isimlendirme kurallarını açıklar.

---

## 📂 PROJE YAPISI

```
server/
├── src/
│   ├── app.js                      # ✅ Ana uygulama dosyası (index.js'den değiştirildi)
│   ├── config/
│   │   ├── config.js               # Konfigürasyon yönetimi
│   │   └── swagger.js              # Swagger/OpenAPI dokümantasyon
│   ├── controllers/
│   │   ├── auth.controller.js      # Authentication controller
│   │   ├── dashboard.controller.js # Dashboard controller
│   │   └── simulator.controller.js # Simulator controller
│   ├── middleware/
│   │   ├── apiVersion.js           # ✅ API versioning (apiVersion.middleware.js'den)
│   │   ├── auth.js                 # ✅ Authentication (auth.middleware.js'den)
│   │   ├── cors.js                 # ✅ CORS (cors.middleware.js'den)
│   │   ├── metrics.js             # ✅ Metrics (metrics.middleware.js'den)
│   │   ├── request.js              # ✅ Request handling (request.middleware.js'den)
│   │   └── security.js            # ✅ Security (security.middleware.js'den)
│   ├── routes/
│   │   ├── auth.js                 # ✅ Auth routes (auth.routes.js'den)
│   │   ├── dashboard.js            # ✅ Dashboard routes (dashboard.routes.js'den)
│   │   ├── simulator.js            # ✅ Simulator routes (simulator.routes.js'den)
│   │   └── api/
│   │       └── index.js            # API route aggregator
│   ├── services/
│   │   ├── CacheManager.js         # Cache service
│   │   ├── SimpleUserStore.js      # User storage service
│   │   ├── WebSocketServer.js      # WebSocket service
│   │   └── ocpp/
│   │       └── MessageValidator.js # OCPP message validator
│   ├── simulator/
│   │   ├── NetworkSimulator.js     # Network simulation
│   │   ├── SimulationManager.js    # Simulation manager
│   │   ├── StationSimulator.js     # Station simulator
│   │   ├── VehicleSimulator.js     # Vehicle simulator
│   │   └── protocols/
│   │       ├── BaseOCPPSimulator.js # Base OCPP simulator
│   │       ├── OCPP16JSimulator.js # OCPP 1.6J implementation
│   │       └── OCPP201Simulator.js # OCPP 2.0.1 implementation
│   ├── utils/
│   │   ├── BackupManager.js        # Backup utilities
│   │   ├── database.js             # Database utilities
│   │   ├── errorHandler.js         # Error handling
│   │   ├── logger.js               # Logging utilities
│   │   ├── performance.js          # Performance utilities
│   │   └── sentry.js               # Sentry integration
│   ├── data/
│   │   └── users.json              # User data storage
│   ├── public/
│   │   └── index.html              # Public assets
│   └── __tests__/
│       ├── setup.js                # ✅ Test setup (setup.updated.js'den temizlendi)
│       ├── controllers/
│       │   └── auth.controller.test.js # ✅ Test dosyası (auth.controller.updated.test.js'den)
│       ├── services/
│       ├── simulator/
│       └── integration/
├── package.json                    # ✅ main: "src/app.js" güncellendi
└── .env.example
```

---

## 📝 İSİMLENDİRME STANDARTLARI

### 1. Ana Dosya
- **Önceki**: `src/index.js`
- **Şimdi**: `src/app.js` ✅
- **Neden**: `index.js` genelde modül entry point'i için kullanılır. Ana uygulama dosyası için `app.js` standarttır.

### 2. Route Dosyaları
- **Önceki**: `auth.routes.js`, `dashboard.routes.js`, `simulator.routes.js`
- **Şimdi**: `auth.js`, `dashboard.js`, `simulator.js` ✅
- **Neden**: `.routes.js` suffix'i gereksizdir. Dosyalar zaten `routes/` klasöründe olduğu için suffix'e gerek yoktur.

### 3. Middleware Dosyaları
- **Önceki**: `auth.middleware.js`, `cors.middleware.js`, vb.
- **Şimdi**: `auth.js`, `cors.js`, vb. ✅
- **Neden**: `.middleware.js` suffix'i gereksizdir. Dosyalar zaten `middleware/` klasöründe olduğu için suffix'e gerek yoktur.

### 4. Controller Dosyaları
- **Mevcut**: `auth.controller.js`, `dashboard.controller.js`, `simulator.controller.js`
- **Durum**: ✅ Tutarlı ve kabul edilebilir
- **Not**: PascalCase (`AuthController.js`) alternatifi olabilir ama mevcut format da standarttır.

### 5. Test Dosyaları
- **Önceki**: `setup.updated.js`, `auth.controller.updated.test.js`
- **Şimdi**: `setup.js`, `auth.controller.test.js` ✅
- **Neden**: `.updated` suffix'i karışıklık yaratıyordu. Hangi dosya aktif? Sorusu soruluyordu.

---

## 🔄 DEĞİŞİKLİKLER ÖZETİ

### Yeniden İsimlendirilen Dosyalar

1. **Ana Dosya**
   - `src/index.js` → `src/app.js`

2. **Route Dosyaları**
   - `routes/auth.routes.js` → `routes/auth.js`
   - `routes/dashboard.routes.js` → `routes/dashboard.js`
   - `routes/simulator.routes.js` → `routes/simulator.js`

3. **Middleware Dosyaları**
   - `middleware/apiVersion.middleware.js` → `middleware/apiVersion.js`
   - `middleware/auth.middleware.js` → `middleware/auth.js`
   - `middleware/cors.middleware.js` → `middleware/cors.js`
   - `middleware/metrics.middleware.js` → `middleware/metrics.js`
   - `middleware/request.middleware.js` → `middleware/request.js`
   - `middleware/security.middleware.js` → `middleware/security.js`

4. **Test Dosyaları**
   - `__tests__/setup.updated.js` → `__tests__/setup.js` (eski `setup.js` silindi)
   - `__tests__/controllers/auth.controller.updated.test.js` → `__tests__/controllers/auth.controller.test.js` (eski silindi)

### Güncellenen Dosyalar

1. **package.json**
   - `main`: `"src/index.js"` → `"src/app.js"`
   - `scripts.start`: `src/index.js` → `src/app.js`
   - `scripts.dev`: `src/index.js` → `src/app.js`
   - `jest.collectCoverageFrom`: `!src/index.js` → `!src/app.js`
   - `jest.setupFilesAfterEnv`: `setup.updated.js` → `setup.js`

2. **Import Path'leri**
   - Tüm dosyalarda middleware import'ları güncellendi
   - Tüm dosyalarda route import'ları güncellendi
   - Ana dosya import'ları güncellendi

---

## 📖 KULLANIM ÖRNEKLERİ

### Import Örnekleri

#### Middleware Import (Önceki)
```javascript
import { authenticate } from '../middleware/auth.middleware.js';
import { createCorsOptions } from './middleware/cors.middleware.js';
```

#### Middleware Import (Şimdi) ✅
```javascript
import { authenticate } from '../middleware/auth.js';
import { createCorsOptions } from './middleware/cors.js';
```

#### Route Import (Önceki)
```javascript
import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
```

#### Route Import (Şimdi) ✅
```javascript
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
```

#### Ana Dosya Import (Önceki)
```javascript
// package.json
"main": "src/index.js"
"start": "node src/index.js"
```

#### Ana Dosya Import (Şimdi) ✅
```javascript
// package.json
"main": "src/app.js"
"start": "node src/app.js"
```

---

## 🎯 FAYDALAR

### 1. Daha İyi Okunabilirlik
- ✅ Daha kısa ve temiz dosya isimleri
- ✅ Gereksiz suffix'ler kaldırıldı
- ✅ Standart Node.js/Express yapısına uygun

### 2. Daha Kolay Anlaşılabilirlik
- ✅ Yeni ekip üyeleri için daha kolay onboarding
- ✅ Standart yapı, tahmin edilebilir
- ✅ Industry best practices'e uygun

### 3. Daha Kolay Bakım
- ✅ Tutarlı isimlendirme
- ✅ Standart yapı, refactoring'i kolaylaştırır
- ✅ Dosya bulma daha kolay

### 4. Profesyonellik
- ✅ Enterprise-grade görünüm
- ✅ Industry standard'lara uygun
- ✅ Best practices uygulanmış

---

## ⚠️ DİKKAT EDİLMESİ GEREKENLER

### 1. Import Path'leri
- Tüm import path'leri güncellendi ✅
- Yeni dosya eklerken doğru path kullanın
- Relative path'ler (`../`, `../../`) doğru kullanılmalı

### 2. Package.json
- `main` field güncellendi ✅
- Script'ler güncellendi ✅
- Jest config güncellendi ✅

### 3. Dokümantasyon
- README.md dosyalarında path referansları kontrol edilmeli
- API dokümantasyonlarında örnekler güncellenmeli
- Kod örneklerinde import path'leri doğru olmalı

### 4. CI/CD
- Build script'lerinde path referansları kontrol edilmeli
- Deployment script'lerinde path referansları kontrol edilmeli

---

## 🚀 SONRAKI ADIMLAR (Opsiyonel)

### Faz 2: Organizasyon İyileştirmeleri
1. ⚠️ Service/Repository ayrımı yapılabilir
2. ⚠️ Test klasör yapısı organize edilebilir (unit/, integration/)

### Faz 3: İsimlendirme İyileştirmeleri
1. 💡 Controller isimlendirmesi PascalCase'e çevrilebilir
2. 💡 Service isimlendirmesi standartlaştırılabilir

---

## 📚 REFERANSLAR

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express.js Application Structure](https://expressjs.com/en/guide/routing.html)
- [JavaScript Naming Conventions](https://developer.mozilla.org/en-US/docs/MDN/Guidelines/Code_guidelines/JavaScript)

---

**Dokümantasyon Hazırlayan**: Senior Full-Stack & Architecture Expert  
**Tarih**: 2025-01-11  
**Versiyon**: 2.0.0

