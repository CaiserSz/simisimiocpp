# API Documentation Guide

**Tarih:** 2025-01-11  
**Versiyon:** 1.0.0  
**Tool:** OpenAPI/Swagger

---

## 📚 API Dokümantasyonu

### Swagger UI Erişimi

```
http://localhost:3001/api/docs
```

### OpenAPI JSON

```
http://localhost:3001/api/docs.json
```

---

## 🚀 Kurulum

### Gerekli Paketler

```bash
cd server
npm install swagger-jsdoc swagger-ui-express
```

---

## 📖 Kullanım

### Swagger UI'da API Test Etme

1. Swagger UI'a git: `http://localhost:3001/api/docs`
2. Endpoint'i seç
3. "Try it out" butonuna tıkla
4. Parametreleri doldur
5. "Execute" butonuna tıkla
6. Response'u incele

### Authentication

Korumalı endpoint'ler için:

1. `/api/auth/login` endpoint'ini kullanarak login ol
2. Response'dan JWT token'ı kopyala
3. Swagger UI'da "Authorize" butonuna tıkla
4. Token'ı yapıştır (Bearer prefix olmadan)
5. "Authorize" butonuna tıkla

Artık tüm korumalı endpoint'leri test edebilirsiniz.

---

## 📋 Endpoint Kategorileri

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Simulator
- `GET /api/simulator/stations` - Tüm istasyonları listele
- `POST /api/simulator/stations` - Yeni istasyon oluştur
- `PUT /api/simulator/stations/{id}/start` - İstasyonu başlat
- `PUT /api/simulator/stations/{id}/stop` - İstasyonu durdur
- `DELETE /api/simulator/stations/{id}` - İstasyonu sil

### Dashboard
- `GET /api/dashboard/overview` - Dashboard özet
- `GET /api/dashboard/metrics` - Metrikler

### Health
- `GET /health` - Temel health check
- `GET /health/detailed` - Detaylı health check
- `GET /metrics` - Prometheus metrics

---

## ✅ Özellikler

- ✅ Interactive API explorer
- ✅ Request/response examples
- ✅ Schema documentation
- ✅ Authentication support
- ✅ Try it out functionality

---

## 📚 Daha Fazla Bilgi

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [JSDoc](https://jsdoc.app/)

---

**Created:** 2025-01-11  
**Team:** Documentation Team

