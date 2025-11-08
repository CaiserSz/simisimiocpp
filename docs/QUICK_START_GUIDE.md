# Quick Start Guide

**Tarih:** 2025-01-11  
**Versiyon:** 1.0.0

---

## 🚀 5 Dakikada Başlangıç

### 1. Repository'yi Klonlayın

```bash
git clone <repository-url>
cd simisimiocpp
```

### 2. Environment Dosyasını Oluşturun

```bash
cd server
cp .env.example .env
```

`.env` dosyasını düzenleyin ve en azından şunları ayarlayın:

```env
JWT_SECRET=your_super_secure_secret_key_minimum_32_characters
CSMS_URL=ws://localhost:9220
```

### 3. Bağımlılıkları Yükleyin

```bash
npm install
```

### 4. Mock CSMS'i Başlatın (Ayrı Terminal)

```bash
npm run mock:csms
```

### 5. Simulator'ü Başlatın

```bash
npm start
```

Server `http://localhost:3001` adresinde çalışacak.

### 6. İlk İstasyonu Oluşturun

```bash
# Admin kullanıcı oluştur
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "name": "Administrator",
    "role": "admin"
  }'

# Login ve token al
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!"
  }' | jq -r '.data.token')

# İlk istasyonu oluştur
curl -X POST http://localhost:3001/api/simulator/stations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "TEST_001",
    "vendor": "TestVendor",
    "model": "TestModel",
    "ocppVersion": "1.6J",
    "connectorCount": 2,
    "maxPower": 22000,
    "csmsUrl": "ws://localhost:9220"
  }'
```

### 7. Dashboard'a Erişin

Tarayıcınızda `http://localhost:3001/dashboard` adresine gidin.

---

## 🐳 Docker ile Hızlı Başlangıç

### Tüm Servisleri Başlatın

```bash
docker compose up -d
```

Bu komut şunları başlatır:
- ✅ Simulator API (port 3001)
- ✅ Mock CSMS (port 9220)
- ✅ Redis (port 6379)
- ✅ Prometheus (port 9090)
- ✅ Grafana (port 3002)

### Servisleri Kontrol Edin

```bash
# Simulator health check
curl http://localhost:3001/health

# Mock CSMS state
curl http://localhost:9320/mock/state

# Prometheus metrics
curl http://localhost:9090/metrics

# Grafana dashboard
open http://localhost:3002
# Default credentials: admin / grafana123
```

---

## 🧪 Testleri Çalıştırın

### Tüm Testler

```bash
npm test
```

### Hızlı Testler (Compliance + Unit)

```bash
npm run test:quick
```

### Compliance Testleri

```bash
npm run test:compliance
```

### Integration Testleri (Mock CSMS)

```bash
npm run test:integration:mock
```

---

## 📊 Monitoring Kurulumu

### Prometheus

Prometheus otomatik olarak `http://localhost:3001/metrics` adresinden metrikleri toplar.

### Grafana Dashboard

1. Grafana'ya giriş yapın: `http://localhost:3002`
2. Dashboard'u import edin: `monitoring/grafana/dashboards/simulator-overview-enhanced.json`
3. Prometheus data source'u yapılandırın

---

## 🔧 Yaygın Sorunlar

### Port Zaten Kullanımda

```bash
# Port'u kontrol edin
lsof -i :3001

# Process'i sonlandırın
kill -9 <PID>
```

### Mock CSMS Bağlantı Hatası

```bash
# Mock CSMS'in çalıştığını kontrol edin
curl http://localhost:9320/mock/state

# Mock CSMS'i yeniden başlatın
npm run mock:csms
```

### Redis Bağlantı Hatası

Redis opsiyoneldir. Eğer Redis kullanmıyorsanız, `.env` dosyasından `REDIS_URL` satırını kaldırın veya yorumlayın.

---

## 📚 Sonraki Adımlar

- [Production Deployment Runbook](PRODUCTION_DEPLOYMENT_RUNBOOK.md) - Production deployment rehberi
- [CSMS Connection Requirements](CSMS_CONNECTION_REQUIREMENTS.md) - CSMS bağlantı gereksinimleri
- [API Documentation](API.md) - API referansı
- [Simulator Guide](SIMULATOR_GUIDE.md) - Detaylı kullanım rehberi

---

**Hazır! Simulator'ünüz çalışıyor. 🎉**

