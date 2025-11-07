# API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3001/api/v1`  
**Last Updated:** 2025-01-11

## Overview

EV Charging Station Simulator REST API provides comprehensive endpoints for managing charging station simulations, authentication, and monitoring.

### Authentication

All protected endpoints require JWT authentication via Bearer token:

```http
Authorization: Bearer <your_jwt_token>
```

### API Versioning

API versioning is supported via:
- **Accept Header**: `Accept: application/vnd.api+json;version=1`
- **Custom Header**: `X-API-Version: 1`
- **Query Parameter**: `?version=1`
- **URL Path**: `/api/v1/...` (recommended)

### Response Format

All API responses follow a standardized format:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-11T12:00:00Z",
    "version": "1.0.0",
    "requestId": "uuid-here"
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2025-01-11T12:00:00Z",
    "version": "1.0.0",
    "requestId": "uuid-here"
  }
}
```

### Rate Limiting

- **IP-based**: 100 requests per 15 minutes
- **User-based**: Role-based limits
  - Admin: 1000 requests/15min
  - Operator: 500 requests/15min
  - User: 100 requests/15min

Rate limit headers:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Remaining requests
- `RateLimit-Reset`: Reset time (Unix timestamp)

---

## Authentication Endpoints

### Register User

Create a new user account.

```http
POST /api/v1/auth/register
Content-Type: application/json
```

**Request Body:**

```json
{
  "username": "johndoe",
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "role": "user"
}
```

**Validation Rules:**
- `username`: 3-30 characters, alphanumeric + underscore
- `email`: Valid email format
- `password`: Min 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
- `role`: `admin`, `operator`, `user`, `guest`

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "username": "johndoe",
      "email": "user@example.com",
      "role": "user",
      "createdAt": "2025-01-11T12:00:00Z"
    },
    "token": "jwt-token-here"
  }
}
```

**Status Codes:**
- `201 Created`: User created successfully
- `400 Bad Request`: Validation error
- `409 Conflict`: User already exists

---

### Login

Authenticate and receive JWT token.

```http
POST /api/v1/auth/login
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "username": "johndoe",
      "email": "user@example.com",
      "role": "user"
    },
    "token": "jwt-token-here",
    "expiresIn": "24h"
  }
}
```

**Status Codes:**
- `200 OK`: Login successful
- `401 Unauthorized`: Invalid credentials
- `429 Too Many Requests`: Too many login attempts

---

### Get Current User

Get authenticated user information.

```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "username": "johndoe",
      "email": "user@example.com",
      "role": "user",
      "createdAt": "2025-01-11T12:00:00Z",
      "lastLogin": "2025-01-11T12:00:00Z"
    }
  }
}
```

---

### Update Password

Update user password.

```http
PUT /api/v1/auth/password
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Status Codes:**
- `200 OK`: Password updated
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Invalid current password

---

### Update User Details

Update user profile information.

```http
PUT /api/v1/auth/details
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "John Doe Updated",
  "email": "newemail@example.com"
}
```

---

## Simulator Endpoints

### Get Simulation Overview

Get high-level simulation overview.

```http
GET /api/v1/simulator/overview
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalStations": 10,
    "activeStations": 5,
    "totalConnectors": 20,
    "activeConnectors": 8,
    "totalSessions": 150,
    "activeSessions": 8,
    "totalEnergy": 1250.5,
    "protocols": {
      "1.6J": 5,
      "2.0.1": 5
    }
  }
}
```

**Required Role:** `admin`, `operator`

---

### Get Statistics

Get detailed simulation statistics.

```http
GET /api/v1/simulator/statistics
Authorization: Bearer <token>
```

**Query Parameters:**
- `groupBy`: `station`, `protocol`, `network` (optional)
- `startDate`: ISO 8601 date (optional)
- `endDate`: ISO 8601 date (optional)

---

### Get Station Profiles

Get available predefined station profiles.

```http
GET /api/v1/simulator/profiles
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "profiles": [
      {
        "id": "urban_ac",
        "name": "Urban AC Charger",
        "maxPower": 7400,
        "connectorCount": 2,
        "ocppVersion": "1.6J",
        "description": "City center AC charging"
      }
    ]
  }
}
```

---

### Get Scenarios

Get available predefined scenarios.

```http
GET /api/v1/simulator/scenarios
Authorization: Bearer <token>
```

---

### Run Scenario

Execute a predefined scenario.

```http
POST /api/v1/simulator/scenarios/{scenarioId}/run
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "clearExisting": false,
  "manualStop": false
}
```

**Status Codes:**
- `200 OK`: Scenario started
- `404 Not Found`: Scenario not found
- `409 Conflict`: Scenario already running

---

### List Stations

Get all stations.

```http
GET /api/v1/simulator/stations
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `status`: Filter by status (`available`, `charging`, `faulted`, `unavailable`)
- `protocol`: Filter by protocol (`1.6J`, `2.0.1`)

**Response:**

```json
{
  "success": true,
  "data": {
    "stations": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "pages": 1
    }
  }
}
```

---

### Create Station

Create a new charging station.

```http
POST /api/v1/simulator/stations
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "vendor": "TestVendor",
  "model": "SimCharger Pro",
  "ocppVersion": "1.6J",
  "connectorCount": 2,
  "maxPower": 22000,
  "csmsUrl": "ws://localhost:9220",
  "serialNumber": "SIM001",
  "firmwareVersion": "1.0.0"
}
```

**Required Fields:**
- `vendor`: String
- `model`: String
- `ocppVersion`: `1.6J` or `2.0.1`
- `connectorCount`: Number (1-10)
- `maxPower`: Number (Watts)
- `csmsUrl`: WebSocket URL

