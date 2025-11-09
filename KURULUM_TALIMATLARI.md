# Kurulum Talimatları - vcss.lixhium.biz

**Server:** 164.92.206.5  
**Konum:** /home/basar/apps/vcss  
**Domain:** vcss.lixhium.biz  
**Tarih:** 2025-11-09

---

## 🚀 HIZLI KURULUM

### Sunucuda Çalıştırılacak Komutlar

```bash
# 1. Klasöre git
cd /home/basar/apps/vcss

# 2. Repo'yu klonla
git clone https://github.com/CaiserSz/simisimiocpp.git .

# 3. Kurulum dizinine git
cd simisimiocpp

# 4. Syntax temizliği (KRİTİK)
chmod +x scripts/fix-all-syntax.sh
./scripts/fix-all-syntax.sh

# 5. Server kurulumu
cd server
npm ci --production

# 6. Environment dosyası
cp .env.production .env
# JWT secret oluştur
sed -i "s/WILL_BE_GENERATED_ON_SERVER/$(openssl rand -hex 32)/" .env

# 7. Dizinleri oluştur
mkdir -p src/data logs

# 8. Systemd service
sudo tee /etc/systemd/system/ev-simulator.service > /dev/null << 'EOF'
[Unit]
Description=EV Charging Station Simulator
After=network.target

[Service]
Type=simple
User=basar
WorkingDirectory=/home/basar/apps/vcss/simisimiocpp/server
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node --experimental-modules src/app.js
Restart=always
RestartSec=10
StandardOutput=append:/home/basar/apps/vcss/simisimiocpp/server/logs/app.log
StandardError=append:/home/basar/apps/vcss/simisimiocpp/server/logs/error.log

[Install]
WantedBy=multi-user.target
EOF

# 9. Service'i başlat
sudo systemctl daemon-reload
sudo systemctl enable ev-simulator
sudo systemctl start ev-simulator

# 10. Kontrol et
sleep 5
curl http://localhost:3001/health

# 11. Nginx configuration
cd /home/basar/apps/vcss/simisimiocpp
sudo cp nginx-vcss.conf /etc/nginx/sites-available/vcss.lixhium.biz
sudo ln -sf /etc/nginx/sites-available/vcss.lixhium.biz /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 12. SSL (Let's Encrypt)
sudo certbot --nginx -d vcss.lixhium.biz --non-interactive --agree-tos -m admin@lixhium.biz

echo "✅ KURULUM TAMAMLANDI"
echo "URL: https://vcss.lixhium.biz"
```

---

## 📋 KONTROL LİSTESİ

### Kurulum Öncesi

- [ ] Server'a SSH erişimi var
- [ ] Node.js 20+ kurulu
- [ ] Nginx kurulu
- [ ] Git kurulu
- [ ] Port 3001 boş
- [ ] DNS (vcss.lixhium.biz) → 164.92.206.5

### Kurulum

- [ ] Repo klonlandı
- [ ] Syntax temizliği yapıldı
- [ ] Dependencies yüklendi
- [ ] Environment variables ayarlandı
- [ ] Service oluşturuldu
- [ ] Nginx yapılandırıldı

### Kurulum Sonrası

- [ ] Health check geçti
- [ ] Dashboard erişilebilir
- [ ] SSL kuruldu
- [ ] Monitoring aktif
- [ ] Loglar çalışıyor

---

## 🧪 TEST KOMUTLARI

```bash
# Health check
curl http://localhost:3001/health

# Dashboard
curl http://localhost:3001/dashboard

# Service durumu
sudo systemctl status ev-simulator

# Loglar
journalctl -u ev-simulator -f

# Nginx durumu
sudo nginx -t
sudo systemctl status nginx
```

---

## 🔧 SORUN GİDERME

### Service Başlamıyor

```bash
# Logları kontrol et
sudo journalctl -u ev-simulator -n 50

# Manuel başlat (test için)
cd /home/basar/apps/vcss/simisimiocpp/server
NODE_ENV=production node --experimental-modules src/app.js
```

### Nginx Hatası

```bash
# Config test
sudo nginx -t

# Loglar
sudo tail -f /var/log/nginx/error.log
```

### Port Çakışması

```bash
# Port 3001'i kim kullanıyor?
sudo lsof -i :3001

# Process'i sonlandır
sudo kill -9 <PID>
```

---

## 📊 KURULUM SONRASI

### Erişim

- **Dashboard:** https://vcss.lixhium.biz/dashboard
- **API:** https://vcss.lixhium.biz/api
- **Metrics:** https://vcss.lixhium.biz/metrics
- **Health:** https://vcss.lixhium.biz/health

### Monitoring

- **Prometheus:** http://164.92.206.5:9090 (firewall açılırsa)
- **Grafana:** http://164.92.206.5:3002 (firewall açılırsa)

### Default Users

- **Admin:** admin@simulator.local / admin123
- **Operator:** operator@simulator.local / operator123

---

## ✅ BAŞARI KRİTERLERİ

Kurulum başarılı sayılır:

- [ ] `curl http://localhost:3001/health` → 200 OK
- [ ] `curl https://vcss.lixhium.biz` → Dashboard yükleniyor
- [ ] Socket.IO bağlantısı çalışıyor
- [ ] Station oluşturulabiliyor
- [ ] Service otomatik başlıyor (reboot sonrası)

---

**Hazırlayan:** DevOps Team  
**Tarih:** 2025-11-09

