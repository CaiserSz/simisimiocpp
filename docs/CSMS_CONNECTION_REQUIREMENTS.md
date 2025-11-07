# CSMS Bağlantı Gereksinimleri

**Tarih:** 2025-01-11  
**Versiyon:** 1.0.0

## Genel Bakış

Simulatörün CSMS (Central System Management System) ile bağlantı kurabilmesi için gerekli bilgiler ve konfigürasyon parametreleri.

---

## Zorunlu Bilgiler

### 1. CSMS URL (Zorunlu)

**Açıklama:** CSMS sunucusunun WebSocket URL'i

**Format:**
```
ws://hostname:port
veya
wss://hostname:port  (SSL/TLS için)
```

**Örnekler:**
```javascript
csmsUrl: "ws://localhost:9220"
csmsUrl: "wss://csms.example.com:9220"
csmsUrl: "ws://192.168.1.100:9220"
```

**Doğrulama:**
- `ws://` veya `wss://` ile başlamalı
- Port numarası belirtilmeli
- Geçerli bir hostname veya IP adresi olmalı

**Kod Referansı:**
```javascript
// BaseOCPPSimulator.js - Line 21
this.csmsUrl = config.csmsUrl;

// WebSocket bağlantısı - Line 103
const wsUrl = `${this.csmsUrl}/${this.stationId}`;
```

---

### 2. Station ID (Zorunlu)

**Açıklama:** İstasyonun benzersiz tanımlayıcısı. CSMS tarafından istasyonu tanımlamak için kullanılır.

**Format:**
- String
- Önerilen: Alphanumeric + underscore/dash
- Maksimum uzunluk: CSMS'e bağlı (genellikle 50 karakter)

**Örnekler:**
```javascript
stationId: "SIM_001"
stationId: "STATION_ABC_123"
stationId: "CHARGER-001"
```

**Otomatik Oluşturma:**
Eğer belirtilmezse, otomatik olarak oluşturulur:
```javascript
// StationSimulator.js - Line 16
this.stationId = config.stationId || `SIM_${uuidv4().substring(0, 8)}`;
```

**WebSocket URL Oluşturma:**
```javascript
// BaseOCPPSimulator.js - Line 103
const wsUrl = `${this.csmsUrl}/${this.stationId}`;
// Örnek: ws://localhost:9220/SIM_001
```

---

## Opsiyonel Bilgiler (Önerilen)

### 3. Vendor (Üretici)

**Açıklama:** İstasyon üreticisi bilgisi. BootNotification mesajında kullanılır.

**Varsayılan:** `"Simulator Corp"`

**Örnekler:**
```javascript
vendor: "ABB"
vendor: "Schneider Electric"
vendor: "Siemens"
vendor: "TestVendor"
```

**Kullanım:**
```javascript
// OCPP16JSimulator.js - Line 70
'VendorName': config.vendor || 'Simulator Corp',
'ChargePointVendor': config.vendor || 'Simulator Corp',
```

---

### 4. Model

**Açıklama:** İstasyon model bilgisi. BootNotification mesajında kullanılır.

**Varsayılan:** `"SimCharger Pro"`

**Örnekler:**
```javascript
model: "Terra AC"
model: "EVlink Wallbox"
model: "ChargePoint Home"
model: "TestModel"
```

**Kullanım:**
```javascript
// OCPP16JSimulator.js - Line 71
'ChargePointModel': config.model || 'SimCharger Pro',
```

---

### 5. Serial Number (Seri Numarası)

**Açıklama:** İstasyonun seri numarası. BootNotification mesajında kullanılır.

**Varsayılan:** Otomatik oluşturulur (`SN${Date.now()}`)

**Örnekler:**
```javascript
serialNumber: "SN123456789"
serialNumber: "ABC-2024-001"
serialNumber: "TEST001"
```

**Kullanım:**
```javascript
// StationSimulator.js - Line 21
serialNumber: config.serialNumber || `SN${Date.now()}`,

// OCPP16JSimulator.js - Line 72
'ChargePointSerialNumber': config.serialNumber || 'SIM001',
```

---

### 6. OCPP Version (Protokol Versiyonu)

**Açıklama:** Kullanılacak OCPP protokol versiyonu.

**Varsayılan:** `"1.6J"`

**Değerler:**
- `"1.6J"` - OCPP 1.6J (JSON)
- `"2.0.1"` - OCPP 2.0.1

**Örnekler:**
```javascript
ocppVersion: "1.6J"
ocppVersion: "2.0.1"
```

**Kullanım:**
```javascript
// StationSimulator.js - Line 25
ocppVersion: config.ocppVersion || '1.6J',

// Protokol seçimi - Line 75-85
if (this.config.ocppVersion === '2.0.1') {
    this.ocppClient = new OCPP201Simulator({...});
} else {
    this.ocppClient = new OCPP16JSimulator({...});
}
```

