# 🌐 WebSocket Events Documentation

## Overview

EV Charging Station Simulator gerçek zamanlı olayları WebSocket aracılığıyla frontend'e iletir. Bu dokümantasyon tüm mevcut olayları, formatlarını ve kullanım örneklerini içerir.

## Connection & Authentication

### Bağlantı Kurma

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your_jwt_token_here'
  },
  transports: ['websocket', 'polling']
});
```

### Connection Events

#### `connect`
Sunucuya başarılı bağlantı kurulduğunda tetiklenir.

```javascript
socket.on('connect', () => {
  console.log('Connected to server:', socket.id);
});
```

#### `disconnect`
Bağlantı kesildiğinde tetiklenir.

```javascript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

#### `error`
Bağlantı hatası oluştuğunda tetiklenir.

```javascript
socket.on('error', (error) => {
  console.error('Connection error:', error);
});
```

---

## Subscription Events

### Station Subscription

Belirli bir istasyonu takip etmek için:

```javascript
socket.emit('subscribe:station', { stationId: 'SIM_001' });
```

### Role-based Rooms

Kullanıcı rolüne göre otomatik olarak odalara dahil edilir:

- `admin` - Tüm sistem olayları
- `operator` - Operasyon olayları
- `user` - Sınırlı olaylar

---

## Simulation Events

### `simulation:started`
Simülasyon başladığında tetiklenir.

```javascript
socket.on('simulation:started', (data) => {
  console.log('Simulation started:', data);
});
```

**Data Format:**
```json
{
  "stationCount": 15,
  "startTime": "2024-01-15T10:30:00.000Z"
}
```

### `simulation:stopped`
Simülasyon durduğunda tetiklenir.

```javascript
socket.on('simulation:stopped', (data) => {
  console.log('Simulation stopped:', data);
});
```

**Data Format:**
```json
{
  "stationCount": 15,
  "duration": 3600,
  "endTime": "2024-01-15T11:30:00.000Z"
}
```

---

## Station Events

### `station:created`
Yeni istasyon oluşturulduğunda tetiklenir.

```javascript
socket.on('station:created', (data) => {
  console.log('New station created:', data);
});
```

**Data Format:**
```json
{
  "station": {
    "stationId": "SIM_URBAN_AC_001",
    "vendor": "UrbanCharge",
    "model": "UC-AC-7",
    "protocol": "1.6J",
    "status": "Available",
    "connectors": 2
  }
}
```

### `station:started`
İstasyon başladığında tetiklenir.

```javascript
socket.on('station:started', (data) => {
  console.log('Station started:', data);
});
```

**Data Format:**
```json
{
  "stationId": "SIM_001",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "protocol": "1.6J",
  "csmsUrl": "ws://localhost:9220"
}
```

### `station:stopped`
İstasyon durduğunda tetiklenir.

```javascript
socket.on('station:stopped', (data) => {
  console.log('Station stopped:', data);
});
```

### `station:status`
İstasyon durumu değiştiğinde tetiklenir.

```javascript
socket.on('station:status', (data) => {
  console.log('Station status update:', data);
});
```

