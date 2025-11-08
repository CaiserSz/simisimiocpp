# Dashboard Erişim Kılavuzu

**Tarih:** 2025-01-11

## Durum

✅ **Syntax hataları düzeltildi** - Optional chaining (`?.`) syntax hataları giderildi.

## Server'ı Başlatma

### Adım 1: Environment Dosyası Oluştur

```bash
cd server
cat > .env << 'EOF'
NODE_ENV=development
PORT=3001
HOST=0.0.0.0
STORAGE_TYPE=json
DATA_DIR=./src/data
JWT_SECRET=test_secret_key_for_development_only_minimum_64_characters_long_for_security
JWT_EXPIRES_IN=24h
CSMS_URL=ws://localhost:9220
LOG_LEVEL=info
ENABLE_AUTH=true
EOF
```

### Adım 2: Server'ı Başlat

```bash
cd server
npm start
```

veya development modunda:

```bash
npm run dev
```

### Adım 3: Dashboard'a Eriş

Tarayıcıda aç:
```
http://localhost:3001/dashboard
```

## Dashboard Özellikleri

- ✅ Real-time monitoring
- ✅ Station management
- ✅ WebSocket entegrasyonu
- ✅ Responsive design

## Sorun Giderme

### Server Başlamıyorsa

1. **Port kontrolü:**
```bash
lsof -ti:3001
# Eğer port kullanılıyorsa:
kill -9 $(lsof -ti:3001)
```

2. **Syntax kontrolü:**
```bash
node --check src/app.js
```

3. **Log kontrolü:**
```bash
tail -f logs/app.log
```

4. **Dependencies kontrolü:**
```bash
npm install
```

## Notlar

- Syntax hataları düzeltildi
- Server manuel olarak başlatılmalı
- Dashboard `http://localhost:3001/dashboard` adresinde erişilebilir