**Sub-Protocol:**
- OCPP 1.6J: `"ocpp1.6"`
- OCPP 2.0.1: `"ocpp2.0.1"`

---

### 7. Connector Count (Konnektör Sayısı)

**Açıklama:** İstasyondaki konnektör sayısı.

**Varsayılan:** `2`

**Aralık:** `1` - `10`

**Örnekler:**
```javascript
connectorCount: 1
connectorCount: 2
connectorCount: 4
```

**Kullanım:**
```javascript
// StationSimulator.js - Line 29
connectorCount: config.connectorCount || 2,

// Konnektörlerin başlatılması
this.connectors = this.initializeConnectors();
```

---

### 8. Max Power (Maksimum Güç)

**Açıklama:** İstasyonun maksimum güç kapasitesi (Watt cinsinden).

**Varsayılan:** `22000` (22 kW)

**Örnekler:**
```javascript
maxPower: 7400      // 7.4 kW (AC)
maxPower: 22000     // 22 kW (AC)
maxPower: 50000     // 50 kW (DC Fast)
maxPower: 350000    // 350 kW (Ultra Fast DC)
```

**Kullanım:**
```javascript
// StationSimulator.js - Line 30
maxPower: config.maxPower || 22000, // Watts
```

---

### 9. Heartbeat Interval (Kalp Atışı Aralığı)

**Açıklama:** CSMS'e gönderilecek heartbeat mesajlarının aralığı (saniye cinsinden).

**Varsayılan:** `300` (5 dakika)

**Örnekler:**
```javascript
heartbeatInterval: 60    // 1 dakika
heartbeatInterval: 300   // 5 dakika
heartbeatInterval: 600   // 10 dakika
```

**Kullanım:**
```javascript
// StationSimulator.js - Line 36
heartbeatInterval: config.heartbeatInterval || 300, // seconds

// OCPP16JSimulator.js - Line 37
[OCPP_CONFIG_KEYS.HEARTBEAT_INTERVAL]: config.heartbeatInterval?.toString() || OCPP_DEFAULT_CONFIG.HEARTBEAT_INTERVAL,
```

**Not:** CSMS, BootNotification yanıtında farklı bir interval belirtebilir. Bu durumda CSMS'in belirttiği interval kullanılır.

---

### 10. Firmware Version (Yazılım Versiyonu)

**Açıklama:** İstasyonun firmware versiyonu.

**Varsayılan:** `"1.0.0"`

**Örnekler:**
```javascript
firmwareVersion: "1.0.0"
firmwareVersion: "2.3.1"
firmwareVersion: "v1.2.3-beta"
```

**Kullanım:**
```javascript
// StationSimulator.js - Line 22
firmwareVersion: config.firmwareVersion || '1.0.0',

// OCPP16JSimulator.js - Line 74
'FirmwareVersion': config.firmwareVersion || '1.0.0',
```

---

## Tam Konfigürasyon Örneği

### Minimal Konfigürasyon (Sadece Zorunlular)

```javascript
{
  csmsUrl: "ws://localhost:9220"
  // stationId otomatik oluşturulur
}
```

### Standart Konfigürasyon

```javascript
{
  // Zorunlu
  csmsUrl: "ws://localhost:9220",
  stationId: "SIM_001",
  
  // Önerilen
  vendor: "TestVendor",
  model: "SimCharger Pro",
  serialNumber: "SN001",
  ocppVersion: "1.6J",
  connectorCount: 2,
  maxPower: 22000,
  heartbeatInterval: 300,
  firmwareVersion: "1.0.0"
}
```

### Gelişmiş Konfigürasyon

```javascript
{
  // Zorunlu
  csmsUrl: "wss://csms.example.com:9220",
  stationId: "STATION_ABC_123",
  
  // İstasyon Bilgileri
  vendor: "ABB",
  model: "Terra AC",
  serialNumber: "ABB-2024-001",
  firmwareVersion: "2.3.1",
  
  // OCPP Konfigürasyonu
  ocppVersion: "2.0.1",
  heartbeatInterval: 60,
  
  // Donanım Konfigürasyonu
  connectorCount: 4,
  maxPower: 50000,
  supportedStandards: ["IEC62196Type2", "CHAdeMO"],
  
  // Simülasyon Ayarları
  autoStart: false,
  simulationSpeed: 1,
  
  // Organizasyon Bilgileri (Opsiyonel)
  groupId: "group_urban",
  networkId: "network_primary",
  operator: "Operator Name",
  location: {
    latitude: 41.0082,
    longitude: 28.9784,
    address: "Istanbul, Turkey"
  }
}
```

---

## API ile İstasyon Oluşturma

### REST API Kullanımı

