# Production Deployment Runbook

**Tarih:** 2025-01-11  
**Versiyon:** 1.0.0  
**Hedef:** Production ortamında simulator deployment ve operasyon rehberi

---

## 📋 İçindekiler

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Steps](#deployment-steps)
3. [Post-Deployment Validation](#post-deployment-validation)
4. [Monitoring Setup](#monitoring-setup)
5. [Operational Procedures](#operational-procedures)
6. [Troubleshooting](#troubleshooting)

---

## ✅ Pre-Deployment Checklist

### Infrastructure Requirements
- [ ] Node.js 20+ installed
- [ ] Docker & Docker Compose installed
- [ ] Redis server available (optional, for caching)
- [ ] Prometheus server configured
- [ ] Grafana server configured
- [ ] Network access to CSMS endpoint
- [ ] TLS certificates (if using wss://)

### Configuration
- [ ] `.env` file configured with production values
- [ ] CSMS URL configured (`CSMS_URL`)
- [ ] TLS configuration (if required)
- [ ] Database/storage directory permissions set
- [ ] Log directory permissions set

### Security
- [ ] API keys configured (`VALID_API_KEYS`)
- [ ] JWT secret configured (`JWT_SECRET`)
- [ ] CORS origins configured (`CORS_ALLOWED_ORIGINS`)
- [ ] Rate limiting configured
- [ ] TLS certificates installed (if using HTTPS)

---

## 🚀 Deployment Steps

### Option 1: Docker Compose (Recommended for Production)

```bash
# 1. Clone repository
git clone <repository-url>
cd simisimiocpp

# 2. Configure environment
cp server/.env.example server/.env
# Edit server/.env with production values

# 3. Start services
docker compose up -d

# 4. Verify services
docker compose ps
docker compose logs -f simulator
```

### Option 2: Manual Deployment

```bash
# 1. Install dependencies
cd server
npm ci --production

# 2. Configure environment
cp .env.example .env
# Edit .env with production values

# 3. Start application
npm start

# 4. Verify health
curl http://localhost:3001/health
```

### Option 3: Systemd Service

```bash
# 1. Create systemd service file
sudo nano /etc/systemd/system/ocpp-simulator.service

# 2. Add service configuration:
[Unit]
Description=OCPP Simulator Service
After=network.target

[Service]
Type=simple
User=ocpp-simulator
WorkingDirectory=/opt/ocpp-simulator/server
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node --experimental-modules src/app.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# 3. Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable ocpp-simulator
sudo systemctl start ocpp-simulator
sudo systemctl status ocpp-simulator
```

---

## ✅ Post-Deployment Validation

### Health Checks

```bash
# Basic health check
curl http://localhost:3001/health

# Detailed health check
curl http://localhost:3001/health/detailed

# Metrics endpoint
curl http://localhost:3001/metrics

# Performance summary
curl http://localhost:3001/health/performance

# Tracing summary
curl http://localhost:3001/health/tracing
```

### Test Station Creation

```bash
# Create a test station
curl -X POST http://localhost:3001/api/simulator/stations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "stationId": "PROD_TEST_001",
    "vendor": "TestVendor",
    "model": "TestModel",
    "ocppVersion": "1.6J",
    "connectorCount": 2,
    "maxPower": 22000,
    "csmsUrl": "wss://your-csms-endpoint.com"
  }'

# Verify station is online
curl http://localhost:3001/api/simulator/stations/PROD_TEST_001
```

---

## 📊 Monitoring Setup

### Prometheus Configuration

Add to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'ocpp-simulator'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

### Grafana Dashboard

1. Import dashboard from `monitoring/grafana/dashboards/simulator-overview-enhanced.json`
2. Configure data source to point to Prometheus
3. Verify panels are showing data

### Alert Rules

1. Copy `monitoring/prometheus/alert.rules.yml` to Prometheus alerts directory
2. Reload Prometheus configuration
3. Verify alerts are active in Prometheus UI

### Key Metrics to Monitor

- `ocpp_stations_total` - Station count by status
- `ocpp_messages_total` - OCPP message throughput
- `charging_sessions_active` - Active charging sessions
- `application_errors_total` - Application error rate
- `http_requests_total` - HTTP request rate
- `websocket_connections_active` - Active WebSocket connections

---

## 🔧 Operational Procedures

### Starting the Service

```bash
# Docker Compose
docker compose start

# Systemd
sudo systemctl start ocpp-simulator

# Manual
npm start
```

### Stopping the Service

```bash
# Docker Compose
docker compose stop

# Systemd
sudo systemctl stop ocpp-simulator

# Manual
Ctrl+C or kill <pid>
```

### Restarting the Service

```bash
# Docker Compose
docker compose restart

# Systemd
sudo systemctl restart ocpp-simulator
```

### Viewing Logs

```bash
# Docker Compose
docker compose logs -f simulator

# Systemd
sudo journalctl -u ocpp-simulator -f

# Manual
tail -f logs/combined.log
tail -f logs/error.log
```

### Backup

```bash
# Backup data directory
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz server/data/

# Backup via API (requires admin token)
curl -X POST http://localhost:3001/api/backup \
  -H "Authorization: Bearer <admin-token>"
```

---

## 🐛 Troubleshooting

### Service Won't Start

1. Check logs: `docker compose logs simulator` or `journalctl -u ocpp-simulator`
2. Verify `.env` file exists and is configured correctly
3. Check port availability: `netstat -tuln | grep 3001`
4. Verify Node.js version: `node --version` (should be 20+)

### Stations Not Connecting to CSMS

1. Verify CSMS URL is correct: `echo $CSMS_URL`
2. Check network connectivity: `curl -I $CSMS_URL`
3. Verify TLS certificates (if using wss://)
4. Check CSMS logs for connection attempts
5. Review simulator logs for connection errors

### High Error Rate

1. Check `application_errors_total` metric
2. Review error logs: `tail -f logs/error.log`
3. Check CSMS connectivity
4. Verify station configurations
5. Review Prometheus alerts

### Performance Issues

1. Check performance summary: `curl http://localhost:3001/health/performance`
2. Review memory usage: Check `process_resident_memory_bytes` metric
3. Check CPU usage: Review `process_cpu_user_seconds_total` metric
4. Review slow requests in performance summary
5. Consider scaling horizontally if needed

### Monitoring Not Working

1. Verify Prometheus can scrape metrics: `curl http://localhost:3001/metrics`
2. Check Grafana data source configuration
3. Verify alert rules are loaded in Prometheus
4. Check Prometheus targets: `http://prometheus:9090/targets`

---

## 📞 Support Contacts

- **Technical Support:** [support-email]
- **On-Call Engineer:** [oncall-number]
- **Documentation:** [docs-url]

---

## 📝 Change Log

- **2025-01-11:** Initial production runbook created

---

**Son Güncelleme:** 2025-01-11  
**Dokümantasyon Sorumlusu:** DevOps Team

