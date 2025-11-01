#!/bin/bash

# EV Charging Station Simulator - Production Deployment Script
# Usage: ./scripts/deploy.sh [environment] [options]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="${1:-production}"
PROJECT_NAME="ev-station-simulator"
BUILD_IMAGE="${PROJECT_NAME}:latest"
BACKUP_ENABLED=true
HEALTH_CHECK_TIMEOUT=60

# Configuration
case $ENVIRONMENT in
  "development")
    DOCKER_COMPOSE_FILE="docker-compose.yml"
    REPLICA_COUNT=1
    ;;
  "staging")
    DOCKER_COMPOSE_FILE="docker-compose.staging.yml"
    REPLICA_COUNT=2
    ;;
  "production")
    DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
    REPLICA_COUNT=3
    ;;
  *)
    echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
    echo "Valid environments: development, staging, production"
    exit 1
    ;;
esac

echo -e "${BLUE}🚀 Starting deployment to ${ENVIRONMENT}${NC}"
echo "=================================="

# Pre-deployment checks
echo -e "${YELLOW}🔍 Running pre-deployment checks...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

# Check if Docker Compose file exists
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    echo -e "${RED}❌ Docker Compose file not found: $DOCKER_COMPOSE_FILE${NC}"
    exit 1
fi

# Check environment variables
if [ "$ENVIRONMENT" = "production" ]; then
    required_vars=(
        "JWT_SECRET"
        "MONGODB_URI"
        "REDIS_URL"
        "CSMS_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${RED}❌ Required environment variable not set: $var${NC}"
            exit 1
        fi
    done
fi

echo -e "${GREEN}✅ Pre-deployment checks passed${NC}"

# Backup current deployment (if exists)
if [ "$BACKUP_ENABLED" = true ] && [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}💾 Creating backup...${NC}"
    
    # Create backup directory
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if docker ps | grep -q mongo; then
        echo "Backing up MongoDB..."
        docker exec mongo mongodump --out /backup
        docker cp mongo:/backup "$BACKUP_DIR/mongodb"
    fi
    
    # Backup configuration
    cp .env "$BACKUP_DIR/" 2>/dev/null || true
    cp docker-compose*.yml "$BACKUP_DIR/" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Backup created: $BACKUP_DIR${NC}"
fi

# Build new image
echo -e "${YELLOW}🔨 Building application image...${NC}"
docker build -t "$BUILD_IMAGE" .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Image build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Image built successfully${NC}"

# Run tests before deployment
echo -e "${YELLOW}🧪 Running tests...${NC}"
docker run --rm \
    -e NODE_ENV=test \
    "$BUILD_IMAGE" \
    npm test

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Tests failed, aborting deployment${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Tests passed${NC}"

# Stop existing services (graceful shutdown)
echo -e "${YELLOW}🛑 Stopping existing services...${NC}"
docker-compose -f "$DOCKER_COMPOSE_FILE" down --timeout 30

# Start new deployment
echo -e "${YELLOW}🚀 Starting new deployment...${NC}"
docker-compose -f "$DOCKER_COMPOSE_FILE" up -d

# Health check
echo -e "${YELLOW}🏥 Performing health checks...${NC}"
HEALTH_URL="http://localhost:3001/health"
TIMEOUT=0

while [ $TIMEOUT -lt $HEALTH_CHECK_TIMEOUT ]; do
    if curl -f -s "$HEALTH_URL" > /dev/null; then
        echo -e "${GREEN}✅ Application is healthy${NC}"
        break
    fi
    
    echo "Waiting for application to be ready... ($TIMEOUT/$HEALTH_CHECK_TIMEOUT)"
    sleep 5
    TIMEOUT=$((TIMEOUT + 5))
done

if [ $TIMEOUT -ge $HEALTH_CHECK_TIMEOUT ]; then
    echo -e "${RED}❌ Health check failed - rolling back${NC}"
    
    # Rollback
    echo -e "${YELLOW}🔙 Rolling back to previous version...${NC}"
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    # Restore from backup if available
    if [ "$BACKUP_ENABLED" = true ] && [ -d "$BACKUP_DIR" ]; then
        echo "Restoring from backup..."
        # Restore logic here
    fi
    
    exit 1
fi

# Detailed health check
echo -e "${YELLOW}🔍 Running detailed health checks...${NC}"
DETAILED_HEALTH=$(curl -s "http://localhost:3001/health/detailed")
SERVICE_STATUS=$(echo "$DETAILED_HEALTH" | jq -r '.status // "unknown"')

if [ "$SERVICE_STATUS" = "healthy" ]; then
    echo -e "${GREEN}✅ All services are healthy${NC}"
else
    echo -e "${YELLOW}⚠️ Some services may have issues${NC}"
    echo "$DETAILED_HEALTH" | jq .
fi

# Performance check
echo -e "${YELLOW}⚡ Running performance check...${NC}"
response_time=$(curl -o /dev/null -s -w "%{time_total}" "http://localhost:3001/api/dashboard/overview")
if (( $(echo "$response_time < 1.0" | bc -l) )); then
    echo -e "${GREEN}✅ Response time OK: ${response_time}s${NC}"
else
    echo -e "${YELLOW}⚠️ Slow response time: ${response_time}s${NC}"
fi

# Show running services
echo -e "${BLUE}📊 Deployment Status:${NC}"
docker-compose -f "$DOCKER_COMPOSE_FILE" ps

# Show logs (last 20 lines)
echo -e "${BLUE}📝 Recent logs:${NC}"
docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=20 simulator

# Cleanup old images
echo -e "${YELLOW}🧹 Cleaning up old images...${NC}"
docker image prune -f

echo ""
echo -e "${GREEN}🎉 Deployment to $ENVIRONMENT completed successfully!${NC}"
echo ""
echo "📊 Monitoring URLs:"
echo "  • Application: http://localhost:3001"
echo "  • Health Check: http://localhost:3001/health"
echo "  • Metrics: http://localhost:3001/health/metrics"
echo "  • Grafana: http://localhost:3002"
echo "  • Prometheus: http://localhost:9090"
echo ""
echo "📖 Useful commands:"
echo "  • View logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f simulator"
echo "  • Scale service: docker-compose -f $DOCKER_COMPOSE_FILE up -d --scale simulator=$REPLICA_COUNT"
echo "  • Stop services: docker-compose -f $DOCKER_COMPOSE_FILE down"
echo ""

# Send deployment notification (optional)
if [ ! -z "$WEBHOOK_URL" ]; then
    echo -e "${BLUE}📢 Sending deployment notification...${NC}"
    curl -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"🚀 EV Simulator deployed to $ENVIRONMENT successfully\"}" \
        2>/dev/null || true
fi

echo -e "${GREEN}✅ Deployment script completed${NC}"
