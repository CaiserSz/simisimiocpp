# 🔌 EV Charging Station Simulator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![OCPP](https://img.shields.io/badge/OCPP-1.6J%20%7C%202.0.1-blue)](https://www.openchargealliance.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Socket.IO-lightgrey)](https://socket.io/)

**Enterprise-grade EV Charging Station Simulator** that emulates real charging stations and connects to CSMS (Central Station Management Systems) using OCPP protocols.

## 🎯 Overview

Bu simulator gerçek EV şarj istasyonlarının davranışını simüle eder ve CSMS'ye gerçek bir istasyon gibi bağlanır. Hem **OCPP 1.6J** hem de **OCPP 2.0.1** protokollerini destekler, multi-station simülasyonu yapar ve gerçekçi araç etkileşimleri sağlar.

### ✨ Key Features

- 🔌 **Multi-Protocol Support**: OCPP 1.6J & 2.0.1
- 🚗 **Vehicle Simulation**: Realistic EV behavior and charging curves
- 🎛️ **Multi-Station Management**: Hundreds of concurrent station simulations
- 📊 **Real-time Dashboard**: WebSocket-powered live monitoring
- ⚡ **Protocol Switching**: Runtime protocol switching capability
- 🌐 **Production Ready**: Enterprise-grade performance and security
- 🧪 **Comprehensive Testing**: Unit, integration, and CSMS connection tests
- 📈 **Performance Optimized**: Multi-core clustering and advanced caching

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **Redis** >= 7.0 (optional, for caching)
- **CSMS Server** (for testing connections)

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/ev-charging-simulator.git
cd ev-charging-simulator

# Install server dependencies
cd server
npm install

# Install client dependencies (if frontend exists)
cd ../client
npm install
```

### Environment Setup

```bash
# Create environment file
cd server
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Required environment variables:

```env
# Application
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# Storage (JSON-based - no database needed!)
STORAGE_TYPE=json
DATA_DIR=./src/data

# Security (CRITICAL - Generate secure values)
JWT_SECRET=your_super_secure_64_character_secret_key_here
JWT_EXPIRES_IN=24h

# CSMS Connection
CSMS_URL=ws://localhost:9220

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Start Development Server

```bash
cd server
npm run dev
```

Server will start at `http://localhost:3001`

---

### CSMS Testing Modes

The simulator supports two CSMS connectivity strategies:

- **Mock mode (default)** – runs an in-process mock CSMS that implements the subset of OCPP flows required by the integration suites.
  ```bash
  cd server
  npm run test:integration:mock    # Run integration tests against the mock CSMS
  npm run mock:csms                # Launch only the mock CSMS for manual experiments
  ```

- **Remote mode** – targets a real CSMS endpoint.
  ```bash
  export CSMS_MODE=remote
  export CSMS_URL=wss://your-csms.example.com/ocpp
  npm run test:integration:remote
  ```

### Docker Quick Start

Spin up the simulator together with Redis, Prometheus, Grafana, and the mock CSMS with a single command:

```bash
docker compose up --build
```

Exposed endpoints:

- Simulator API: `http://localhost:3001`
- Mock CSMS WebSocket endpoint: `ws://localhost:9220`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3002` (default credentials `admin` / `grafana123`)

### OCPP Compliance Test Suite

Automated conformance checks cover both OCPP 1.6J and 2.0.1 message structures. Run them with:

```bash
cd server
npm run test:compliance
```

Use `WS_TESTS=true`, `SIM_FUNCTIONAL_TESTS=true`, or `E2E_TESTS=true` to opt into heavier suites when needed.

### Optional Test Flags

Several suites are disabled by default due to their runtime or external dependencies. Enable them explicitly when required:

| Flag | Effect |
|------|--------|
| `WS_TESTS=true` | Runs WebSocket server unit tests (requires socket endpoints). |
| `SIM_FUNCTIONAL_TESTS=true` | Runs long-running simulator functional specs (starts stations, vehicles). |
| `E2E_TESTS=true` | Executes end-to-end lifecycle validation tests. |

Example:

```bash
WS_TESTS=true SIM_FUNCTIONAL_TESTS=true npm test
```

### Mock CSMS Control API

The mock CSMS exposes a lightweight control plane (default `http://localhost:9320`) for error injection and network simulation:

