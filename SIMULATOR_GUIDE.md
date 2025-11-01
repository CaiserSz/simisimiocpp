# 🔌 EV Charging Station Simulator - Complete Guide

## 📋 Overview

Bu uygulama, gerçek EV şarj istasyonlarının davranışını simüle eden kapsamlı bir **Charging Station Simulator**'dır. OCPP 1.6J ve 2.0.1 protokollerini destekler ve CSMS'ye (Central Station Management System) gerçek bir istasyon gibi bağlanır.

### 🎯 Temel Özellikler

- ✅ **Multi-Protocol Support**: OCPP 1.6J ve 2.0.1 desteği
- ✅ **Multi-Station Simulation**: Aynı anda yüzlerce istasyon simülasyonu
- ✅ **Vehicle Simulation**: Gerçekçi araç davranışları ve şarj senaryoları
- ✅ **Real-time Management**: Canlı yönetim ve izleme paneli
- ✅ **Scenario-based Testing**: Önceden tanımlı test senaryoları
- ✅ **Protocol Switching**: Çalışma anında protokol değiştirme
- ✅ **WebSocket Integration**: Real-time frontend entegrasyonu

---

## 🏗️ Architecture Overview

```
┌─────────────────┐    WebSocket    ┌─────────────────┐
│   CSMS Server   │ ←──────────────→ │ Station Sim #1  │
│  (External)     │                 │   (OCPP 1.6J)   │
└─────────────────┘                 └─────────────────┘
        ↑                                    ↓
        │                           ┌─────────────────┐
        │            WebSocket      │ Vehicle Sim     │
        └───────────────────────────│ • Cable plug    │
                                   │ • Authentication │
┌─────────────────┐                │ • Charging      │
│ Management API  │                └─────────────────┘
│ • REST APIs     │
│ • WebSocket     │    ┌─────────────────┐
│ • Dashboard     │────│ Station Sim #2  │
└─────────────────┘    │   (OCPP 2.0.1)  │
                       └─────────────────┘
```

---

## 🚀 Quick Start

### 1. Temel Kurulum

```bash
# Bağımlılıkları yükle
cd server && npm install

# Environment dosyasını oluştur
cp .env.example .env

# Gerekli environment variable'ları ayarla
# JWT_SECRET, MONGODB_URI, CSMS_URL vs.

# Uygulamayı başlat
npm run dev
```

### 2. İlk Simulator Kurulumu

```bash
# Management API'ye login ol
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'

# Token'ı kaydet
export TOKEN="your_jwt_token_here"

# İlk istasyonu oluştur
curl -X POST http://localhost:3001/api/simulator/stations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor": "TestVendor", 
    "model": "TestModel",
    "ocppVersion": "1.6J",
    "connectorCount": 2,
    "csmsUrl": "ws://localhost:9220"
  }'
```

---

## 🎛️ Management API Reference

### Station Management

#### Tüm İstasyonları Listele
```http
GET /api/simulator/stations
Authorization: Bearer {token}
```

#### İstasyon Detayları
```http
GET /api/simulator/stations/{stationId}
Authorization: Bearer {token}
```

#### İstasyon Oluştur
```http
POST /api/simulator/stations
Authorization: Bearer {token}
Content-Type: application/json

{
  "vendor": "Simulator Corp",
  "model": "SimCharger Pro",
  "ocppVersion": "1.6J",
  "connectorCount": 2,
  "maxPower": 22000,
  "csmsUrl": "ws://your-csms-url:9220",
  "heartbeatInterval": 300
}
```

#### İstasyon Başlat/Durdur
```http
PUT /api/simulator/stations/{stationId}/start
PUT /api/simulator/stations/{stationId}/stop
Authorization: Bearer {token}
```

#### Protokol Değiştir
```http
PUT /api/simulator/stations/{stationId}/protocol
Authorization: Bearer {token}
Content-Type: application/json

{
  "protocol": "2.0.1"
}
```

### Vehicle Simulation

#### Araç Bağla
```http
POST /api/simulator/stations/{stationId}/connectors/{connectorId}/vehicle/connect
Authorization: Bearer {token}
Content-Type: application/json

{
  "vehicleType": "sedan",
  "initialSoC": 20,
  "targetSoC": 80,
  "userScenario": "normal"
}
```

#### Şarj Başlat
```http
POST /api/simulator/stations/{stationId}/connectors/{connectorId}/charging/start
Authorization: Bearer {token}
Content-Type: application/json

{
  "idTag": "RFID_12345"
}
```

#### Şarj Durdur
```http
POST /api/simulator/stations/{stationId}/connectors/{connectorId}/charging/stop
Authorization: Bearer {token}
```

### Scenario Management

