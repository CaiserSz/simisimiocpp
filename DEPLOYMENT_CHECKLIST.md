# Deployment Checklist - Server Kurulum

**Tarih:** 2025-11-09  
**Durum:** 🟡 **HAZIRLIK GEREKLİ**

---

## ⚠️ MEVCUT DURUM

### GitHub'dan Kurulabilir Mi? 🟡 **KISMEN**

**Çalışan:**
- ✅ Kod GitHub'da
- ✅ Dependencies tanımlı
- ✅ Docker Compose var
- ✅ Documentation mevcut

**Çalışmayan/Eksik:**
- ❌ Syntax hataları olabilir
- ❌ Environment variables eksik
- ❌ Mock CSMS otomatik başlamıyor
- ❌ Production test edilmedi
- ❌ Real-world scenario test edilmedi

---

## ✅ SUNUCUYA KURULUM ADIMLARI

### Seçenek 1: Docker Compose (ÖNERİLEN)

```bash
# 1. Repo'yu klonla
git clone https://github.com/CaiserSz/simisimiocpp.git
cd simisimiocpp/simisimiocpp

# 2. Environment dosyasını oluştur
cd server
cp .env.example .env
# .env'i düzenle (JWT_SECRET, vb.)

# 3. Docker Compose ile başlat
cd ..
docker-compose up -d

# 4. Kontrol et
curl http://localhost:3001/health
```

**Beklenen:**
- Simulator: http://localhost:3001
- Dashboard: http://localhost:3001/dashboard
- Mock CSMS: ws://localhost:9220
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3002

### Seçenek 2: Manuel Kurulum

```bash
# 1. Repo'yu klonla
git clone https://github.com/CaiserSz/simisimiocpp.git
cd simisimiocpp/simisimiocpp/server

# 2. Node.js version check
node --version  # 20+ olmalı

# 3. Dependencies install
npm install

# 4. Environment dosyası
cp .env.example .env
nano .env  # Düzenle

# 5. Server'ı başlat
npm start
```

---

## 🔧 KURULUMDAN ÖNCE YAPILMASİ GEREKENLER

### 1. Syntax Hatalarını Temizle (KRİTİK)

```bash
# Tüm optional chaining hatalarını düzelt
cd server
find src -name "*.js" -type f -exec sed -i '' 's/? \./?./g' {} \;
find src -name "*.js" -type f -exec sed -i '' 's/ \. ?/?./g' {} \;

# Syntax check
find src -name "*.js" -type f -exec node --check {} \; 2>&1 | grep -i "error"
```

### 2. .env.example Dosyasını Tamamla

```bash
# server/.env.example oluştur (eğer yoksa)
cat > server/.env.example << 'EOF'
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
STORAGE_TYPE=json
DATA_DIR=./src/data
JWT_SECRET=CHANGE_THIS_TO_SECURE_64_CHARACTER_SECRET
CSMS_URL=ws://mock-csms:9220
LOG_LEVEL=info
ENABLE_AUTH=false
EOF
```

### 3. Pre-deployment Test Script

```bash
# scripts/pre-deployment-check.sh
#!/bin/bash

echo "=== Pre-Deployment Checks ==="

# Syntax check
echo "1. Checking syntax..."
find server/src -name "*.js" -exec node --check {} \; || exit 1

# Dependencies check
echo "2. Checking dependencies..."
cd server && npm ci || exit 1

# Environment check
echo "3. Checking environment..."
test -f .env || (echo "❌ .env missing" && exit 1)

# Health check
echo "4. Starting server..."
npm start &
SERVER_PID=$!
sleep 10

curl -f http://localhost:3001/health || (kill $SERVER_PID && exit 1)
curl -f http://localhost:3001/dashboard || (kill $SERVER_PID && exit 1)

kill $SERVER_PID
echo "✅ All pre-deployment checks passed"
```

---

## 📦 DEPLOYMENT PACKAGE HAZIRLAMA

### 1. Clean Build

```bash
cd server

# Remove development files
rm -rf node_modules
rm -rf .jest-cache
rm -rf coverage
rm -rf logs/*

# Clean install
npm ci --production

# Verify
npm start
```

### 2. Docker Image Build

```bash
docker build -t ev-simulator:latest .
docker run -d -p 3001:3001 --name ev-sim ev-simulator:latest

# Test
docker logs ev-sim
curl http://localhost:3001/health
```

---

## ⚠️ BİLİNEN SORUNLAR VE ÇÖZÜMLERİ

### 1. CSMS Connection Refused

**Sorun:** Station oluşturulunca CSMS'e bağlanamıyor

**Çözüm:** Mock CSMS'i başlat

```bash
# Terminal 1: Mock CSMS
cd server
npm run mock:csms

# Terminal 2: Server
npm start
```

### 2. Syntax Errors

**Sorun:** `? .` syntax hataları

**Çözüm:** Yukarıdaki sed komutlarını çalıştır

### 3. Authentication/CSRF Sorunları

**Sorun:** Dashboard çalışmıyor

**Çözüm:** Development modunda zaten disabled ama .env'de kontrol et:
```env
NODE_ENV=development
```

---

## ✅ PRODUCTION-READY YAPILMASI GEREKENLER

### Kritik (Şimdi)

- [ ] Tüm syntax hatalarını düzelt ve test et
- [ ] Pre-deployment check script ekle
- [ ] Docker build test et
- [ ] .env.example tamamla
- [ ] Mock CSMS otomatik başlat

### Yüksek (1 Hafta)

- [ ] Production build test et
- [ ] Load testing
- [ ] Security audit
- [ ] Monitoring validation
- [ ] Real CSMS ile test et

### Orta (1 Ay)

- [ ] CI/CD pipeline test et
- [ ] Staging environment kur
- [ ] Documentation accuracy check
- [ ] Performance benchmarking

---

## 🎯 ÖNERİM

### Şimdi Yapılması Gerekenler:

**1. Syntax temizliği (1 saat)**
```bash
cd /Users/bsrmba/simisimocpp/simisimiocpp
find server/src -name "*.js" -exec sed -i '' 's/? \./?./g' {} \;
git add -A && git commit -m "fix: Tüm syntax hataları temizlendi" && git push
```

**2. Smoke test (30 dakika)**
```bash
# scripts/smoke-test.sh oluştur
# Test et ve commit et
```

**3. Docker test (30 dakika)**
```bash
docker-compose up -d
# Test et
docker-compose down
```

**Toplam:** ~2 saat

---

## ✅ SONUÇ

**Şu anda kurulabilir mi?** 🟡 **KISMEN**

**Yapılması gerekenler:**
1. Syntax temizliği (1 saat)
2. Smoke test (30 dakika)  
3. Docker test (30 dakika)

**Toplam:** ~2 saat sonra **production-ready** olur.

---

**Hazırlayan:** Gerçekçi Değerlendirme  
**Tarih:** 2025-11-09