| Endpoint | Method | Payload | Description |
|----------|--------|---------|-------------|
| `/mock/behavior/latency` | POST | `{ "minMs": 100, "maxMs": 250 }` | Adds artificial response latency. |
| `/mock/behavior/error` | POST | `{ "type": "rejectBoot" }` | Rejects the next BootNotification. |
| `/mock/behavior/error` | POST | `{ "type": "callError", "code": "InternalError", "description": "Mock failure" }` | Forces the next request to receive CALLERROR. |
| `/mock/behavior/error` | POST | `{ "type": "dropResponse" }` | Drops the next outbound response. |
| `/mock/behavior/error` | POST | `{ "type": "disconnect" }` | Closes the socket after the next response. |
| `/mock/behavior/reset` | POST | – | Clears all injected behaviours. |

Example:

```bash
curl -X POST http://localhost:9320/mock/behavior/latency \
  -H "Content-Type: application/json" \
  -d '{"minMs":150,"maxMs":300}'
```

---

## 🎮 Usage

### 1. Authentication

First, create an admin account and login:

```bash
# Create admin user (first time only)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "name": "Administrator",
    "role": "admin"
  }'

# Login to get JWT token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!"
  }'
```

### 2. Create Your First Station

```bash
export TOKEN="your_jwt_token_here"

# Create a simple AC station
curl -X POST http://localhost:3001/api/simulator/stations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor": "TestVendor",
    "model": "SimCharger Pro",
    "ocppVersion": "1.6J",
    "connectorCount": 2,
    "maxPower": 22000,
    "csmsUrl": "ws://localhost:9220"
  }'
```

### 3. Start Station Simulation

```bash
# Start the station
curl -X PUT http://localhost:3001/api/simulator/stations/{stationId}/start \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Simulate Vehicle Interaction

```bash
# Connect a vehicle
curl -X POST http://localhost:3001/api/simulator/stations/{stationId}/connectors/1/vehicle/connect \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleType": "sedan",
    "initialSoC": 30,
    "targetSoC": 80
  }'

# Start charging
curl -X POST http://localhost:3001/api/simulator/stations/{stationId}/connectors/1/charging/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idTag": "RFID_USER_001"
  }'
```

---

## 🏗️ Architecture

```text
┌─────────────────┐    WebSocket    ┌─────────────────┐
│   CSMS Server   │ ←──────────────→ │ Station Sim #1  │
│   (External)    │                 │   (OCPP 1.6J)   │
└─────────────────┘                 └─────────────────┘
        ↑                                    ↓
        │                           ┌─────────────────┐
        │            WebSocket      │ Vehicle Sim     │
        └───────────────────────────│ • Cable Connect │
                                   │ • Authentication │
┌─────────────────┐                │ • Charging      │
│ Management API  │                └─────────────────┘
│ • REST APIs     │
│ • WebSocket     │    ┌─────────────────┐
│ • Dashboard     │────│ Station Sim #2  │
└─────────────────┘    │   (OCPP 2.0.1)  │
                       └─────────────────┘
```

### Core Components

- **🎛️ SimulationManager**: Orchestrates multiple station simulations
- **🔌 StationSimulator**: Individual station behavior simulation
- **🚗 VehicleSimulator**: Realistic EV and user interaction simulation
- **📡 OCPP Clients**: Protocol-specific WebSocket clients (1.6J & 2.0.1)
- **🌐 WebSocket Server**: Real-time frontend communication
- **📊 Dashboard API**: RESTful APIs for dashboard integration

---

## 📊 API Reference

### Station Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/simulator/stations` | GET | List all stations |
| `/api/simulator/stations` | POST | Create new station |
| `/api/simulator/stations/{id}` | GET | Get station details |
| `/api/simulator/stations/{id}/start` | PUT | Start station |
| `/api/simulator/stations/{id}/stop` | PUT | Stop station |
| `/api/simulator/stations/{id}/protocol` | PUT | Switch OCPP protocol |

