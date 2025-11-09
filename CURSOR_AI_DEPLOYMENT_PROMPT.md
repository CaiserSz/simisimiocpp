# Cursor AI Deployment Prompt

**Bu prompt'u Cursor AI'ya verin (server'a SSH bağlantısı yaptıktan sonra)**

---

## 📝 CURSOR AI'YA VERİLECEK PROMPT

```
EV Charging Station Simulator projesini bu sunucuya kuracaksın.

SUNUCU BİLGİLERİ:
- IP: 164.92.206.5
- Kullanıcı: basar
- Konum: /home/basar/apps/vcss
- Domain: vcss.lixhium.biz
- OS: Ubuntu (varsayılan)

REPO BİLGİLERİ:
- GitHub: https://github.com/CaiserSz/simisimiocpp.git
- Branch: main
- Ana dizin: simisimiocpp/simisimiocpp/

KRİTİK ADIMLAR (SIRASIY LA):

1. SYNTAX TEMİZLİĞİ (ÇOK ÖNEMLİ!)
   - Repo klonlandıktan sonra MUTLAKA: ./scripts/fix-all-syntax.sh çalıştır
   - Bu adım atlanırsa server başlamaz!

2. ENVIRONMENT SETUP
   - server/.env.production → server/.env kopyala
   - JWT_SECRET'i güvenli random değerle değiştir (openssl rand -hex 32)
   - DATA_DIR ve LOG_DIR path'lerini kontrol et

3. DEPENDENCIES
   - server/ dizininde: npm ci --production

4. SYSTEMD SERVICE
   - /etc/systemd/system/ev-simulator.service oluştur
   - WorkingDirectory: /home/basar/apps/vcss/simisimiocpp/server
   - User: basar
   - ExecStart: /usr/bin/node --experimental-modules src/app.js

5. NGINX CONFIGURATION
   - nginx-vcss.conf → /etc/nginx/sites-available/vcss.lixhium.biz
   - Symlink oluştur: /etc/nginx/sites-enabled/
   - nginx -t ile test et
   - systemctl reload nginx

6. SSL (CERTBOT)
   - certbot --nginx -d vcss.lixhium.biz

7. MOCK CSMS (Opsiyonel)
   - Eğer gerekliyse: npm run mock:csms ayrı service olarak

DİKKAT EDİLECEKLER:

⚠️ Syntax fix script'ini MUTLAKA çalıştır (satır 1)
⚠️ .env dosyasında JWT_SECRET'i değiştir
⚠️ Service'i start ettikten sonra health check yap
⚠️ Nginx test et (nginx -t)
⚠️ Firewall'da port 80, 443 açık olmalı

BEKLENsatırı:
- https://vcss.lixhium.biz → Dashboard açılmalı
- https://vcss.lixhium.biz/health → {"status":"ok",...}
- Socket.IO bağlantısı "Connected" göstermeli

HATA DURUMUNDA:
- journalctl -u ev-simulator -f (service logları)
- tail -f /home/basar/apps/vcss/simisimiocpp/server/logs/error.log
- sudo nginx -t (nginx test)

BAŞARI KRİTERİ:
curl https://vcss.lixhium.biz/health komutunun 200 OK dönmesi

Adım adım ilerle, her adımı doğrula, hata varsa düzelt.
```

---

## 🎯 KULLANIM

1. **Server'a bağlan:**
   ```bash
   ssh basar@164.92.206.5
   ```

2. **Cursor'da Remote SSH aç**

3. **Yukarıdaki prompt'u Cursor AI'ya yapıştır**

4. **AI'nın adımları takip et**

---

## ✅ KONTROLÜNÜZDEKİ ADIMLAR

AI kurulum yaparken şunları kontrol edin:

### Adım 1: Syntax Fix
```bash
./scripts/fix-all-syntax.sh
# Çıktı: "✅ TÜM SYNTAX HATALARI TEMİZLENDİ" görmeli
```

### Adım 2: Dependencies
```bash
cd server && npm ci --production
# Hatasız tamamlanmalı
```

### Adım 3: Service Start
```bash
sudo systemctl start ev-simulator
sudo systemctl status ev-simulator
# Status: active (running) görmeli
```

### Adım 4: Health Check
```bash
curl http://localhost:3001/health
# Sonuç: {"status":"ok",...}
```

### Adım 5: Nginx
```bash
sudo nginx -t
# Sonuç: syntax is ok, test is successful
```

### Adım 6: Domain Test
```bash
curl https://vcss.lixhium.biz/health
# Sonuç: {"status":"ok",...}
```

---

## 🚨 HATA DURUMUNDA

Eğer AI takılırsa veya hata alırsa, bu komutları çalıştırın:

```bash
# Service logları
sudo journalctl -u ev-simulator -n 100

# App logları
tail -100 /home/basar/apps/vcss/simisimiocpp/server/logs/error.log

# Nginx hatası
sudo nginx -t
sudo tail -50 /var/log/nginx/error.log
```

Sonucu bana gösterin, düzeltirim.

---

**Hazırlayan:** Deployment Team  
**Tarih:** 2025-11-09  
**Durum:** ✅ Kuruluma hazır

