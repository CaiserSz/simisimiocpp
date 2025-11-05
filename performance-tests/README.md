# K6 Performance Testing Suite

Bu klasör EV Charging Station Simulator için kapsamlı performans testleri içerir.

## 📋 Test Senaryoları

### 1. `load-test.js` - Yük Testi
- **Amaç**: Normal yük altında sistem performansını test etmek
- **Profil**: 10 → 50 kullanıcı
- **Süre**: ~4 dakika
- **Kullanım**:
  ```bash
  k6 run load-test.js
  k6 run --vus 50 --duration 30s load-test.js
  ```

### 2. `benchmark.js` - Benchmark Testi
- **Amaç**: Performans baz çizgisi ölçümleri
- **Profil**: 20 kullanıcı, 60 saniye
- **Kullanım**:
  ```bash
  k6 run benchmark.js
  ```

### 3. `stress-test.js` - Stres Testi
- **Amaç**: Sistemin kırılma noktasını bulmak
- **Profil**: 100 → 200 kullanıcı
- **Süre**: ~7 dakika
- **Kullanım**:
  ```bash
  k6 run stress-test.js
  ```

## 🚀 Kurulum

### K6 Kurulumu

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows:**
```powershell
choco install k6
```

## 📊 Test Çalıştırma

### Temel Kullanım

```bash
# Load test
k6 run load-test.js

# Benchmark test
k6 run benchmark.js

# Stress test
k6 run stress-test.js
```

### Özel Konfigürasyon

```bash
# Custom base URL
BASE_URL=http://localhost:3001 k6 run load-test.js

# Custom virtual users and duration
k6 run --vus 100 --duration 5m load-test.js

# Output to JSON
k6 run --out json=results.json load-test.js
```

## 📈 Metrikler

Testler şu metrikleri ölçer:
- **Response Time**: API yanıt süreleri (p50, p95, p99)
- **Error Rate**: Hata oranı
- **Throughput**: İşlem hacmi
- **HTTP Status Codes**: HTTP durum kodları

## 🎯 Başarı Kriterleri

- **Load Test**: 
  - 95% yanıt süresi < 500ms
  - Hata oranı < 1%
  
- **Benchmark Test**:
  - p50 < 100ms
  - p95 < 300ms
  - p99 < 500ms

- **Stress Test**:
  - p95 < 2000ms (stres altında)
  - Hata oranı < 5% (stres altında)

## 🔧 CI/CD Entegrasyonu

CI/CD pipeline'da otomatik çalışır:
```yaml
- name: Run performance tests
  run: |
    cd performance-tests
    k6 run --out json=results.json load-test.js
```

## 📝 Notlar

- Testler için sunucunun çalışıyor olması gerekir
- Varsayılan BASE_URL: `http://localhost:3001`
- Test verileri otomatik oluşturulur ve temizlenir
- Her test bağımsız çalışır