```bash
curl -X POST http://localhost:3001/api/v1/simulator/stations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor": "TestVendor",
    "model": "SimCharger Pro",
    "ocppVersion": "1.6J",
    "connectorCount": 2,
    "maxPower": 22000,
    "csmsUrl": "ws://localhost:9220",
    "serialNumber": "TEST001",
    "heartbeatInterval": 300
  }'
```

### JavaScript Kullanımı

```javascript
const station = await simulationManager.createStation({
  csmsUrl: "ws://localhost:9220",
  stationId: "SIM_001",
  vendor: "TestVendor",
  model: "SimCharger Pro",
  ocppVersion: "1.6J",
  connectorCount: 2,
  maxPower: 22000
});

await station.start();
```

---

## Bağlantı Süreci

### 1. WebSocket Bağlantısı

```javascript
// BaseOCPPSimulator.js
const wsUrl = `${this.csmsUrl}/${this.stationId}`;
// Örnek: ws://localhost:9220/SIM_001

this.ws = new WebSocket(wsUrl, [subProtocol]);
// subProtocol: "ocpp1.6" veya "ocpp2.0.1"
```

### 2. BootNotification Gönderimi

Bağlantı kurulduktan sonra otomatik olarak BootNotification gönderilir:

**OCPP 1.6J:**
```json
[
  2,
  "unique-message-id",
  "BootNotification",
  {
    "chargePointVendor": "TestVendor",
    "chargePointModel": "SimCharger Pro",
    "chargePointSerialNumber": "TEST001",
    "firmwareVersion": "1.0.0"
  }
]
```

**OCPP 2.0.1:**
```json
[
  2,
  "unique-message-id",
  "BootNotification",
  {
    "reason": "PowerUp",
    "chargingStation": {
      "serialNumber": "TEST001",
      "model": "SimCharger Pro",
      "vendorName": "TestVendor",
      "firmwareVersion": "1.0.0"
    }
  }
]
```

### 3. Heartbeat Başlatma

BootNotification kabul edildikten sonra, belirtilen interval'de heartbeat gönderilir.

---

## Hata Durumları

### Geçersiz CSMS URL

```javascript
// Hata: CSMS URL must be a valid WebSocket URL
if (config.csmsUrl && !config.csmsUrl.match(/^wss?:\/\/.+/)) {
  return res.status(400).json({
    success: false,
    error: 'CSMS URL must be a valid WebSocket URL (ws:// or wss://)'
  });
}
```

### Bağlantı Hatası

- CSMS erişilemezse: Reconnection mekanizması devreye girer
- Circuit breaker açılırsa: Bağlantı denemeleri durdurulur
- Timeout: Belirtilen süre sonunda bağlantı iptal edilir

---

## Örnek Senaryolar

### Senaryo 1: Yerel Test CSMS

```javascript
{
  csmsUrl: "ws://localhost:9220",
  stationId: "TEST_STATION_001",
  ocppVersion: "1.6J"
}
```

### Senaryo 2: Production CSMS (SSL)

```javascript
{
  csmsUrl: "wss://csms.production.com:9220",
  stationId: "PROD_STATION_001",
  ocppVersion: "2.0.1",
  vendor: "ABB",
  model: "Terra AC"
}
```

### Senaryo 3: Çoklu İstasyon

```javascript
// Her istasyon için benzersiz stationId gerekli
const stations = [
  { csmsUrl: "ws://localhost:9220", stationId: "STATION_001" },
  { csmsUrl: "ws://localhost:9220", stationId: "STATION_002" },
  { csmsUrl: "ws://localhost:9220", stationId: "STATION_003" }
];
```

---

## Özet Tablo

| Parametre | Zorunlu | Varsayılan | Açıklama |
|-----------|---------|------------|----------|
| `csmsUrl` | ✅ Evet | - | CSMS WebSocket URL'i |
| `stationId` | ⚠️ Otomatik | `SIM_${uuid}` | İstasyon ID'si |
| `vendor` | ❌ Hayır | `"Simulator Corp"` | Üretici |
| `model` | ❌ Hayır | `"SimCharger Pro"` | Model |
| `serialNumber` | ❌ Hayır | `SN${timestamp}` | Seri numarası |
| `ocppVersion` | ❌ Hayır | `"1.6J"` | OCPP versiyonu |
| `connectorCount` | ❌ Hayır | `2` | Konnektör sayısı |
| `maxPower` | ❌ Hayır | `22000` | Maksimum güç (W) |
| `heartbeatInterval` | ❌ Hayır | `300` | Heartbeat aralığı (s) |
| `firmwareVersion` | ❌ Hayır | `"1.0.0"` | Firmware versiyonu |

---

**Son Güncelleme:** 2025-01-11  
**Versiyon:** 1.0.0