**Status Codes:**
- `201 Created`: Station created
- `400 Bad Request`: Validation error

---

### Get Station

Get station details.

```http
GET /api/v1/simulator/stations/{stationId}
Authorization: Bearer <token>
```

---

### Update Station

Update station configuration.

```http
PUT /api/v1/simulator/stations/{stationId}
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:** (same as Create Station, all fields optional)

---

### Start Station

Start station simulation.

```http
PUT /api/v1/simulator/stations/{stationId}/start
Authorization: Bearer <token>
```

**Status Codes:**
- `200 OK`: Station started
- `409 Conflict`: Station already running

---

### Stop Station

Stop station simulation.

```http
PUT /api/v1/simulator/stations/{stationId}/stop
Authorization: Bearer <token>
```

---

### Delete Station

Delete a station.

```http
DELETE /api/v1/simulator/stations/{stationId}
Authorization: Bearer <token>
```

**Status Codes:**
- `200 OK`: Station deleted
- `404 Not Found`: Station not found

---

### Switch Protocol

Switch station OCPP protocol.

```http
PUT /api/v1/simulator/stations/{stationId}/protocol
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "protocol": "2.0.1"
}
```

**Status Codes:**
- `200 OK`: Protocol switched
- `400 Bad Request`: Invalid protocol
- `409 Conflict`: Station is running

---

### Connect Vehicle

Connect a vehicle to a connector.

```http
POST /api/v1/simulator/stations/{stationId}/connectors/{connectorId}/vehicle/connect
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "vehicleType": "sedan",
  "initialSoC": 30,
  "targetSoC": 80,
  "userScenario": "normal"
}
```

**Vehicle Types:** `compact`, `sedan`, `suv`, `truck`, `motorcycle`

---

### Disconnect Vehicle

Disconnect vehicle from connector.

```http
DELETE /api/v1/simulator/stations/{stationId}/connectors/{connectorId}/vehicle
Authorization: Bearer <token>
```

---

### Start Charging

Start charging session.

```http
POST /api/v1/simulator/stations/{stationId}/connectors/{connectorId}/charging/start
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "idTag": "RFID_USER_001"
}
```

---

### Stop Charging

Stop charging session.

```http
POST /api/v1/simulator/stations/{stationId}/connectors/{connectorId}/charging/stop
Authorization: Bearer <token>
```

---

### Get Station History

Get station event history.

```http
GET /api/v1/simulator/stations/{stationId}/history
Authorization: Bearer <token>
```

**Query Parameters:**
- `type`: `sessions`, `errors`, `metrics` (optional)
- `startDate`: ISO 8601 date (optional)
- `endDate`: ISO 8601 date (optional)
- `limit`: Number of records (default: 100, max: 1000)

---

## Dashboard Endpoints

### Get Dashboard Overview

Get dashboard overview data.

```http
GET /api/v1/dashboard/overview
Authorization: Bearer <token>
```

---

### Get Stations Grid

Get stations grid data for dashboard.

```http
GET /api/v1/dashboard/stations
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: Filter by status
- `protocol`: Filter by protocol
- `group`: Filter by group

---

### Get Metrics

Get real-time metrics.

```http
GET /api/v1/dashboard/metrics
Authorization: Bearer <token>
```

---

### Get Alerts

Get system alerts.

```http
GET /api/v1/dashboard/alerts
Authorization: Bearer <token>
```

**Query Parameters:**
- `severity`: `info`, `warning`, `error`, `critical`
- `limit`: Number of alerts (default: 50)

---

## Health & Monitoring

### Health Check

Basic health check.

```http
GET /health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-01-11T12:00:00Z"
}
```

---

### Detailed Health Check

Detailed health information including circuit breakers.

```http
GET /health/detailed
```

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-11T12:00:00Z",
    "version": "1.0.0",
    "uptime": 3600,
    "environment": "production",
    "circuitBreakers": {
      "ocpp-STATION_001": {
        "state": "CLOSED",
        "stats": { ... }
      }
    },
    "services": {
      "database": { ... },
      "websocket": { ... },
      "simulator": { ... }
    },
    "system": {
      "nodeVersion": "v20.0.0",
      "platform": "linux",
      "memory": { ... },
      "cpu": { ... }
    }
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `CONFLICT_ERROR` | Resource conflict |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

---

## WebSocket Events

See [WEBSOCKET_EVENTS.md](../WEBSOCKET_EVENTS.md) for complete WebSocket API documentation.

---

## Examples

### Complete Workflow

```bash
# 1. Register
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "SecurePass123!",
    "role": "admin"
  }'

# 2. Login
TOKEN=$(curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"SecurePass123!"}' \
  | jq -r '.data.token')

# 3. Create Station
curl -X POST http://localhost:3001/api/v1/simulator/stations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor": "TestVendor",
    "model": "SimCharger",
    "ocppVersion": "1.6J",
    "connectorCount": 2,
    "maxPower": 22000,
    "csmsUrl": "ws://localhost:9220"
  }'

# 4. Start Station
curl -X PUT http://localhost:3001/api/v1/simulator/stations/{stationId}/start \
  -H "Authorization: Bearer $TOKEN"

# 5. Connect Vehicle
curl -X POST http://localhost:3001/api/v1/simulator/stations/{stationId}/connectors/1/vehicle/connect \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleType": "sedan",
    "initialSoC": 30,
    "targetSoC": 80
  }'

# 6. Start Charging
curl -X POST http://localhost:3001/api/v1/simulator/stations/{stationId}/connectors/1/charging/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"idTag": "RFID_001"}'
```

---

**Last Updated:** 2025-01-11  
**API Version:** 1.0.0

