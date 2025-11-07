# Deployment Guide

**Version:** 1.0.0  
**Last Updated:** 2025-01-11

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Configuration](#configuration)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Node.js**: >= 20.0.0
- **Memory**: Minimum 512MB, Recommended 2GB+
- **CPU**: 2+ cores recommended
- **Disk**: 1GB+ free space
- **Network**: Outbound WebSocket access for CSMS connections

### Optional Dependencies

- **Redis**: >= 7.0 (for caching, optional)
- **Docker**: >= 20.10 (for containerized deployment)
- **Docker Compose**: >= 2.0 (for multi-container setup)

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/ev-charging-simulator.git
cd ev-charging-simulator
```

### 2. Install Dependencies

```bash
cd server
npm install --production
```

### 3. Environment Variables

Create `.env` file:

```bash
cp .env.example .env
nano .env
```

**Required Variables:**

```env
# Application
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Storage
STORAGE_TYPE=json
DATA_DIR=/app/data

# Security (CRITICAL - Generate secure values)
JWT_SECRET=your_super_secure_64_character_secret_key_here_minimum_length
JWT_EXPIRES_IN=24h

# CSMS Connection
CSMS_URL=wss://your-csms-server:9220

# Redis (optional)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# Email (optional)
SMTP_HOST=smtp.yourmailprovider.com
SMTP_PORT=587
SMTP_USER=notifications@yourdomain.com
SMTP_PASS=your-secure-smtp-password

# Logging
LOG_LEVEL=info
LOG_DIR=/app/logs

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://dashboard.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

**Generate Secure JWT Secret:**

```bash
# Using OpenSSL
openssl rand -base64 64

# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

---

## Docker Deployment

### Quick Start

```bash
# Build image
docker build -t ev-simulator:latest .

# Run container
docker run -d \
  --name ev-simulator \
  -p 3001:3001 \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  ev-simulator:latest
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  simulator:
    build: .
    container_name: ev-simulator
    ports:
      - "3001:3001"
    env_file:
      - .env
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  redis:
    image: redis:7-alpine
    container_name: ev-simulator-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  redis-data:
```

**Start Services:**

```bash
docker-compose up -d
```

**View Logs:**

```bash
docker-compose logs -f simulator
```

---

## Production Deployment

### Systemd Service

Create `/etc/systemd/system/ev-simulator.service`:

```ini
[Unit]
Description=EV Charging Station Simulator
After=network.target

[Service]
Type=simple
User=evsimulator
WorkingDirectory=/opt/ev-simulator/server
Environment=NODE_ENV=production
EnvironmentFile=/opt/ev-simulator/.env
ExecStart=/usr/bin/node src/app.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ev-simulator

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/ev-simulator/data /opt/ev-simulator/logs

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
```

**Enable and Start:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable ev-simulator
sudo systemctl start ev-simulator
sudo systemctl status ev-simulator
```

### Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/app.js \
  --name ev-simulator \
  --env production \
  --instances max \
  --exec-mode cluster \
  --max-memory-restart 1G \
  --log-date-format "YYYY-MM-DD HH:mm:ss Z"

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup systemd
```

### Reverse Proxy (Nginx)

Create `/etc/nginx/sites-available/ev-simulator`:

```nginx
upstream ev_simulator {
    least_conn;
    server localhost:3001 max_fails=3 fail_timeout=30s;
    # Add more instances for load balancing
    # server localhost:3002 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name simulator.yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name simulator.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/simulator.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/simulator.yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://ev_simulator;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://ev_simulator;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://ev_simulator;
        access_log off;
    }
}
```

**Enable Site:**

```bash
sudo ln -s /etc/nginx/sites-available/ev-simulator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Configuration

### Performance Tuning

**Node.js Options:**

```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=2048"

# Enable clustering
NODE_ENV=production CLUSTER_MODE=true CLUSTER_WORKERS=4
```

**Environment Variables:**

```env
# Performance
CLUSTER_MODE=true
CLUSTER_WORKERS=4
MAX_MEMORY_MB=2048
ENABLE_COMPRESSION=true

# Connection pooling
WS_CONNECTION_POOL_SIZE=100
WS_RECONNECT_DELAY=5000
WS_MAX_RECONNECT_ATTEMPTS=10

# Caching
CACHE_TTL=3600
CACHE_MAX_SIZE=1000
REDIS_ENABLED=true
```

### Security Configuration

```env
# JWT
JWT_SECRET=<64+ character secret>
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
RATE_LIMIT_ADMIN_MAX=1000
RATE_LIMIT_OPERATOR_MAX=500

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com
CORS_CREDENTIALS=true

# Security Headers
HELMET_ENABLED=true
CSRF_PROTECTION=true
```

---

## Monitoring

### Health Checks

**Basic Health:**

```bash
curl http://localhost:3001/health
```