#### Hazır Senaryo Çalıştır
```http
POST /api/simulator/scenarios/urban_mixed/run
Authorization: Bearer {token}
Content-Type: application/json

{
  "clearExisting": true,
  "manualStop": false
}
```

#### Tüm İstasyonları Başlat/Durdur
```http
PUT /api/simulator/stations/start-all
PUT /api/simulator/stations/stop-all
Authorization: Bearer {token}
```

---

## 📊 Predefined Profiles

### Station Profiles

| Profile ID | Name | Power | Connectors | Protocol | Use Case |
|------------|------|-------|------------|----------|----------|
| `urban_ac` | Urban AC Charger | 7.4kW | 2 | 1.6J | Şehir içi AC şarj |
| `urban_dc_fast` | Urban DC Fast | 50kW | 1 | 2.0.1 | Şehir içi hızlı şarj |
| `highway_ultra_fast` | Highway Ultra Fast | 350kW | 4 | 2.0.1 | Otoyol ultra hızlı |
| `workplace_ac` | Workplace AC | 11kW | 2 | 1.6J | İş yeri şarjı |
| `home_wallbox` | Home Wallbox | 22kW | 1 | 1.6J | Ev tipi wallbox |
| `destination_ac` | Destination AC | 22kW | 2 | 2.0.1 | Otel/AVM şarjı |

### Vehicle Profiles

| Vehicle Type | Battery | Max Power | Efficiency | Range |
|--------------|---------|-----------|------------|-------|
| `compact` | 40 kWh | 7.4kW | 5.5 km/kWh | 220 km |
| `sedan` | 75 kWh | 11kW | 4.8 km/kWh | 360 km |
| `suv` | 95 kWh | 22kW | 4.2 km/kWh | 400 km |
| `delivery` | 60 kWh | 11kW | 3.8 km/kWh | 228 km |

---

## 🎬 Simulation Scenarios

### 1. Urban Mixed Charging
```json
{
  "name": "Urban Mixed Charging",
  "duration": 3600,
  "stations": [
    { "profileId": "urban_ac", "count": 10 },
    { "profileId": "urban_dc_fast", "count": 3 }
  ]
}
```

### 2. Highway Corridor
```json
{
  "name": "Highway Charging Corridor", 
  "duration": 7200,
  "stations": [
    { "profileId": "highway_ultra_fast", "count": 5 }
  ]
}
```

### 3. Load Testing
```json
{
  "name": "Load Testing Scenario",
  "duration": 1800,
  "stations": [
    { "profileId": "urban_ac", "count": 50 },
    { "profileId": "urban_dc_fast", "count": 20 },
    { "profileId": "highway_ultra_fast", "count": 10 }
  ]
}
```

---

## 🔄 Protocol Switching Examples

### Runtime Protocol Switch
```javascript
// İstasyonu durdur
await fetch(`/api/simulator/stations/${stationId}/stop`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` }
});

// Protokolü değiştir
await fetch(`/api/simulator/stations/${stationId}/protocol`, {
  method: 'PUT',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ protocol: '2.0.1' })
});

// İstasyonu tekrar başlat
await fetch(`/api/simulator/stations/${stationId}/start`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 🌐 WebSocket Real-time Events

### Frontend Connection
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your_jwt_token'
  }
});

// Simulation events
socket.on('simulation:started', (data) => {
  console.log('Simulation started:', data);
});

socket.on('charging:started', (data) => {
  console.log('Charging started:', data);
});

socket.on('meter:values', (data) => {
  console.log('Real-time meter values:', data);
});

// Subscribe to specific station
socket.emit('subscribe:station', { stationId: 'SIM_12345' });
```

### Available Events
- `simulation:started` - Simülasyon başladı
- `simulation:stopped` - Simülasyon durdu  
- `station:created` - Yeni istasyon oluşturuldu
- `station:started` - İstasyon başladı
- `charging:started` - Şarj başladı
- `charging:stopped` - Şarj durdu
- `meter:values` - Canlı ölçüm değerleri
- `scenario:event` - Senaryo olayı

---

## 🚗 Vehicle Simulation Examples

### Realistic Charging Session
```bash
# 1. Araç bağla
curl -X POST http://localhost:3001/api/simulator/stations/SIM_001/connectors/1/vehicle/connect \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "vehicleType": "sedan",
    "initialSoC": 25,
    "targetSoC": 85,
    "userScenario": "normal"
  }'

# 2. Şarj başlat (otomatik RFID ile)
curl -X POST http://localhost:3001/api/simulator/stations/SIM_001/connectors/1/charging/start \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"idTag": "RFID_USER_001"}'

