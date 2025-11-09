# 🚀 CSMS Entegrasyon Çalıştırma Rehberi

Bu runbook, EV Station Simulator uygulamasını başlatma, sağlık kontrollerini yürütme ve gerçek bir CSMS’e bağlanarak testleri tamamlama adımlarını özetler. PR aşamasında görev yapan geliştiriciler ve QA ekipleri için referans niteliğindedir.

---

## 1. Ön Koşullar

| Gereksinim | Sürüm / Açıklama |
|------------|------------------|
| Node.js    | ≥ 20.x |
| npm        | ≥ 9.x |
| Redis (opsiyonel) | Redis caching etkinleştirilecekse |
| Playwright | `npm run e2e` için otomatik kurulur |

> **Not:** Varsayılan kullanıcılar JSON tabanlı depoda tutulur. Development modunda auth kapalı ise dashboard demo modunda açılır; production senaryoları için `ENABLE_AUTH=true` kullanılmalıdır.

### Varsayılan Giriş Bilgileri
```
admin@simulator.local / admin123      (Admin)
operator@simulator.local / operator123 (Operator)
viewer@simulator.local / viewer123     (Read-only)
```

---

## 2. Uygulamayı Başlatma

```bash
# 1. Depoyu klonlayın (daha önce yapmadıysanız)
git clone <repo-url>
cd simisimiocpp

# 2. Sunucu bağımlılıklarını kurun
cd server
npm ci

# 3. Ortam değişkenlerini düzenleyin (örn. .env veya export)
cp .env.example .env  # varsa
# Kritik değişkenler:
# ENABLE_AUTH=true
# JWT_SECRET=<rastgele güçlü değer>
# REDIS_ENABLED=false (veya true + Redis URL)

# 4. Sunucuyu başlatın
npm start
```

### Servislerin Aktivasyonu
- HTTP API + Dashboard : `http://localhost:3001`
- WebSocket : varsayılan port 3001 üzerinden Socket.IO
- OCPP Simülatörü : `config.ocpp.port` (default `9220`)

### Sunumu Sonlandırma
- Sunucuyu durdurmak için çalıştığı terminalde `Ctrl+C`.
- Redis gibi yardımcı servisleri dışarıdan çalıştırdıysanız ayrıca kapatın.

---

## 3. Sağlık Kontrolleri

| Kontrol | URL / Komut | Beklenen Sonuç |
|---------|-------------|----------------|
| HTTP health | `GET http://localhost:3001/health` | `{ status: "ok", ... }` |
| Gelişmiş health | `GET http://localhost:3001/health/detailed` | Servis bileşen detayları |
| Prometheus metrics | `GET http://localhost:3001/metrics` | Prometheus metrik metni |
| Dashboard health | Dashboard üstündeki bağlantı rozeti “Connected” |
| Telemetri | Konsolda `[DashboardTelemetry]` logları (retry sonuçları) |

> Gerekirse `npm run test:unit` ve `npm run lint` komutlarıyla son durum doğrulanabilir.

---

## 4. Gerçek CSMS’e Bağlanma

1. **OCPP Portu:** `config.ocpp.port` (varsayılan 9220) dış dünyaya erişilebilir olmalı.
2. **Firewall / NAT:** CSMS’in sunucuya erişimini sağlayın (TCP/UDP ilgili protokoller).
3. **CSMS URL’si:** Dashboard’dan istasyon oluştururken `CSMS URL` alanına gerçek CSMS websocket adresini girin (örn. `wss://csms.example.com/ocpp`).
4. **Kimlik Doğrulama:** CSMS tarafında ihtiyaç duyulan sertifika/kimlik bilgilerini ayarlayın.
5. **Manuel Testler:**
   - Dashboard’da istasyon oluşturun.
   - Başlat/Durdur komutlarını tetikleyin; CSMS tarafında logları kontrol edin.

### Otomatik Tests
```bash
# Mock senaryolar
npm run test:integration:mock

# Gerçek CSMS entegrasyonu (CI içinde de kullanılabilir)
REAL_CSMS_URL=wss://<csms-host>/ocpp \
REAL_CSMS_TLS_CONFIG=./path/to/tls.json \
npm run test:real-csms
```

> `REAL_CSMS_*` değişkenlerini `.env` veya CI secrets üzerinden temin edin.

---

## 5. Playwright E2E Testleri

Dashboard + API akışlarını doğrulamak için:

```bash
cd e2e
npm ci
npx playwright install --with-deps
PLAYWRIGHT_ADMIN_EMAIL=admin@simulator.local \
PLAYWRIGHT_ADMIN_PASSWORD=admin123 \
npm test
```

CI pipeline’ında `e2e-playwright` job’u aynı komutları secrets üzerinden çalıştırır.

---

## 6. Hazırlık Kontrol Listesi (PR Öncesi)

1. `npm run lint` – Uyarılar incelendi mi?
2. `npm run test:unit` – Controller + frontend util/middleware testleri geçti mi?
3. `npm run test:integration:mock` – CSMS mock testi başarılı mı?
4. `npm run test:real-csms` (opsiyonel) – Gerçek ortam testi uygulanabildi mi?
5. `e2e` Playwright testleri lokal/CI’da geçti mi?
6. Sağlık endpoint’leri beklenen yanıtı veriyor mu?
7. Dashboard’a giriş yaparak istasyon oluşturma & websocket güncellemesi doğrulandı mı?

---

## 7. Kullanıcı Yönlendirmesi (PR İncelemesi İçin)

- **Erişim:** `http://localhost:3001/dashboard`
- **Varsayılan Rol:** `admin@simulator.local / admin123`
- **Test Komutları:** README’deki veya bu runbook’taki komutları sırasıyla uygulayın.
- **Kapanış:** PR onayı öncesi bütün kontrollerin ekran görüntüsü / logları ile kanıtlanması teşvik edilir.

---

Herhangi bir hata veya sapma tespit edilirse `docs/CRITICAL_PRODUCTION_READINESS_ASSESSMENT.md` altında kayıt altına alınmalı ve ilgili ekip bilgilendirilmelidir.