**Detailed Health:**

```bash
curl http://localhost:3001/health/detailed | jq
```

### Logging

**Log Locations:**

- Application logs: `/app/logs/app.log`
- Error logs: `/app/logs/error.log`
- Access logs: `/app/logs/access.log`

**Log Rotation:**

Add to `/etc/logrotate.d/ev-simulator`:

```
/app/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 evsimulator evsimulator
    sharedscripts
    postrotate
        systemctl reload ev-simulator > /dev/null 2>&1 || true
    endscript
}
```

### Metrics

**Prometheus Metrics:**

```bash
curl http://localhost:3001/metrics
```

**Key Metrics:**

- `http_requests_total`: Total HTTP requests
- `http_request_duration_seconds`: Request duration
- `simulator_stations_total`: Total stations
- `simulator_active_stations`: Active stations
- `circuit_breaker_state`: Circuit breaker states

### Alerting

**Recommended Alerts:**

1. **Service Down**: Health check fails for 2+ minutes
2. **High Error Rate**: Error rate > 5% for 5 minutes
3. **High Memory**: Memory usage > 80% for 10 minutes
4. **Circuit Breaker Open**: Circuit breaker open for 5+ minutes
5. **High Response Time**: P95 response time > 1s for 5 minutes

---

## Troubleshooting

### Common Issues

#### 1. Service Won't Start

**Check Logs:**

```bash
# Systemd
sudo journalctl -u ev-simulator -n 50

# PM2
pm2 logs ev-simulator --lines 50

# Docker
docker logs ev-simulator --tail 50
```

**Check Permissions:**

```bash
# Data directory
ls -la /app/data

# Logs directory
ls -la /app/logs
```

#### 2. CSMS Connection Failed

**Verify CSMS URL:**

```bash
# Test WebSocket connection
wscat -c wss://your-csms:9220/TEST_STATION

# Check network connectivity
curl -v https://your-csms:9220
```

**Check Firewall:**

```bash
# Outbound WebSocket
telnet your-csms 9220
```

#### 3. High Memory Usage

**Check Memory:**

```bash
# Detailed health
curl http://localhost:3001/health/detailed | jq '.data.system.memory'

# Process memory
ps aux | grep node
```

**Force Garbage Collection:**

```bash
# Send USR2 signal (if enabled)
kill -USR2 $(pgrep -f "node src/app.js")
```

#### 4. Redis Connection Issues

**Test Redis:**

```bash
redis-cli -h localhost -p 6379 -a $REDIS_PASSWORD ping
```

**Check Circuit Breaker:**

```bash
curl http://localhost:3001/health/detailed | jq '.data.circuitBreakers'
```

### Debug Mode

**Enable Debug Logging:**

```bash
# Environment variable
DEBUG=simulator:* npm start

# Or in .env
LOG_LEVEL=debug
DEBUG=simulator:*,ocpp:*
```

---

## Backup & Recovery

### Automated Backups

**Create Backup:**

```bash
curl -X POST http://localhost:3001/api/v1/simulator/backup \
  -H "Authorization: Bearer $TOKEN"
```

**List Backups:**

```bash
curl http://localhost:3001/api/v1/simulator/backups \
  -H "Authorization: Bearer $TOKEN"
```

**Restore Backup:**

```bash
curl -X POST http://localhost:3001/api/v1/simulator/backup/restore \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"backupFile": "backup-2025-01-11T12-00-00.json"}'
```

### Manual Backup

```bash
# Backup data directory
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz /app/data

# Restore
tar -xzf backup-20250111-120000.tar.gz -C /
```

---

## Scaling

### Horizontal Scaling

**Load Balancer Configuration:**

```nginx
upstream ev_simulator {
    least_conn;
    server simulator1.yourdomain.com:3001;
    server simulator2.yourdomain.com:3001;
    server simulator3.yourdomain.com:3001;
}
```

**Session Affinity:**

For WebSocket connections, use IP hash:

```nginx
upstream ev_simulator {
    ip_hash;
    server simulator1.yourdomain.com:3001;
    server simulator2.yourdomain.com:3001;
}
```

### Vertical Scaling

**Increase Resources:**

- Memory: Increase `MAX_MEMORY_MB`
- CPU: Increase `CLUSTER_WORKERS`
- Connections: Increase `WS_CONNECTION_POOL_SIZE`

---

## Security Checklist

- [ ] Strong JWT secret (64+ characters)
- [ ] HTTPS enabled with valid certificate
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] CSRF protection enabled
- [ ] Input validation enabled
- [ ] Logs don't contain sensitive data
- [ ] Environment variables secured
- [ ] Firewall rules configured
- [ ] Regular security updates
- [ ] Backup strategy in place

---

**Last Updated:** 2025-01-11  
**Version:** 1.0.0