### Vehicle Simulation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/simulator/stations/{id}/connectors/{cid}/vehicle/connect` | POST | Connect vehicle |
| `/api/simulator/stations/{id}/connectors/{cid}/vehicle` | DELETE | Disconnect vehicle |
| `/api/simulator/stations/{id}/connectors/{cid}/charging/start` | POST | Start charging |
| `/api/simulator/stations/{id}/connectors/{cid}/charging/stop` | POST | Stop charging |

### Dashboard APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard/overview` | GET | Dashboard overview |
| `/api/dashboard/stations` | GET | Stations grid data |
| `/api/dashboard/metrics` | GET | Real-time metrics |
| `/api/dashboard/alerts` | GET | System alerts |

### Scenario Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/simulator/scenarios` | GET | Available scenarios |
| `/api/simulator/scenarios/{id}/run` | POST | Run scenario |
| `/api/simulator/profiles` | GET | Station profiles |

---

## 🎬 Predefined Scenarios

### Urban Mixed Charging
```bash
curl -X POST http://localhost:3001/api/simulator/scenarios/urban_mixed/run \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"clearExisting": true}'
```

Creates 10 AC stations + 3 DC fast chargers simulating urban environment.

### Highway Corridor
```bash
curl -X POST http://localhost:3001/api/simulator/scenarios/highway_corridor/run \
  -H "Authorization: Bearer $TOKEN"
```

Creates 5 ultra-fast charging stations along highway corridor.

### Load Testing
```bash
curl -X POST http://localhost:3001/api/simulator/scenarios/load_test/run \
  -H "Authorization: Bearer $TOKEN"
```

Creates 80 stations for stress testing CSMS systems.

---

## 🌐 Real-time WebSocket Integration

### Frontend Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: { token: 'your_jwt_token' }
});

// Listen for simulation events
socket.on('simulation:started', (data) => {
  console.log('Simulation started:', data);
});

socket.on('charging:started', (data) => {
  console.log('Charging started:', data);
});

socket.on('meter:values', (data) => {
  console.log('Real-time power:', data.values.power);
});

// Subscribe to specific station
socket.emit('subscribe:station', { stationId: 'SIM_001' });
```

### Available Events

- `simulation:started/stopped`
- `station:created/started/stopped`
- `charging:started/stopped`
- `meter:values` (real-time power data)
- `vehicle:connected/disconnected`
- `scenario:started/event`

See [WebSocket Events Documentation](WEBSOCKET_EVENTS.md) for complete reference.

---

## 🧪 Testing

### Run All Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# CSMS connection tests
npm run test:csms

# Run with coverage
npm run test:coverage
```

### CSMS Integration Testing

```bash
# Set CSMS URL for testing
export CSMS_URL=ws://your-test-csms:9220

# Run CSMS connection tests
npm run test:csms
```

Tests include:

- ✅ OCPP 1.6J connection and message flow
- ✅ OCPP 2.0.1 connection and message flow  
- ✅ Protocol switching validation
- ✅ Multi-station load testing
- ✅ Error handling and recovery

---

## 🚀 Production Deployment

### Environment Setup

```bash
# Production environment variables
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# JSON Storage (Production)
STORAGE_TYPE=json
DATA_DIR=/app/data

# Strong JWT secret (min 64 characters)
JWT_SECRET=your_super_secure_production_jwt_secret_key_minimum_64_characters

# Redis for caching
REDIS_URL=redis://your-redis-host:6379
REDIS_PASSWORD=your-redis-password

# CSMS connection
CSMS_URL=wss://your-production-csms:9220

# Email notifications
SMTP_HOST=smtp.yourmailprovider.com
SMTP_PORT=587
SMTP_USER=notifications@yourdomain.com
SMTP_PASS=your-secure-smtp-password
```

### Docker Deployment

