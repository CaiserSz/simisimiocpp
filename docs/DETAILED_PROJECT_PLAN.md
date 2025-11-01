# Şarj İstasyonu Simülatörü - Detaylı Proje Planı

**Oluşturma Tarihi:** 2025-01-11  
**Son Güncelleme:** 2025-01-11  
**Versiyon:** 1.0

---

## 📋 İçindekiler

1. [Proje Genel Bakış](#1-proje-genel-bakış)
2. [High-Level Mimari Tasarım](#2-high-level-mimari-tasarım)
3. [Low-Level Teknik Tasarım](#3-low-level-teknik-tasarım)
4. [Roadmap ve Zaman Çizelgesi](#4-roadmap-ve-zaman-çizelgesi)
5. [Sprint Planları](#5-sprint-planları)
6. [Proje Kadrosu ve Sorumluluklar](#6-proje-kadrosu-ve-sorumluluklar)
7. [Risk Yönetimi](#7-risk-yönetimi)
8. [Teknik Gereksinimler](#8-teknik-gereksinimler)

---

## 1. Proje Genel Bakış

### 1.1 Proje Tanımı

Bu proje, gerçek bir şarj istasyonu gibi davranabilen, çoklu OCPP protokol desteği sunan ve CSMS (Central System Management System) ile entegre çalışabilen bir şarj istasyonu simülatörü geliştirmeyi hedeflemektedir.

### 1.2 Proje Hedefleri

1. **Çoklu Protokol Desteği:** OCPP 1.6J ve OCPP 2.0.1 protokollerini destekleme
2. **Çoklu İstasyon Yönetimi:** Birden fazla istasyonu eş zamanlı yönetebilme
3. **Gerçekçi Simülasyon:** Araç ve EV kullanıcı etkileşimlerini gerçekçi şekilde simüle etme
4. **CSMS Entegrasyonu:** Merkezi yönetim sistemi ile tam entegrasyon
5. **Yönetim ve İzleme:** Kapsamlı yönetim paneli ve izleme paneli

### 1.3 Proje Kapsamı

#### Dahil Olanlar:
- OCPP 1.6J ve OCPP 2.0.1 protokol implementasyonları
- Çoklu istasyon simülasyonu
- Web tabanlı yönetim paneli
- Gerçek zamanlı izleme ve raporlama
- Senaryo profilleri ve otomasyon
- CSMS bağlantı yönetimi
- Şarj oturumu simülasyonu

#### Kapsam Dışı:
- Gerçek fiziksel donanım kontrolü
- Gerçek ödeme sistemi entegrasyonu
- Mobil uygulama (başlangıç aşamasında)

---

## 2. High-Level Mimari Tasarım

### 2.1 Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────┐
│                    Yönetim ve İzleme Paneli                  │
│                  (React Web Application)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ HTTP/WebSocket
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  Simülatör Yönetim Sunucusu                 │
│                    (Node.js Backend)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Station      │  │ Protocol     │  │ Scenario     │     │
│  │ Manager      │  │ Factory      │  │ Engine       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└──────┬────────────────────┬──────────────────┬──────────────┘
       │                    │                  │
       │                    │                  │
┌──────▼────────┐  ┌────────▼────────┐  ┌─────▼──────────────┐
│ Şarj İstasyonu│  │ Şarj İstasyonu  │  │ Şarj İstasyonu     │
│ Simülatörü 1  │  │ Simülatörü 2    │  │ Simülatörü N       │
│ (OCPP 1.6J)   │  │ (OCPP 2.0.1)    │  │ (OCPP 1.6J/2.0.1)  │
└──────┬────────┘  └────────┬────────┘  └─────┬──────────────┘
       │                    │                  │
       │ OCPP Protocol      │ OCPP Protocol    │ OCPP Protocol
       │                    │                  │
┌──────▼────────────────────▼──────────────────▼──────────────┐
│              CSMS (Central System Management System)         │
│              (External OCPP Server - Test/Production)        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Destek Servisleri                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ MongoDB     │  │ Redis      │  │ Prometheus │           │
│  │ (Veri)     │  │ (Cache)    │  │ (Metrics)  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Bileşen Yapısı

#### 2.2.1 Frontend (Yönetim ve İzleme Paneli)
- **Yönetim Paneli:** İstasyon konfigürasyonu, senaryo yönetimi, kullanıcı yönetimi
- **İzleme Paneli:** Gerçek zamanlı durum, metrikler, loglar, grafikler
- **Teknoloji:** React, Material-UI, Socket.io-client, Recharts

#### 2.2.2 Backend (Simülatör Yönetim Sunucusu)
- **API Sunucusu:** REST API endpoints
- **WebSocket Sunucusu:** Gerçek zamanlı veri akışı
- **İstasyon Yönetimi:** Çoklu istasyon yaşam döngüsü yönetimi
- **Protokol Yönetimi:** OCPP protokol işleyicileri
- **Teknoloji:** Node.js, Express, Socket.io, WebSocket

#### 2.2.3 Simülatör Motoru
- **İstasyon Simülatörü:** Her istasyon için bağımsız simülatör instance
- **Protokol Handlers:** OCPP 1.6J ve OCPP 2.0.1 implementasyonları
- **Senaryo Motoru:** Önceden tanımlı senaryoları çalıştırma
- **CSMS Client:** CSMS'e bağlanma ve iletişim

#### 2.2.4 Veri Katmanı
- **MongoDB:** İstasyon konfigürasyonları, şarj oturumları, loglar
- **Redis:** Gerçek zamanlı durum, cache, session yönetimi
- **Dosya Sistemi:** Senaryo profilleri, log dosyaları

#### 2.2.5 İzleme ve Metrikler
- **Prometheus:** Metrik toplama
- **Grafana:** Metrik görselleştirme
- **Logger:** Yapılandırılmış loglama (Winston/Pino)

### 2.3 Veri Akışı

#### 2.3.1 İstasyon → CSMS
1. İstasyon başlatılır
2. WebSocket bağlantısı kurulur
3. BootNotification gönderilir
4. Heartbeat periyodik olarak gönderilir
5. StatusNotification durum değişikliklerinde gönderilir
6. MeterValues şarj sırasında periyodik olarak gönderilir

#### 2.3.2 CSMS → İstasyon
1. RemoteStartTransaction: Şarj başlatma
2. RemoteStopTransaction: Şarj durdurma
3. ChangeConfiguration: Konfigürasyon değişikliği
4. GetConfiguration: Konfigürasyon sorgulama
5. Reset: İstasyon resetleme

#### 2.3.3 Yönetim Paneli → Simülatör
1. İstasyon oluşturma/güncelleme/silme
2. İstasyon bağlantı yönetimi
3. Senaryo profili çalıştırma
4. Anlık komut gönderme
5. Konfigürasyon değişikliği

#### 2.3.4 Simülatör → Yönetim Paneli
1. İstasyon durumu güncellemeleri
2. Şarj oturumu bilgileri
3. Hata bildirimleri
4. Metrikler ve istatistikler

---

## 3. Low-Level Teknik Tasarım

### 3.1 Protokol Katmanı

#### 3.1.1 BaseProtocolHandler (Soyut Sınıf)
```javascript
class BaseProtocolHandler extends EventEmitter {
  - connect(params): Promise<boolean>
  - disconnect(): Promise<boolean>
  - sendCommand(command, params): Promise<response>
  - handleMessage(message): void
  - cleanup(): Promise<void>
}
```

**Sorumlu Uzman:** Senior Backend Developer - Protocol Specialist  
**Görevler:**
- Protokol taban sınıfı tasarımı
- Ortak protokol mantığı implementasyonu
- Test framework kurulumu

#### 3.1.2 OCPP16JHandler
```javascript
class OCPP16JHandler extends BaseProtocolHandler {
  - protocolVersion: 'ocpp1.6j'
  - sendBootNotification(): Promise<BootNotificationResponse>
  - sendHeartbeat(): Promise<HeartbeatResponse>
  - sendStatusNotification(params): Promise<void>
  - sendMeterValues(params): Promise<void>
  - handleRemoteStartTransaction(params): Promise<response>
  - handleRemoteStopTransaction(params): Promise<response>
  - handleChangeConfiguration(params): Promise<response>
}
```

**Desteklenen OCPP 1.6J Mesajları:**
- BootNotification ✓
- Heartbeat ✓
- StatusNotification ✓
- Authorize
- StartTransaction
- StopTransaction
- MeterValues
- RemoteStartTransaction
- RemoteStopTransaction
- ChangeConfiguration
- GetConfiguration
- Reset
- UnlockConnector
- GetDiagnostics

**Sorumlu Uzman:** Senior Backend Developer - OCPP 1.6J Specialist  
**Görevler:**
- OCPP 1.6J spesifikasyonu uyumluluğu
- Tüm mesaj türlerinin implementasyonu
- Unit testler ve entegrasyon testleri

#### 3.1.3 OCPP201Handler
```javascript
class OCPP201Handler extends BaseProtocolHandler {
  - protocolVersion: 'ocpp2.0.1'
  - supportedProfiles: Array<string>
  - sendBootNotification(): Promise<BootNotificationResponse>
  - sendHeartbeat(): Promise<HeartbeatResponse>
  - sendStatusNotification(params): Promise<void>
  - sendMeterValues(params): Promise<void>
  - handleRequestStartTransaction(params): Promise<response>
  - handleRequestStopTransaction(params): Promise<response>
  - handleSetVariables(params): Promise<response>
  - handleGetVariables(params): Promise<response>
}
```

**Desteklenen OCPP 2.0.1 Profilleri:**
- Core
- FirmwareManagement
- LocalAuthListManagement
- RemoteTrigger
- Reservation
- SmartCharging
- TariffCost

**Sorumlu Uzman:** Senior Backend Developer - OCPP 2.0.1 Specialist  
**Görevler:**
- OCPP 2.0.1 spesifikasyonu uyumluluğu
- Profil bazlı implementasyon
- Gelişmiş özellikler (Smart Charging, Reservation)

#### 3.1.4 ProtocolFactory
```javascript
class ProtocolFactory {
  + static createHandler(protocolVersion, options): ProtocolHandler
  + static getSupportedVersions(): Array<VersionInfo>
  + static validateProtocol(version): boolean
}
```

**Sorumlu Uzman:** Lead Backend Developer  
**Görevler:**
- Factory pattern implementasyonu
- Protokol seçimi ve routing mantığı
- Protokol genişletilebilirlik tasarımı

### 3.2 İstasyon Yönetimi Katmanı

#### 3.2.1 StationManager
```javascript
class StationManager extends EventEmitter {
  - stations: Map<stationId, Station>
  - stationHandlers: Map<stationId, ProtocolHandler>
  
  + createStation(config): Promise<Station>
  + removeStation(stationId): Promise<boolean>
  + connectStation(stationId, params): Promise<Station>
  + disconnectStation(stationId): Promise<Station>
  + getStation(stationId): Station
  + getAllStations(): Array<Station>
  + sendCommand(stationId, command, params): Promise<response>
  + updateStationConfig(stationId, config): Promise<Station>
}
```

**Station Nesnesi Yapısı:**
```javascript
{
  id: string,
  name: string,
  protocol: 'ocpp1.6j' | 'ocpp2.0.1',
  status: 'disconnected' | 'connecting' | 'connected' | 'charging' | 'error',
  config: {
    vendor: string,
    model: string,
    serialNumber: string,
    firmwareVersion: string,
    connectors: Array<ConnectorConfig>,
    maxPower: number,
    capabilities: Array<string>
  },
  connectionParams: {
    csmsUrl: string,
    csmsPort: number,
    reconnectInterval: number
  },
  state: {
    connectors: Array<ConnectorState>,
    activeTransactions: Array<Transaction>,
    lastHeartbeat: Date,
    lastStatusUpdate: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Sorumlu Uzman:** Senior Backend Developer - System Architecture  
**Görevler:**
- İstasyon yaşam döngüsü yönetimi
- Çoklu istasyon koordinasyonu
- State management implementasyonu

#### 3.2.2 Station Simulator
```javascript
class StationSimulator extends EventEmitter {
  - station: Station
  - protocolHandler: ProtocolHandler
  - scenarioEngine: ScenarioEngine
  - chargingEngine: ChargingEngine
  
  + simulateCharging(session): Promise<void>
  + simulateVehicleConnect(connectorId): Promise<void>
  + simulateVehicleDisconnect(connectorId): Promise<void>
  + simulateChargingStart(transactionId): Promise<void>
  + simulateChargingStop(transactionId): Promise<void>
  + sendMeterValues(interval): void
  + updateStatus(status): void
}
```

**Sorumlu Uzman:** Senior Backend Developer - Simulation Specialist  
**Görevler:**
- Şarj simülasyonu mantığı
- Gerçekçi davranış modelleri
- Zaman bazlı senkronizasyon

### 3.3 Senaryo Yönetimi

#### 3.3.1 ScenarioEngine
```javascript
class ScenarioEngine {
  - scenarios: Map<scenarioId, Scenario>
  - activeScenarios: Map<stationId, ActiveScenario>
  
  + loadScenario(scenarioId): Promise<Scenario>
  + saveScenario(scenario): Promise<void>
  + runScenario(stationId, scenarioId): Promise<ActiveScenario>
  + stopScenario(stationId): Promise<void>
  + pauseScenario(stationId): Promise<void>
  + resumeScenario(stationId): Promise<void>
}
```

**Scenario Yapısı:**
```javascript
{
  id: string,
  name: string,
  description: string,
  protocol: 'ocpp1.6j' | 'ocpp2.0.1',
  steps: Array<{
    type: 'connect' | 'disconnect' | 'startCharging' | 'stopCharging' | 'wait' | 'configure',
    delay: number, // milliseconds
    params: object,
    conditions: Array<Condition>
  }>,
  variables: Map<string, any>,
  createdAt: Date,
  updatedAt: Date
}
```

**Sorumlu Uzman:** Senior Backend Developer - Automation Specialist  
**Görevler:**
- Senaryo motoru tasarımı
- Senaryo yürütme mekanizması
- Hata yönetimi ve geri alma

### 3.4 Şarj Oturumu Yönetimi

#### 3.4.1 Transaction Manager
```javascript
class TransactionManager {
  - transactions: Map<transactionId, Transaction>
  
  + createTransaction(params): Promise<Transaction>
  + startTransaction(transactionId): Promise<Transaction>
  + stopTransaction(transactionId): Promise<Transaction>
  + updateTransaction(transactionId, meterValues): Promise<Transaction>
  + getTransaction(transactionId): Transaction
  + getActiveTransactions(stationId): Array<Transaction>
}
```

**Transaction Yapısı:**
```javascript
{
  id: string,
  stationId: string,
  connectorId: number,
  idTag: string,
  status: 'preparing' | 'charging' | 'suspendedEVSE' | 'suspendedEV' | 'finishing' | 'completed' | 'stopped',
  startTimestamp: Date,
  stopTimestamp: Date,
  meterStart: number,
  meterStop: number,
  energyConsumed: number, // kWh
  duration: number, // seconds
  cost: number,
  meterValues: Array<MeterValue>
}
```

**Sorumlu Uzman:** Mid-Level Backend Developer  
**Görevler:**
- Transaction yaşam döngüsü yönetimi
- Metrik hesaplamaları
- Veritabanı entegrasyonu

### 3.5 API Katmanı

#### 3.5.1 REST API Endpoints

**İstasyon Yönetimi:**
```
GET    /api/stations              - Tüm istasyonları listele
POST   /api/stations              - Yeni istasyon oluştur
GET    /api/stations/:id          - İstasyon detayı
PUT    /api/stations/:id          - İstasyon güncelle
DELETE /api/stations/:id          - İstasyon sil
POST   /api/stations/:id/connect  - İstasyona bağlan
POST   /api/stations/:id/disconnect - İstasyon bağlantısını kes
POST   /api/stations/:id/commands - Komut gönder
```

**Senaryo Yönetimi:**
```
GET    /api/scenarios             - Tüm senaryoları listele
POST   /api/scenarios             - Yeni senaryo oluştur
GET    /api/scenarios/:id         - Senaryo detayı
PUT    /api/scenarios/:id         - Senaryo güncelle
DELETE /api/scenarios/:id         - Senaryo sil
POST   /api/scenarios/:id/run     - Senaryo çalıştır
POST   /api/scenarios/:id/stop    - Senaryo durdur
```

**Transaction Yönetimi:**
```
GET    /api/transactions           - Transaction listesi
GET    /api/transactions/:id      - Transaction detayı
GET    /api/stations/:id/transactions - İstasyon transactionları
```

**İzleme ve Metrikler:**
```
GET    /api/metrics/stations      - İstasyon metrikleri
GET    /api/metrics/transactions  - Transaction metrikleri
GET    /api/metrics/system        - Sistem metrikleri
```

**Sorumlu Uzman:** Senior Backend Developer - API Design  
**Görevler:**
- REST API tasarımı ve implementasyonu
- OpenAPI/Swagger dokümantasyonu
- Güvenlik ve doğrulama

#### 3.5.2 WebSocket API
```javascript
// Client → Server Events
'station:connect'
'station:disconnect'
'station:command'
'scenario:run'
'scenario:stop'

// Server → Client Events
'station:status'
'station:connected'
'station:disconnected'
'transaction:started'
'transaction:stopped'
'meter:values'
'error'
```

**Sorumlu Uzman:** Senior Backend Developer - Real-time Systems  
**Görevler:**
- WebSocket implementasyonu
- Gerçek zamanlı veri akışı optimizasyonu
- Bağlantı yönetimi ve reconnection logic

### 3.6 Frontend Bileşenleri

#### 3.6.1 Yönetim Paneli Bileşenleri

**Stations Management:**
- `StationList`: İstasyon listesi ve filtreleme
- `StationDetail`: İstasyon detay sayfası
- `StationForm`: İstasyon oluşturma/düzenleme formu
- `StationConfiguration`: İstasyon konfigürasyon editorü
- `ConnectionManager`: Bağlantı yönetimi komponenti

**Sorumlu Uzman:** Senior Frontend Developer - UI/UX Specialist  
**Görevler:**
- React component geliştirme
- Material-UI entegrasyonu
- Form validasyonları
- State management (Redux/Context)

**Scenario Management:**
- `ScenarioList`: Senaryo listesi
- `ScenarioEditor`: Senaryo editörü (visual/JSON)
- `ScenarioRunner`: Senaryo çalıştırma arayüzü
- `ScenarioHistory`: Senaryo çalışma geçmişi

**Sorumlu Uzman:** Senior Frontend Developer - Complex UI  
**Görevler:**
- Senaryo editör geliştirme
- Drag-and-drop arayüz
- Senaryo görselleştirme

#### 3.6.2 İzleme Paneli Bileşenleri

**Monitoring Dashboard:**
- `OverviewDashboard`: Genel bakış dashboard
- `StationMonitor`: İstasyon canlı izleme
- `TransactionMonitor`: Transaction izleme
- `MetricsChart`: Metrik grafikleri
- `LogViewer`: Log görüntüleyici
- `AlertPanel`: Uyarı paneli

**Sorumlu Uzman:** Senior Frontend Developer - Data Visualization  
**Görevler:**
- Dashboard tasarımı
- Gerçek zamanlı grafik implementasyonu
- Chart kütüphanesi entegrasyonu (Recharts/Chart.js)

**Real-time Updates:**
- WebSocket bağlantı yönetimi
- Otomatik veri yenileme
- Optimistic UI updates

**Sorumlu Uzman:** Mid-Level Frontend Developer  
**Görevler:**
- WebSocket client implementasyonu
- State synchronization
- Error handling ve retry logic

### 3.7 Veri Katmanı

#### 3.7.1 MongoDB Şemaları

**Station Schema:**
```javascript
{
  _id: ObjectId,
  stationId: String (unique, indexed),
  name: String,
  protocol: String ('ocpp1.6j' | 'ocpp2.0.1'),
  config: {
    vendor: String,
    model: String,
    serialNumber: String,
    firmwareVersion: String,
    connectors: [{
      connectorId: Number,
      connectorType: String,
      maxPower: Number,
      status: String
    }],
    maxPower: Number,
    capabilities: [String]
  },
  connectionParams: {
    csmsUrl: String,
    csmsPort: Number,
    reconnectInterval: Number
  },
  status: String,
  lastHeartbeat: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Transaction Schema:**
```javascript
{
  _id: ObjectId,
  transactionId: String (unique, indexed),
  stationId: String (indexed),
  connectorId: Number,
  idTag: String,
  status: String,
  startTimestamp: Date (indexed),
  stopTimestamp: Date,
  meterStart: Number,
  meterStop: Number,
  energyConsumed: Number,
  duration: Number,
  cost: Number,
  meterValues: [{
    timestamp: Date,
    sampledValue: {
      value: Number,
      unit: String,
      measurand: String,
      phase: String
    }
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Scenario Schema:**
```javascript
{
  _id: ObjectId,
  scenarioId: String (unique, indexed),
  name: String,
  description: String,
  protocol: String,
  steps: [{
    type: String,
    delay: Number,
    params: Object,
    conditions: [Object]
  }],
  variables: Object,
  createdAt: Date,
  updatedAt: Date
}
```

**Sorumlu Uzman:** Senior Backend Developer - Database Specialist  
**Görevler:**
- MongoDB şema tasarımı
- İndeks optimizasyonu
- Migration scriptleri
- Veri bütünlüğü kontrolü

#### 3.7.2 Redis Yapısı

**Cache Keys:**
```
station:{stationId}:status          - İstasyon durumu
station:{stationId}:lastHeartbeat   - Son heartbeat zamanı
station:{stationId}:connectors      - Konnektör durumları
transaction:{transactionId}         - Aktif transaction
active:stations                     - Aktif istasyon listesi
active:transactions                 - Aktif transaction listesi
```

**Sorumlu Uzman:** Mid-Level Backend Developer  
**Görevler:**
- Redis key yapısı tasarımı
- Cache stratejileri
- TTL yönetimi

### 3.8 İzleme ve Loglama

#### 3.8.1 Metrikler (Prometheus)

**Station Metrics:**
- `station_connected_total`: Bağlı istasyon sayısı
- `station_charging_active`: Aktif şarj sayısı
- `station_heartbeat_duration_seconds`: Heartbeat süresi
- `station_command_duration_seconds`: Komut yürütme süresi

**Transaction Metrics:**
- `transaction_duration_seconds`: Transaction süresi
- `transaction_energy_kwh`: Enerji tüketimi
- `transaction_cost_total`: Toplam maliyet

**System Metrics:**
- `system_cpu_usage`: CPU kullanımı
- `system_memory_usage`: Bellek kullanımı
- `system_websocket_connections`: WebSocket bağlantı sayısı

**Sorumlu Uzman:** DevOps Engineer - Monitoring Specialist  
**Görevler:**
- Prometheus metrik implementasyonu
- Grafana dashboard tasarımı
- Alert kuralları

#### 3.8.2 Loglama

**Log Levels:**
- ERROR: Hatalar ve kritik durumlar
- WARN: Uyarılar
- INFO: Bilgilendirme
- DEBUG: Debug bilgileri
- TRACE: Detaylı izleme

**Log Kategorileri:**
- Protocol: OCPP mesaj logları
- Station: İstasyon işlemleri
- Transaction: Şarj oturumları
- System: Sistem olayları
- API: API istekleri

**Sorumlu Uzman:** Mid-Level Backend Developer  
**Görevler:**
- Structured logging implementasyonu
- Log rotation ve yönetimi
- Log aggregation setup

---

## 4. Roadmap ve Zaman Çizelgesi

### 4.1 Fazlar ve Milestone'lar

#### Faz 1: Temel Altyapı (Hafta 1-4)
**Milestone 1.1: Protokol Altyapısı** (Hafta 2)
- BaseProtocolHandler tamamlanır
- OCPP 1.6J temel mesajlar implemente edilir
- OCPP 2.0.1 temel mesajlar implemente edilir

**Milestone 1.2: İstasyon Yönetimi** (Hafta 3)
- StationManager temel fonksiyonlar
- Çoklu istasyon desteği
- Bağlantı yönetimi

**Milestone 1.3: API ve Frontend Temeli** (Hafta 4)
- REST API endpoints
- Temel frontend bileşenleri
- WebSocket entegrasyonu

#### Faz 2: Simülasyon Motoru (Hafta 5-8)
**Milestone 2.1: Şarj Simülasyonu** (Hafta 6)
- ChargingEngine implementasyonu
- Transaction yönetimi
- MeterValues simülasyonu

**Milestone 2.2: CSMS Entegrasyonu** (Hafta 7)
- CSMS bağlantı yönetimi
- Tüm OCPP mesajlarının desteği
- Reconnection logic

**Milestone 2.3: Senaryo Motoru** (Hafta 8)
- ScenarioEngine implementasyonu
- Senaryo editörü
- Senaryo yürütme mekanizması

#### Faz 3: Gelişmiş Özellikler (Hafta 9-12)
**Milestone 3.1: İzleme ve Raporlama** (Hafta 10)
- Dashboard implementasyonu
- Metrik toplama ve görselleştirme
- Log yönetimi

**Milestone 3.2: Konfigürasyon Yönetimi** (Hafta 11)
- Dinamik konfigürasyon değişikliği
- Profil yönetimi
- Anlık kontrol komutları

**Milestone 3.3: Test ve Optimizasyon** (Hafta 12)
- Kapsamlı test suite
- Performans optimizasyonu
- Dokümantasyon

### 4.2 Detaylı Zaman Çizelgesi

| Hafta | Sprint | Ana Görevler | Sorumlu Ekip |
|-------|--------|--------------|--------------|
| 1 | Sprint 1 | Proje kurulumu, Protokol handler temeli | Tüm Ekip |
| 2 | Sprint 1 | OCPP 1.6J implementasyonu | Protocol Team |
| 3 | Sprint 1 | OCPP 2.0.1 implementasyonu, StationManager | Protocol Team, Backend Team |
| 4 | Sprint 1 | API endpoints, Frontend temel bileşenler | Backend Team, Frontend Team |
| 5 | Sprint 2 | Şarj simülasyonu mantığı | Simulation Team |
| 6 | Sprint 2 | Transaction yönetimi, MeterValues | Backend Team |
| 7 | Sprint 2 | CSMS entegrasyonu, Reconnection | Backend Team |
| 8 | Sprint 2 | Senaryo motoru, Senaryo editörü | Automation Team |
| 9 | Sprint 3 | Dashboard, Metrik toplama | Frontend Team, DevOps |
| 10 | Sprint 3 | İzleme paneli, Grafikler | Frontend Team |
| 11 | Sprint 3 | Konfigürasyon yönetimi, Anlık kontrol | Backend Team, Frontend Team |
| 12 | Sprint 3 | Test, Optimizasyon, Dokümantasyon | Tüm Ekip |

---

## 5. Sprint Planları

### 5.1 Sprint 1: Temel Altyapı ve Çoklu Protokol Desteği
**Süre:** 4 Hafta (Hafta 1-4)  
**Sprint Goal:** Çalışan OCPP 1.6J ve OCPP 2.0.1 çekirdeği ile temel arayüz

#### Sprint Backlog

**Protokol Katmanı:**
- [ ] BaseProtocolHandler soyut sınıfı
- [ ] OCPP 1.6J handler - Temel mesajlar (BootNotification, Heartbeat, StatusNotification)
- [ ] OCPP 1.6J handler - Transaction mesajları (StartTransaction, StopTransaction, MeterValues)
- [ ] OCPP 1.6J handler - Remote mesajları (RemoteStartTransaction, RemoteStopTransaction)
- [ ] OCPP 2.0.1 handler - Temel mesajlar
- [ ] OCPP 2.0.1 handler - Core profil mesajları
- [ ] ProtocolFactory implementasyonu
- [ ] Protokol unit testleri

**İstasyon Yönetimi:**
- [ ] StationManager temel fonksiyonlar (create, remove, get)
- [ ] Çoklu istasyon desteği
- [ ] İstasyon bağlantı yönetimi
- [ ] İstasyon durum yönetimi
- [ ] Event emitter entegrasyonu

**API Katmanı:**
- [ ] REST API - İstasyon CRUD endpoints
- [ ] REST API - İstasyon bağlantı endpoints
- [ ] REST API - Komut gönderme endpoints
- [ ] WebSocket server kurulumu
- [ ] WebSocket event yönetimi
- [ ] API dokümantasyonu (Swagger)

**Frontend:**
- [ ] Proje yapısı kurulumu
- [ ] İstasyon listesi bileşeni
- [ ] İstasyon oluşturma/düzenleme formu
- [ ] İstasyon durum göstergeleri
- [ ] WebSocket client entegrasyonu
- [ ] Temel routing ve layout

**Veri Katmanı:**
- [ ] MongoDB bağlantı kurulumu
- [ ] Station schema tanımlama
- [ ] Station CRUD operasyonları
- [ ] Redis cache yapısı
- [ ] Veri migration scriptleri

**Test:**
- [ ] Unit test framework kurulumu
- [ ] Protokol handler testleri
- [ ] StationManager testleri
- [ ] API endpoint testleri

**Sorumlu Kişiler:**
- **Sprint Master:** Lead Backend Developer
- **Protokol Geliştirme:** Senior Backend Developer - Protocol Specialist × 2
- **Backend Geliştirme:** Senior Backend Developer × 1, Mid-Level Backend Developer × 2
- **Frontend Geliştirme:** Senior Frontend Developer × 1, Mid-Level Frontend Developer × 1
- **Test:** QA Engineer × 1

### 5.2 Sprint 2: Simülasyon Motoru ve CSMS Entegrasyonu
**Süre:** 4 Hafta (Hafta 5-8)  
**Sprint Goal:** Çalışan şarj simülasyonu ve CSMS entegrasyonu

#### Sprint Backlog

**Şarj Simülasyonu:**
- [ ] ChargingEngine implementasyonu
- [ ] Şarj başlatma simülasyonu
- [ ] Şarj durdurma simülasyonu
- [ ] Araç bağlantı simülasyonu
- [ ] Araç bağlantı kesme simülasyonu
- [ ] MeterValues simülasyonu (gerçekçi değerler)
- [ ] Enerji hesaplama mantığı

**Transaction Yönetimi:**
- [ ] TransactionManager implementasyonu
- [ ] Transaction yaşam döngüsü
- [ ] Transaction veritabanı şeması
- [ ] Transaction API endpoints
- [ ] Transaction metrikleri

**CSMS Entegrasyonu:**
- [ ] CSMS bağlantı yönetimi
- [ ] OCPP 1.6J tam mesaj desteği
- [ ] OCPP 2.0.1 tam mesaj desteği
- [ ] Reconnection logic
- [ ] Hata yönetimi ve retry mekanizması
- [ ] CSMS entegrasyon testleri

**Senaryo Motoru:**
- [ ] ScenarioEngine tasarımı
- [ ] Senaryo yürütme mekanizması
- [ ] Senaryo duraklatma/devam ettirme
- [ ] Senaryo hata yönetimi
- [ ] Senaryo veritabanı şeması

**Senaryo Editörü:**
- [ ] Senaryo listesi bileşeni
- [ ] Senaryo editör arayüzü (JSON/Visual)
- [ ] Senaryo çalıştırma arayüzü
- [ ] Senaryo geçmişi görüntüleme

**Frontend Geliştirmeleri:**
- [ ] Şarj kontrol bileşenleri
- [ ] Transaction izleme bileşeni
- [ ] Senaryo yönetim sayfaları
- [ ] Gerçek zamanlı durum güncellemeleri

**Sorumlu Kişiler:**
- **Sprint Master:** Senior Backend Developer - System Architecture
- **Simülasyon Geliştirme:** Senior Backend Developer - Simulation Specialist × 2
- **Backend Geliştirme:** Senior Backend Developer × 2, Mid-Level Backend Developer × 2
- **Frontend Geliştirme:** Senior Frontend Developer × 1, Mid-Level Frontend Developer × 2
- **Test:** QA Engineer × 2

### 5.3 Sprint 3: Gelişmiş Özellikler ve Optimizasyon
**Süre:** 4 Hafta (Hafta 9-12)  
**Sprint Goal:** Tam özellikli yönetim ve izleme paneli, optimizasyon

#### Sprint Backlog

**İzleme Paneli:**
- [ ] Overview dashboard tasarımı
- [ ] İstasyon canlı izleme sayfası
- [ ] Transaction izleme sayfası
- [ ] Metrik grafikleri (Recharts)
- [ ] Log görüntüleyici
- [ ] Uyarı ve bildirim sistemi

**Metrikler ve İzleme:**
- [ ] Prometheus metrik implementasyonu
- [ ] Grafana dashboard kurulumu
- [ ] Alert kuralları
- [ ] Performans metrikleri
- [ ] Sistem sağlık kontrolleri

**Konfigürasyon Yönetimi:**
- [ ] Dinamik konfigürasyon değişikliği
- [ ] OCPP ChangeConfiguration desteği
- [ ] OCPP GetConfiguration desteği
- [ ] Konfigürasyon editörü
- [ ] Konfigürasyon geçmişi

**Anlık Kontrol:**
- [ ] RemoteStartTransaction UI
- [ ] RemoteStopTransaction UI
- [ ] Reset komutu
- [ ] UnlockConnector komutu
- [ ] Komut geçmişi

**Gelişmiş Senaryo Özellikleri:**
- [ ] Senaryo şablonları
- [ ] Senaryo paylaşımı
- [ ] Senaryo import/export
- [ ] Senaryo zamanlayıcı (scheduled scenarios)

**Test ve Kalite:**
- [ ] E2E testler (Cypress)
- [ ] Entegrasyon testleri
- [ ] Performans testleri
- [ ] Yük testleri
- [ ] Kod kapsamı analizi

**Dokümantasyon:**
- [ ] Kullanıcı kılavuzu
- [ ] API dokümantasyonu
- [ ] Geliştirici dokümantasyonu
- [ ] Deployment kılavuzu
- [ ] Troubleshooting kılavuzu

**Optimizasyon:**
- [ ] Veritabanı sorgu optimizasyonu
- [ ] Cache stratejileri
- [ ] WebSocket performans optimizasyonu
- [ ] Frontend bundle optimizasyonu
- [ ] Memory leak kontrolleri

**Sorumlu Kişiler:**
- **Sprint Master:** Lead Backend Developer
- **Frontend Geliştirme:** Senior Frontend Developer × 2, Mid-Level Frontend Developer × 2
- **Backend Geliştirme:** Senior Backend Developer × 2, Mid-Level Backend Developer × 1
- **DevOps:** DevOps Engineer × 1
- **Test:** QA Engineer × 2
- **Teknik Yazarlar:** Technical Writer × 1

---

## 6. Proje Kadrosu ve Sorumluluklar

### 6.1 Yönetim Kadrosu

#### Proje Yöneticisi (Project Manager)
**Sorumluluklar:**
- Proje planlaması ve takip
- Kaynak yönetimi
- Risk yönetimi
- İletişim koordinasyonu
- Milestone takibi

#### Teknik Lider (Tech Lead)
**Sorumluluklar:**
- Teknik mimari kararlar
- Kod review ve standartlar
- Teknik borç yönetimi
- Teknik mentörlük

### 6.2 Geliştirme Ekibi

#### Lead Backend Developer
**Sorumluluklar:**
- Backend mimari tasarım
- Kritik kod geliştirme
- Code review
- Teknik kararlar

#### Senior Backend Developer - Protocol Specialist (OCPP 1.6J)
**Sorumluluklar:**
- OCPP 1.6J protokol implementasyonu
- Protokol uyumluluk testleri
- Protokol spesifikasyonu takibi
- **Özel Görevler:**
  - BaseProtocolHandler tasarımı
  - OCPP16JHandler implementasyonu
  - OCPP 1.6J mesaj validasyonu

#### Senior Backend Developer - Protocol Specialist (OCPP 2.0.1)
**Sorumluluklar:**
- OCPP 2.0.1 protokol implementasyonu
- Profil bazlı geliştirme
- Protokol uyumluluk testleri
- **Özel Görevler:**
  - OCPP201Handler implementasyonu
  - Smart Charging desteği
  - Reservation desteği

#### Senior Backend Developer - System Architecture
**Sorumluluklar:**
- Sistem mimari tasarım
- İstasyon yönetimi implementasyonu
- Çoklu istasyon koordinasyonu
- **Özel Görevler:**
  - StationManager geliştirme
  - Event-driven architecture
  - State management

#### Senior Backend Developer - Simulation Specialist
**Sorumluluklar:**
- Şarj simülasyonu geliştirme
- Gerçekçi davranış modelleri
- Senaryo motoru geliştirme
- **Özel Görevler:**
  - ChargingEngine implementasyonu
  - StationSimulator geliştirme
  - MeterValues simülasyonu

#### Senior Backend Developer - API Design
**Sorumluluklar:**
- REST API tasarımı ve geliştirme
- API dokümantasyonu
- Güvenlik ve doğrulama
- **Özel Görevler:**
  - API endpoint implementasyonu
  - Swagger dokümantasyonu
  - Authentication/Authorization

#### Senior Backend Developer - Real-time Systems
**Sorumluluklar:**
- WebSocket implementasyonu
- Gerçek zamanlı veri akışı
- Bağlantı yönetimi
- **Özel Görevler:**
  - WebSocket server optimizasyonu
  - Reconnection logic
  - Real-time synchronization

#### Senior Backend Developer - Automation Specialist
**Sorumluluklar:**
- Senaryo motoru geliştirme
- Otomasyon mekanizmaları
- Senaryo yürütme optimizasyonu
- **Özel Görevler:**
  - ScenarioEngine implementasyonu
  - Senaryo editör backend
  - Senaryo scheduling

#### Senior Backend Developer - Database Specialist
**Sorumluluklar:**
- Veritabanı tasarımı
- Optimizasyon
- Migration yönetimi
- **Özel Görevler:**
  - MongoDB şema tasarımı
  - İndeks optimizasyonu
  - Data integrity

#### Mid-Level Backend Developer × 3
**Sorumluluklar:**
- Feature geliştirme
- Bug fix
- Unit test yazma
- Kod review katılımı
- **Özel Görevler:**
  - Transaction Manager
  - Redis cache implementasyonu
  - Logging sistemi

### 6.3 Frontend Ekibi

#### Lead Frontend Developer
**Sorumluluklar:**
- Frontend mimari kararlar
- Kod review
- Teknik mentörlük

#### Senior Frontend Developer - UI/UX Specialist
**Sorumluluklar:**
- UI/UX tasarım
- Component geliştirme
- Form validasyonları
- **Özel Görevler:**
  - Station management UI
  - Form components
  - Material-UI entegrasyonu

#### Senior Frontend Developer - Complex UI
**Sorumluluklar:**
- Karmaşık UI bileşenleri
- Drag-and-drop arayüzler
- Görselleştirme
- **Özel Görevler:**
  - Senaryo editör geliştirme
  - Visual scenario builder
  - Configuration editor

#### Senior Frontend Developer - Data Visualization
**Sorumluluklar:**
- Dashboard geliştirme
- Grafik ve chart implementasyonu
- Veri görselleştirme
- **Özel Görevler:**
  - Monitoring dashboard
  - Metrics charts
  - Real-time data visualization

#### Mid-Level Frontend Developer × 3
**Sorumluluklar:**
- Component geliştirme
- UI implementasyonu
- State management
- **Özel Görevler:**
  - WebSocket client
  - Real-time updates
  - Error handling

### 6.4 DevOps ve Altyapı

#### DevOps Engineer - Monitoring Specialist
**Sorumluluklar:**
- İzleme sistemleri kurulumu
- Metrik toplama
- Alert yönetimi
- **Özel Görevler:**
  - Prometheus kurulumu
  - Grafana dashboard tasarımı
  - Alert kuralları

#### DevOps Engineer
**Sorumluluklar:**
- CI/CD pipeline
- Containerization
- Deployment automation
- **Özel Görevler:**
  - Docker yapılandırması
  - Kubernetes deployment (opsiyonel)
  - CI/CD pipeline

### 6.5 Test Ekibi

#### QA Engineer - Test Automation Specialist
**Sorumluluklar:**
- Test otomasyonu
- E2E testler
- Test framework geliştirme
- **Özel Görevler:**
  - Cypress test suite
  - API test automation
  - Performance testing

#### QA Engineer × 2
**Sorumluluklar:**
- Manuel test
- Test case yazma
- Bug reportlama
- Regression testing

### 6.5 Dokümantasyon

#### Technical Writer
**Sorumluluklar:**
- Kullanıcı dokümantasyonu
- API dokümantasyonu
- Geliştirici kılavuzları
- Deployment dokümantasyonu

---

## 7. Risk Yönetimi

### 7.1 Teknik Riskler

| Risk | Olasılık | Etki | Azaltma Stratejisi | Sorumlu |
|------|----------|------|-------------------|---------|
| OCPP protokol uyumluluk sorunları | Orta | Yüksek | Erken prototipleme, CSMS test ortamı | Protocol Specialists |
| Çoklu istasyon performans sorunları | Orta | Orta | Yük testleri, optimizasyon | System Architecture Specialist |
| WebSocket bağlantı sorunları | Düşük | Yüksek | Robust reconnection logic, monitoring | Real-time Systems Specialist |
| Gerçek zamanlı veri senkronizasyonu | Orta | Orta | Cache stratejileri, optimistic UI | Frontend Team Lead |
| Veritabanı performans sorunları | Düşük | Orta | İndeks optimizasyonu, query optimization | Database Specialist |

### 7.2 Proje Riskleri

| Risk | Olasılık | Etki | Azaltma Stratejisi | Sorumlu |
|------|----------|------|-------------------|---------|
| Timeline gecikmesi | Orta | Orta | Buffer time, önceliklendirme | Project Manager |
| Kaynak eksikliği | Düşük | Yüksek | Erken kaynak planlaması | Project Manager |
| Gereksinim değişiklikleri | Orta | Orta | Agile methodology, frequent communication | Tech Lead |
| Teknik borç birikimi | Yüksek | Orta | Code review, refactoring sprintleri | Tech Lead |

### 7.3 Risk İzleme

- Haftalık risk review toplantıları
- Risk register güncellemeleri
- Erken uyarı sistemleri

---

## 8. Teknik Gereksinimler

### 8.1 Yazılım Gereksinimleri

**Backend:**
- Node.js 20+
- Express.js
- MongoDB 6.0+
- Redis 7.0+
- WebSocket (ws library)
- Socket.io

**Frontend:**
- React 18+
- Material-UI 5+
- Recharts / Chart.js
- Socket.io-client
- React Router

**DevOps:**
- Docker & Docker Compose
- Prometheus
- Grafana
- Nginx (reverse proxy)

**Test:**
- Jest
- Cypress
- Mocha/Chai
- Supertest

### 8.2 Altyapı Gereksinimleri

**Geliştirme Ortamı:**
- CPU: 4+ cores
- RAM: 8GB+
- Disk: 50GB+

**Test Ortamı:**
- CPU: 8+ cores
- RAM: 16GB+
- Disk: 100GB+

**Production Ortamı (Önerilen):**
- CPU: 16+ cores
- RAM: 32GB+
- Disk: 500GB+ SSD
- Network: 1Gbps+

### 8.3 Güvenlik Gereksinimleri

- HTTPS/TLS şifreleme
- JWT authentication
- Role-based access control (RBAC)
- Input validation ve sanitization
- SQL injection koruması
- XSS koruması
- Rate limiting
- CORS yapılandırması

---

## 9. Başarı Kriterleri

### 9.1 Fonksiyonel Kriterler

- [ ] OCPP 1.6J tam protokol desteği
- [ ] OCPP 2.0.1 tam protokol desteği
- [ ] Eş zamanlı 50+ istasyon simülasyonu
- [ ] Gerçek zamanlı durum güncellemeleri (<1 saniye gecikme)
- [ ] Senaryo profili çalıştırma
- [ ] CSMS entegrasyonu
- [ ] Şarj oturumu simülasyonu

### 9.2 Performans Kriterleri

- [ ] API response time < 200ms (p95)
- [ ] WebSocket message latency < 50ms
- [ ] Sistem uptime > 99.5%
- [ ] Memory usage < 4GB (100 istasyon için)
- [ ] CPU usage < 70% (normal yük)

### 9.3 Kalite Kriterleri

- [ ] Kod kapsamı > 80%
- [ ] Tüm kritik path'ler test edilmiş
- [ ] Dokümantasyon tamamlanmış
- [ ] Güvenlik açığı taraması yapılmış

---

## 10. İletişim ve İşbirliği

### 10.1 Toplantılar

- **Daily Standup:** Her gün 15 dakika
- **Sprint Planning:** Sprint başında (2 saat)
- **Sprint Review:** Sprint sonunda (2 saat)
- **Retrospective:** Sprint sonunda (1 saat)
- **Backlog Refinement:** Haftada 1 kez (1 saat)

### 10.2 İletişim Kanalları

- **Slack/Teams:** Günlük iletişim
- **GitHub Issues:** Task takibi
- **Confluence/Notion:** Dokümantasyon
- **Jira/Azure DevOps:** Proje yönetimi

### 10.3 Kod Yönetimi

- **Git Workflow:** Git Flow veya GitHub Flow
- **Branch Strategy:** feature/, bugfix/, hotfix/
- **Code Review:** Tüm PR'lar review edilmeli
- **CI/CD:** Otomatik test ve deployment

---

## 11. Dokümantasyon Yapısı

```
docs/
├── architecture/
│   ├── high-level-design.md
│   ├── low-level-design.md
│   └── database-schema.md
├── api/
│   ├── rest-api.md
│   ├── websocket-api.md
│   └── swagger.yaml
├── guides/
│   ├── user-guide.md
│   ├── developer-guide.md
│   ├── deployment-guide.md
│   └── troubleshooting.md
├── protocols/
│   ├── ocpp1.6j-implementation.md
│   └── ocpp2.0.1-implementation.md
└── scenarios/
    ├── scenario-examples.md
    └── scenario-builder-guide.md
```

---

**Dokümantasyon Versiyonu:** 1.0  
**Son Güncelleme:** 2025-01-11  
**Sonraki İnceleme:** 2025-01-25