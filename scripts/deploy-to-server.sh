#!/bin/bash

# Deployment Script for vcss.lixhium.biz
# Server: 164.92.206.5
# Location: /home/basar/apps/vcss
#
# Created: 2025-11-09

set -e

SERVER_USER="basar"
SERVER_IP="164.92.206.5"
SERVER_PATH="/home/basar/apps/vcss"
DOMAIN="vcss.lixhium.biz"

echo "================================================"
echo "DEPLOYMENT TO vcss.lixhium.biz"
echo "================================================"
echo ""
echo "Server: $SERVER_IP"
echo "Path: $SERVER_PATH"
echo "Domain: $DOMAIN"
echo ""

# 1. Build and prepare locally
echo "1. Preparing deployment package..."
cd "$(dirname "$0")/.."

# Fix syntax errors
echo "   - Fixing syntax errors..."
./scripts/fix-all-syntax.sh || exit 1

# Test locally
echo "   - Running smoke tests..."
./scripts/smoke-test.sh || exit 1

# Create deployment package
echo "   - Creating deployment package..."
tar -czf /tmp/vcss-deploy.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='logs/*' \
    --exclude='coverage' \
    --exclude='.jest-cache' \
    server/ \
    monitoring/ \
    scripts/ \
    docker-compose.yml \
    README.md \
    DEPLOYMENT_GUIDE.md

echo "   ✅ Package created: /tmp/vcss-deploy.tar.gz"

# 2. Upload to server
echo ""
echo "2. Uploading to server..."
scp /tmp/vcss-deploy.tar.gz $SERVER_USER@$SERVER_IP:$SERVER_PATH/

# 3. Deploy on server
echo ""
echo "3. Deploying on server..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /home/basar/apps/vcss

# Extract
tar -xzf vcss-deploy.tar.gz
rm vcss-deploy.tar.gz

# Setup environment
cd server
cp .env.production .env

# Generate JWT secret
JWT_SECRET=$(openssl rand -hex 32)
sed -i "s/WILL_BE_GENERATED_ON_SERVER/$JWT_SECRET/" .env

# Create directories
mkdir -p src/data logs

# Install dependencies
npm ci --production

# Create systemd service
sudo tee /etc/systemd/system/ev-simulator.service > /dev/null << 'EOF'
[Unit]
Description=EV Charging Station Simulator
After=network.target

[Service]
Type=simple
User=basar
WorkingDirectory=/home/basar/apps/vcss/server
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node --experimental-modules src/app.js
Restart=always
RestartSec=10
StandardOutput=append:/home/basar/apps/vcss/server/logs/app.log
StandardError=append:/home/basar/apps/vcss/server/logs/error.log

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload
sudo systemctl enable ev-simulator
sudo systemctl restart ev-simulator

echo "✅ Service started"
sleep 5

# Health check
curl -f http://localhost:3001/health || echo "❌ Health check failed"

echo "✅ Deployment complete"
ENDSSH

# 4. Setup Nginx
echo ""
echo "4. Setting up Nginx..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
sudo tee /etc/nginx/sites-available/vcss.lixhium.biz > /dev/null << 'EOF'
server {
    listen 80;
    server_name vcss.lixhium.biz;

    # Redirect to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/vcss.lixhium.biz /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Nginx configured"
ENDSSH

# 5. SSL Setup (Certbot)
echo ""
echo "5. Setting up SSL (optional)..."
echo "   Run on server: sudo certbot --nginx -d vcss.lixhium.biz"

echo ""
echo "================================================"
echo "✅ DEPLOYMENT COMPLETE"
echo "================================================"
echo ""
echo "URL: http://vcss.lixhium.biz"
echo "Dashboard: http://vcss.lixhium.biz/dashboard"
echo ""
echo "Next steps:"
echo "1. Setup SSL: sudo certbot --nginx -d vcss.lixhium.biz"
echo "2. Check logs: journalctl -u ev-simulator -f"
echo "3. Monitor: http://vcss.lixhium.biz/metrics"