# 3. User scenario çalıştır (isteğe bağlı)
curl -X POST http://localhost:3001/api/simulator/stations/SIM_001/connectors/1/scenario \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"scenario": "change_target_soc"}'
```

### Emergency Scenarios
```bash
# Acil durma simülasyonu
curl -X POST http://localhost:3001/api/simulator/stations/SIM_001/connectors/1/scenario \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"scenario": "emergency_stop"}'

# Kullanıcı bağlantı kesme
curl -X POST http://localhost:3001/api/simulator/stations/SIM_001/connectors/1/scenario \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"scenario": "user_disconnect"}'
```

---

## 📈 Monitoring & Statistics

### Real-time Statistics
```http
GET /api/simulator/statistics
Authorization: Bearer {token}
```

Response:
```json
{
  "success": true,
  "data": {
    "totalStations": 15,
    "activeStations": 12,
    "totalSessions": 45,
    "totalEnergyDelivered": 1250.5,
    "isRunning": true,
    "protocolDistribution": {
      "OCPP 1.6J": 8,
      "OCPP 2.0.1": 7
    }
  }
}
```

### Real-time Station Data
```http
GET /api/simulator/realtime/stations
Authorization: Bearer {token}
```

---

## 🔧 Configuration Examples

### Custom Station Profile
```javascript
const customProfile = {
  vendor: "MyVendor",
  model: "SuperCharger",
  ocppVersion: "2.0.1", 
  connectorCount: 4,
  maxPower: 150000, // 150kW
  heartbeatInterval: 120,
  supportedStandards: ["CCS2", "CHAdeMO"],
  location: "highway"
};
```

### Bulk Station Creation
```javascript
// Profile'dan 10 istasyon oluştur
const response = await fetch('/api/simulator/stations/from-profile', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    profileId: 'urban_dc_fast',
    count: 10,
    options: {
      csmsUrl: 'ws://production-csms:9220',
      autoStart: true
    }
  })
});
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. CSMS Bağlantı Problemi
```bash
# WebSocket bağlantısını test et
wscat -c ws://localhost:9220/TEST_STATION

# Logları kontrol et
tail -f logs/app.log | grep "OCPP"
```

#### 2. İstasyon Başlamıyor
```bash
# İstasyon durumunu kontrol et
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/simulator/stations/SIM_001

# Configuration'ı kontrol et
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/simulator/stations/SIM_001/config
```

#### 3. Protocol Switch Hatası
- İstasyon online iken protocol değiştirilemez
- Önce stop, sonra switch, sonra start

### Debug Mode
```bash
# Debug log level ile başlat
DEBUG=ocpp:* npm run dev

# Sadece simulator logları
DEBUG=simulator:* npm run dev
```

---

## 📚 Integration Examples

### Frontend Dashboard Integration
```vue
<template>
  <div class="simulator-dashboard">
    <StationGrid :stations="stations" />
    <ChargingChart :realTimeData="meterValues" />
  </div>
</template>

<script>
import { io } from 'socket.io-client';

export default {
  data() {
    return {
      socket: null,
      stations: {},
      meterValues: []
    };
  },
  
  async mounted() {
    // Connect to WebSocket
    this.socket = io('http://localhost:3001', {
      auth: { token: this.$store.state.auth.token }
    });
    
    // Listen for real-time updates
    this.socket.on('meter:values', (data) => {
      this.meterValues.push(data);
    });
    
    this.socket.on('station:started', (data) => {
      this.stations[data.stationId] = data;
    });
    
    // Load initial data
    await this.loadStations();
  }
};
</script>
```

---

## 🔍 Advanced Features

### Custom OCPP Message Injection
```javascript
// Custom OCPP message gönder (gelişmiş)
const customMessage = {
  action: 'DataTransfer',
  payload: {
    vendorId: 'CustomVendor',
    messageId: 'CustomMessage',
    data: JSON.stringify({ customField: 'value' })
  }
};

// Bu özellik gelecek versiyonlarda eklenecek
```

### Load Testing Automation
```bash
#!/bin/bash
# Load test script

TOKEN="your_token"
CSMS_URL="ws://test-csms:9220"

# 100 istasyon oluştur
for i in {1..100}; do
  curl -X POST http://localhost:3001/api/simulator/stations \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"stationId\": \"LOAD_TEST_$i\",
      \"ocppVersion\": \"1.6J\",
      \"csmsUrl\": \"$CSMS_URL\"
    }" &
done

wait
echo "100 stations created!"

# Hepsini başlat
curl -X PUT http://localhost:3001/api/simulator/stations/start-all \
  -H "Authorization: Bearer $TOKEN"
```

---

Bu guide ile EV Charging Station Simulator'ü tam kapasiteyle kullanabilir, farklı senaryoları test edebilir ve OCPP protokollerini detaylı olarak simüle edebilirsiniz! 🚀