**Data Format:**
```json
{
  "stationId": "SIM_001",
  "status": "Available",
  "isOnline": true,
  "connectors": [
    {
      "connectorId": 1,
      "status": "Available",
      "currentPower": 0,
      "hasActiveTransaction": false
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Charging Events

### `charging:started`
Şarj başladığında tetiklenir.

```javascript
socket.on('charging:started', (data) => {
  console.log('Charging session started:', data);
  updateChargingIndicator(data.stationId, data.connectorId, true);
});
```

**Data Format:**
```json
{
  "stationId": "SIM_001",
  "connectorId": 1,
  "transaction": {
    "transactionId": 123456,
    "idTag": "RFID_USER_001",
    "startTime": "2024-01-15T10:30:00.000Z",
    "startMeterValue": 0
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### `charging:stopped`
Şarj durduğunda tetiklenir.

```javascript
socket.on('charging:stopped', (data) => {
  console.log('Charging session stopped:', data);
  updateChargingIndicator(data.stationId, data.connectorId, false);
  showSessionSummary(data.transaction);
});
```

**Data Format:**
```json
{
  "stationId": "SIM_001",
  "connectorId": 1,
  "transaction": {
    "transactionId": 123456,
    "idTag": "RFID_USER_001",
    "startTime": "2024-01-15T10:30:00.000Z",
    "endTime": "2024-01-15T11:15:00.000Z",
    "duration": 2700,
    "energyDelivered": 12.5
  },
  "timestamp": "2024-01-15T11:15:00.000Z"
}
```

---

## Real-time Meter Values

### `meter:values`
Gerçek zamanlı ölçüm değerleri.

```javascript
socket.on('meter:values', (data) => {
  updatePowerChart(data);
  updateEnergyDisplay(data);
});
```

**Data Format:**
```json
{
  "stationId": "SIM_001",
  "connectorId": 1,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "values": {
    "power": 7400,
    "energy": 2.5,
    "voltage": 230,
    "current": 32.2,
    "temperature": 35
  }
}
```

### Real-time Chart Integration

```javascript
// Power chart update example
let powerChart;

socket.on('meter:values', (data) => {
  if (powerChart && data.stationId === selectedStationId) {
    powerChart.data.labels.push(new Date(data.timestamp).toLocaleTimeString());
    powerChart.data.datasets[0].data.push(data.values.power / 1000); // Convert to kW
    
    // Keep only last 50 points
    if (powerChart.data.labels.length > 50) {
      powerChart.data.labels.shift();
      powerChart.data.datasets[0].data.shift();
    }
    
    powerChart.update('none'); // No animation for real-time
  }
});
```

---

## Vehicle Events

### `vehicle:connected`
Araç bağlandığında tetiklenir.

```javascript
socket.on('vehicle:connected', (data) => {
  console.log('Vehicle connected:', data);
  showVehicleInfo(data);
});
```

**Data Format:**
```json
{
  "stationId": "SIM_001",
  "connectorId": 1,
  "vehicle": {
    "vehicleId": "EV_001",
    "vehicleType": "sedan",
    "currentSoC": 25,
    "targetSoC": 80,
    "batteryCapacity": 75,
    "estimatedRange": 90
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### `vehicle:disconnected`
Araç bağlantısı kesildiğinde tetiklenir.

```javascript
socket.on('vehicle:disconnected', (data) => {
  console.log('Vehicle disconnected:', data);
  hideVehicleInfo(data.stationId, data.connectorId);
});
```

---

## Scenario Events

### `scenario:started`
Senaryo başladığında tetiklenir.

```javascript
socket.on('scenario:started', (data) => {
  console.log('Scenario started:', data);
  showScenarioStatus(data);
});
```

**Data Format:**
```json
{
  "scenarioId": "urban_mixed",
  "scenario": {
    "name": "Urban Mixed Charging",
    "duration": 3600,
    "description": "Mixed AC and DC charging simulation"
  },
  "stationCount": 13,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### `scenario:event`
Senaryo olayı tetiklendiğinde.

```javascript
socket.on('scenario:event', (data) => {
  console.log('Scenario event:', data);
  showScenarioNotification(data);
});
```

**Data Format:**
```json
{
  "action": "peak_hour_start",
  "description": "Peak hour traffic simulation started",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## CSMS Connection Events

### `csms:connected`
CSMS'ye bağlantı kurulduğunda tetiklenir.

```javascript
socket.on('csms:connected', (data) => {
  updateConnectionStatus(data.stationId, 'connected');
});
```

### `csms:disconnected`
CSMS bağlantısı kesildiğinde tetiklenir.

```javascript
socket.on('csms:disconnected', (data) => {
  updateConnectionStatus(data.stationId, 'disconnected');
});
```

---

## Dashboard Events

### `dashboard:summary`
Dashboard özet bilgileri.

```javascript
socket.on('dashboard:summary', (data) => {
  updateDashboardSummary(data);
});
```

**Data Format:**
```json
{
  "stations": {
    "total": 15,
    "online": 12,
    "charging": 8,
    "available": 4
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Error Handling

### `error`
Genel hata olayları.

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  showErrorNotification(error.message);
});
```

### `station:error`
İstasyon hata olayları.

```javascript
socket.on('station:error', (data) => {
  console.error('Station error:', data);
  showStationError(data.stationId, data.error);
});
```

---

## Complete Frontend Integration Example

```javascript
import io from 'socket.io-client';

class SimulatorDashboard {
  constructor(token) {
    this.socket = io('http://localhost:3001', {
      auth: { token }
    });
    
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    // Connection events
    this.socket.on('connect', () => {
      this.updateConnectionStatus('connected');
    });
    
    this.socket.on('disconnect', () => {
      this.updateConnectionStatus('disconnected');
    });
    
    // Simulation events
    this.socket.on('simulation:started', (data) => {
      this.showNotification('Simulation started', 'success');
      this.updateSimulationStatus(true);
    });
    
    this.socket.on('simulation:stopped', (data) => {
      this.showNotification('Simulation stopped', 'info');
      this.updateSimulationStatus(false);
    });
    
    // Station events
    this.socket.on('station:created', (data) => {
      this.addStationToGrid(data.station);
    });
    
    this.socket.on('station:started', (data) => {
      this.updateStationStatus(data.stationId, 'online');
    });
    
    this.socket.on('station:stopped', (data) => {
      this.updateStationStatus(data.stationId, 'offline');
    });
    
    // Charging events
    this.socket.on('charging:started', (data) => {
      this.updateConnectorStatus(data.stationId, data.connectorId, 'charging');
      this.incrementActiveCharging();
    });
    
    this.socket.on('charging:stopped', (data) => {
      this.updateConnectorStatus(data.stationId, data.connectorId, 'available');
      this.decrementActiveCharging();
      this.addToSessionHistory(data.transaction);
    });
    
    // Real-time data
    this.socket.on('meter:values', (data) => {
      this.updatePowerChart(data);
      this.updateConnectorPower(data.stationId, data.connectorId, data.values.power);
    });
    
    // Alerts
    this.socket.on('station:error', (data) => {
      this.showAlert('Station Error', data.error, 'error');
    });
  }
  
  subscribeToStation(stationId) {
    this.socket.emit('subscribe:station', { stationId });
  }
  
  sendStationCommand(stationId, command, params = {}) {
    this.socket.emit('station:command', {
      stationId,
      command,
      params
    });
  }
  
  // UI update methods
  updateConnectionStatus(status) {
    const indicator = document.getElementById('connection-status');
    indicator.className = `status-${status}`;
    indicator.textContent = status.toUpperCase();
  }
  
  updateSimulationStatus(isRunning) {
    const button = document.getElementById('simulation-toggle');
    button.textContent = isRunning ? 'Stop Simulation' : 'Start Simulation';
    button.className = isRunning ? 'btn-danger' : 'btn-success';
  }
  
  addStationToGrid(station) {
    const grid = document.getElementById('stations-grid');
    const stationElement = this.createStationElement(station);
    grid.appendChild(stationElement);
  }
  
  updateStationStatus(stationId, status) {
    const stationElement = document.getElementById(`station-${stationId}`);
    if (stationElement) {
      stationElement.querySelector('.status').textContent = status;
      stationElement.className = `station station-${status}`;
    }
  }
  
  updatePowerChart(data) {
    if (this.powerChart && data.stationId === this.selectedStationId) {
      this.powerChart.addData(data.timestamp, data.values.power / 1000);
    }
  }
  
  showNotification(message, type) {
    // Toast notification implementation
    console.log(`${type.toUpperCase()}: ${message}`);
  }
  
  showAlert(title, message, severity) {
    // Alert popup implementation
    console.warn(`${title}: ${message}`);
  }
}

// Usage
const dashboard = new SimulatorDashboard(localStorage.getItem('jwt_token'));

// Subscribe to specific stations
dashboard.subscribeToStation('SIM_001');
dashboard.subscribeToStation('SIM_002');

// Send commands
dashboard.sendStationCommand('SIM_001', 'start');
```

---

## Event Filtering & Rate Limiting

WebSocket server otomatik olarak:

- Kullanıcı rolüne göre event filtering yapar
- Rate limiting uygular (spam koruması)
- Connection health monitoring sağlar
- Automatic reconnection desteği verir

Bu dokümantasyon ile frontend geliştiriciler kolayca real-time dashboard oluşturabilir! 🚀
