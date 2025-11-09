# Deployment Guide - Server Kurulum Rehberi

**Tarih:** 2025-11-09  
**Hedef:** Production Server'a Kurulum

---

## 📋 ÖN ŞARTLAR

### Sunucu Gereksinimleri

- **OS:** Ubuntu 20.04+ / CentOS 8+ / macOS
- **Node.js:** 20.0.0+
- **RAM:** Minimum 2GB, Önerilen 4GB
- **Disk:** Minimum 5GB
- **Port:** 3001 (API), 9220 (Mock CSMS), 9090 (Prometheus), 3002 (Grafana)

### Opsiyonel

- **Docker:** 20.10+
- **Docker Compose:** 2.0+
- **Redis:** 7.0+ (caching için)

---

## 🚀 HIZLI KURULUM (Docker Compose)

### 1. Repo'yu Klonla

```bash
git clone https://github.com/CaiserSz/simisimiocpp.git
cd simisimiocpp/simisimiocpp
```

### 2. Environment Dosyası

```bash
# .env dosyası oluştur
cat > .env << 'EOF'
NODE_ENV=production
JWT_SECRET=$(openssl rand -hex 32)
PORT=3001
GRAFANA_USER=admin
GRAFANA_PASSWORD=$(openssl rand -hex 16)
EOF
```

### 3. Syntax Düzeltmesi (KRİTİK)

```bash
chmod +x scripts/fix-all-syntax.sh
./scripts/fix-all-syntax.sh
```

### 4. Docker Compose ile Başlat

```bash
docker-compose up -d
```

### 5. Doğrulama

```bash
# Health check
curl http://localhost:3001/health

# Dashboard
open http://localhost:3001/dashboard

# Grafana
open http://localhost:3002
# Giriş: admin / (yukarıda oluşturulan password)
```

---

## 📝 MANUEL KURULUM

### 1. Sistem Hazırlığı

```bash
# Node.js 20 kur (Ubuntu)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Git kur
sudo apt-get install -y git
```

### 2. Repo ve Dependencies

```bash
# Klonla
git clone https://github.com/CaiserSz/simisimiocpp.git
cd simisimiocpp/simisimiocpp/server

# Syntax düzelt
cd ..
chmod +x scripts/fix-all-syntax.sh
./scripts/fix-all-syntax.sh

# Dependencies
cd server
npm ci --production
```

### 3. Environment Configuration

```bash
# .env oluştur
cat > .env << 'EOF'
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
STORAGE_TYPE=json
DATA_DIR=./src/data
JWT_SECRET=REPLACE_WITH_SECURE_64_CHARACTER_SECRET
CSMS_URL=ws://localhost:9220
LOG_LEVEL=info
ENABLE_AUTH=false
EOF

# Secure secret oluştur
SECRET=$(openssl rand -hex 32)
sed -i "s/REPLACE_WITH_SECURE_64_CHARACTER_SECRET/$SECRET/" .env
```

### 4. Data Dizini

```bash
mkdir -p src/data
chmod 755 src/data
```

### 5. Mock CSMS (Opsiyonel)

```bash
# Terminal 1: Mock CSMS
npm run mock:csms &

# Terminal 2: Server
npm start
```

### 6. Systemd Service (Production)

```bash
# Service dosyası oluştur
sudo tee /etc/systemd/system/ev-simulator.service << 'EOF'
[Unit]
Description=EV Charging Station Simulator
After=network.target

[Service]
Type=simple
User=nodejs
WorkingDirectory=/opt/ev-simulator/server
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node --experimental-modules src/app.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable ve start
sudo systemctl daemon-reload
sudo systemctl enable ev-simulator
sudo systemctl start ev-simulator
sudo systemctl status ev-simulator
```

---

## ✅ DEPLOYMENT SONRASI KONTROL

### 1. Health Checks

```bash
# Basic health
curl http://localhost:3001/health
# Beklenen: {"status":"ok",...}

# Detailed health
curl http://localhost:3001/health/detailed
# Beklenen: Detaylı sistem bilgisi

# Metrics
curl http://localhost:3001/metrics
# Beklenen: Prometheus format metrics
```

### 2. Dashboard Test

```bash
# Dashboard'u aç
open http://localhost:3001/dashboard

# Kontrol et:
- Socket.IO bağlantısı "Connected" mı?
- System overview cards görünüyor mu?
- Station oluşturabiliyor musun?
```

### 3. Monitoring

```bash
# Prometheus
open http://localhost:9090
# Targets check: Status UP olmalı

# Grafana
open http://localhost:3002
# Dashboard import et: monitoring/grafana/dashboards/
```

---

## 🐛 TROUBLESHOOTING

### Server Başlamıyor

```bash
# Logları kontrol et
tail -f server/logs/error.log
tail -f server/logs/combined.log

# Port kontrolü
lsof -i :3001
```

### Syntax Errors

```bash
# Syntax fix script'i çalıştır
./scripts/fix-all-syntax.sh

# Manuel kontrol
find server/src -name "*.js" -exec node --check {} \;
```

### Dashboard Bağlanamıyor

```bash
# Server çalışıyor mu?
curl http://localhost:3001/health

# Mock CSMS çalışıyor mu?
lsof -i :9220

# Browser console'u kontrol et
```

---

## 📊 PERFORMANS ÖNERİLERİ

### Production Optimizations

```env
# .env
NODE_ENV=production
ENABLE_METRICS=true
LOG_LEVEL=warn
REDIS_URL=redis://localhost:6379
```

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name simulator.example.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## ✅ DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] Syntax hataları temizlendi
- [ ] Dependencies yüklendi
- [ ] Environment variables ayarlandı
- [ ] Smoke testler geçti
- [ ] Docker build test edildi

### Deployment

- [ ] Server başlatıldı
- [ ] Health checks geçti
- [ ] Dashboard erişilebilir
- [ ] Monitoring aktif
- [ ] Loglar çalışıyor

### Post-Deployment

- [ ] Load testing yapıldı
- [ ] Monitoring validation
- [ ] Backup strategy
- [ ] Alert rules aktif

---

## 🎯 SONUÇ

**GitHub'dan kurulabilir mi?** 🟡 **2 SAAT HAZIRLIK GEREKLİ**

**Yapılması gerekenler:**
1. ✅ Syntax temizliği (scripts/fix-all-syntax.sh)
2. ✅ Smoke test (scripts/smoke-test.sh)
3. ⏳ Docker test
4. ⏳ Production validation

**Önerim:** Önce local'de bu adımları tamamla, sonra server'a kur.

---

**Hazırlayan:** DevOps Team  
**Tarih:** 2025-11-09