```bash
# Build and run with Docker
docker build -t ev-simulator .
docker run -d -p 3001:3001 --env-file .env ev-simulator
```

### Performance Optimization

The system includes:

- 🚀 **Multi-core clustering** for CPU utilization
- 📊 **Memory monitoring** and automatic GC
- ⚡ **Connection pooling** for WebSocket clients
- 🔄 **Request throttling** and rate limiting
- 📈 **Performance metrics** collection

### Security Features

- 🔒 **JWT authentication** with secure secrets
- 🛡️ **Rate limiting** on all endpoints
- 🔐 **Input validation** and sanitization
- 📊 **Brute force protection**
- 🌐 **CORS and security headers**
- 🔍 **Request/response logging**

---

## 📈 Performance Benchmarks

### Target Metrics (Production)

- **Response Time**: < 200ms (95th percentile)
- **Throughput**: > 1000 requests/second
- **Concurrent Stations**: 100+ simultaneous simulations
- **Protocol Distribution**: 50% OCPP 1.6J + 50% OCPP 2.0.1
- **Memory Usage**: < 512MB per instance
- **CPU Usage**: < 70% average
- **Uptime**: > 99.9%

### Load Testing Results

```bash
# Load testing example (requires k6 installation)
# k6 run --vus 100 --duration 5m <your-load-test-script>
```

---

## 🔧 Development

### Project Structure

```text
server/
├── src/
│   ├── controllers/        # API controllers
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic services
│   ├── simulator/         # Station simulation engine
│   │   ├── protocols/     # OCPP protocol implementations
│   │   ├── StationSimulator.js
│   │   ├── VehicleSimulator.js
│   │   └── SimulationManager.js
│   ├── utils/             # Utilities and helpers
│   ├── models/            # Database models
│   └── __tests__/         # Test suites
├── package.json
└── .env.example
```

### Adding New Features

1. **New Station Profile**: Add to `SimulationManager.loadPredefinedProfiles()`
2. **New Vehicle Type**: Add to `VehicleSimulator.vehicleProfiles`
3. **New Scenario**: Add to `SimulationManager.loadPredefinedScenarios()`
4. **New OCPP Message**: Implement in respective protocol simulator

### Code Style

```bash
# Lint code
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check
```

---

## 🐛 Troubleshooting

### Common Issues

#### CSMS Connection Failed
```bash
# Check CSMS URL format
echo $CSMS_URL
# Should be: ws://hostname:port or wss://hostname:port

# Test connectivity
wscat -c $CSMS_URL/TEST_STATION
```

#### Station Won't Start
```bash
# Check logs
tail -f logs/app.log | grep ERROR

# Verify configuration
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/simulator/stations/{stationId}
```

#### High Memory Usage
```bash
# Monitor memory
curl http://localhost:3001/health/detailed

# Force garbage collection (development only)
kill -USR2 $(pgrep node)
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=simulator:* npm run dev

# OCPP protocol debugging
DEBUG=ocpp:* npm run dev

# All debug output
DEBUG=* npm run dev
```

---

## 📚 Documentation

- [WebSocket Events](WEBSOCKET_EVENTS.md) - Complete WebSocket API reference
- [Simulator Guide](SIMULATOR_GUIDE.md) - Comprehensive usage guide
- [Production Checklist](PRODUCTION_CHECKLIST.md) - Deployment checklist
- [API Documentation](docs/API.md) - REST API reference
- [Architecture Guide](docs/ARCHITECTURE.md) - System architecture

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run dev

# Check code quality
npm run lint
npm run format:check
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Open Charge Alliance](https://www.openchargealliance.org/) for OCPP specifications
- [Socket.IO](https://socket.io/) for real-time communication
- [Express.js](https://expressjs.com/) for the web framework
- [Redis](https://redis.io/) for caching and performance

---

## 📞 Support

- **Documentation**: [Wiki](https://github.com/your-org/ev-charging-simulator/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-org/ev-charging-simulator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/ev-charging-simulator/discussions)

---

**Ready to simulate the future of EV charging! ⚡🚗**
