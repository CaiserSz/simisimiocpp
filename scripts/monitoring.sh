#!/bin/bash

# EV Charging Station Simulator - Monitoring & Maintenance Script
# Usage: ./scripts/monitoring.sh [action] [options]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

ACTION="${1:-status}"
SERVICE="${2:-all}"

echo -e "${BLUE}📊 EV Simulator Monitoring${NC}"
echo "=========================="

case $ACTION in
    "status")
        echo -e "${YELLOW}🔍 Checking system status...${NC}"
        
        # Application health
        echo -e "${BLUE}Application Health:${NC}"
        if curl -f -s http://localhost:3001/health > /dev/null; then
            echo -e "${GREEN}✅ Application: Healthy${NC}"
            
            # Detailed health
            HEALTH_DATA=$(curl -s http://localhost:3001/health/detailed)
            echo "Database: $(echo "$HEALTH_DATA" | jq -r '.services.database.status // "unknown"')"
            echo "WebSocket: $(echo "$HEALTH_DATA" | jq -r '.services.websocket.status // "unknown"')"
            echo "Uptime: $(echo "$HEALTH_DATA" | jq -r '.uptime // "unknown"')s"
        else
            echo -e "${RED}❌ Application: Down${NC}"
        fi
        
        # Docker services
        echo -e "${BLUE}Docker Services:${NC}"
        docker-compose ps
        
        # System resources
        echo -e "${BLUE}System Resources:${NC}"
        echo "CPU: $(docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}' | grep simulator | awk '{print $2}' | head -1)"
        echo "Memory: $(docker stats --no-stream --format 'table {{.Name}}\t{{.MemUsage}}' | grep simulator | awk '{print $2}' | head -1)"
        
        # Active stations
        if curl -f -s http://localhost:3001/health > /dev/null; then
            OVERVIEW=$(curl -s http://localhost:3001/api/dashboard/overview)
            TOTAL_STATIONS=$(echo "$OVERVIEW" | jq -r '.data.stations.total // 0')
            ONLINE_STATIONS=$(echo "$OVERVIEW" | jq -r '.data.stations.online // 0')
            ACTIVE_CHARGING=$(echo "$OVERVIEW" | jq -r '.data.connectors.active // 0')
            
            echo -e "${BLUE}Simulation Status:${NC}"
            echo "Total Stations: $TOTAL_STATIONS"
            echo "Online Stations: $ONLINE_STATIONS"
            echo "Active Charging: $ACTIVE_CHARGING"
        fi
        ;;
    
    "logs")
        echo -e "${YELLOW}📝 Showing logs for $SERVICE...${NC}"
        
        case $SERVICE in
            "simulator"|"app")
                docker-compose logs -f --tail=100 simulator
                ;;
            "mongo"|"database")
                docker-compose logs -f --tail=100 mongo
                ;;
            "redis")
                docker-compose logs -f --tail=100 redis
                ;;
            "grafana")
                docker-compose logs -f --tail=100 grafana
                ;;
            "prometheus")
                docker-compose logs -f --tail=100 prometheus
                ;;
            "all"|*)
                docker-compose logs -f --tail=50
                ;;
        esac
        ;;
    
    "restart")
        echo -e "${YELLOW}🔄 Restarting $SERVICE...${NC}"
        
        case $SERVICE in
            "simulator"|"app")
                docker-compose restart simulator
                ;;
            "mongo"|"database")
                docker-compose restart mongo
                ;;
            "redis")
                docker-compose restart redis
                ;;
            "monitoring")
                docker-compose restart prometheus grafana
                ;;
            "all"|*)
                docker-compose restart
                ;;
        esac
        
        # Wait for services to be ready
        echo "Waiting for services to be ready..."
        sleep 10
        
        # Health check
        if curl -f -s http://localhost:3001/health > /dev/null; then
            echo -e "${GREEN}✅ Services restarted successfully${NC}"
        else
            echo -e "${RED}❌ Services may not be ready yet${NC}"
        fi
        ;;
    
    "metrics")
        echo -e "${YELLOW}📊 Fetching system metrics...${NC}"
        
        # Prometheus metrics
        echo -e "${BLUE}Prometheus Metrics:${NC}"
        if curl -f -s http://localhost:9090/-/healthy > /dev/null; then
            echo -e "${GREEN}✅ Prometheus: Healthy${NC}"
            
            # Query some key metrics
            echo "Active stations: $(curl -s 'http://localhost:9090/api/v1/query?query=simulator_active_stations' | jq -r '.data.result[0].value[1] // "0"')"
            echo "Total power: $(curl -s 'http://localhost:9090/api/v1/query?query=simulator_total_power_kw' | jq -r '.data.result[0].value[1] // "0"') kW"
            echo "HTTP requests/min: $(curl -s 'http://localhost:9090/api/v1/query?query=rate(http_requests_total[1m])' | jq -r '.data.result[0].value[1] // "0"')"
        else
            echo -e "${RED}❌ Prometheus: Down${NC}"
        fi
        
        # Application metrics
        echo -e "${BLUE}Application Metrics:${NC}"
        if curl -f -s http://localhost:3001/health/metrics/summary > /dev/null; then
            METRICS=$(curl -s http://localhost:3001/health/metrics/summary)
            echo "HTTP requests: $(echo "$METRICS" | jq -r '.data.http.requestsTotal // 0')"
            echo "WebSocket connections: $(echo "$METRICS" | jq -r '.data.websocket.activeConnections // 0')"
            echo "OCPP stations: $(echo "$METRICS" | jq -r '.data.ocpp.totalStations // 0')"
            echo "Active charging: $(echo "$METRICS" | jq -r '.data.business.activeChargingSessions // 0')"
        fi
        ;;
    
    "backup")
        echo -e "${YELLOW}💾 Creating system backup...${NC}"
        
        BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Database backup
        echo "Backing up MongoDB..."
        docker exec mongo mongodump --out /backup
        docker cp mongo:/backup "$BACKUP_DIR/mongodb"
        
        # Configuration backup
        echo "Backing up configuration..."
        cp .env "$BACKUP_DIR/" 2>/dev/null || true
        cp docker-compose*.yml "$BACKUP_DIR/"
        cp -r monitoring/ "$BACKUP_DIR/"
        
        # Application logs
        echo "Backing up logs..."
        docker-compose logs > "$BACKUP_DIR/application.log"
        
        # Metrics export
        echo "Backing up metrics..."
        curl -s http://localhost:3001/health/metrics > "$BACKUP_DIR/metrics.txt"
        
        # Compress backup
        tar -czf "${BACKUP_DIR}.tar.gz" "$BACKUP_DIR"
        rm -rf "$BACKUP_DIR"
        
        echo -e "${GREEN}✅ Backup created: ${BACKUP_DIR}.tar.gz${NC}"
        ;;
    
    "cleanup")
        echo -e "${YELLOW}🧹 Cleaning up system...${NC}"
        
        # Stop services
        docker-compose down
        
        # Clean Docker images
        echo "Removing unused Docker images..."
        docker image prune -f
        
        # Clean Docker volumes (careful!)
        echo "Removing unused Docker volumes..."
        docker volume prune -f
        
        # Clean application logs
        echo "Rotating logs..."
        docker-compose logs > "logs/archive_$(date +%Y%m%d_%H%M%S).log"
        
        # Clean old backups (keep last 5)
        echo "Cleaning old backups..."
        ls -t backups/*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
        
        echo -e "${GREEN}✅ Cleanup completed${NC}"
        ;;
    
    "scale")
        REPLICAS="${3:-3}"
        echo -e "${YELLOW}📈 Scaling simulator to $REPLICAS replicas...${NC}"
        
        docker-compose up -d --scale simulator="$REPLICAS"
        
        # Wait for scaling
        sleep 15
        
        # Check status
        docker-compose ps simulator
        echo -e "${GREEN}✅ Scaling completed${NC}"
        ;;
    
    "performance")
        echo -e "${YELLOW}⚡ Running performance diagnostics...${NC}"
        
        # System performance
        echo -e "${BLUE}System Performance:${NC}"
        docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}'
        
        # Application performance
        echo -e "${BLUE}Application Performance:${NC}"
        if curl -f -s http://localhost:3001/health > /dev/null; then
            # Response time test
            RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:3001/api/dashboard/overview)
            echo "Dashboard response time: ${RESPONSE_TIME}s"
            
            # Load test
            echo "Running quick load test..."
            for i in {1..10}; do
                curl -s http://localhost:3001/health > /dev/null &
            done
            wait
            echo "Concurrent requests test completed"
        fi
        
        # Database performance
        echo -e "${BLUE}Database Performance:${NC}"
        if docker ps | grep -q mongo; then
            docker exec mongo mongostat --host localhost:27017 -n 1
        fi
        ;;
    
    "alerts")
        echo -e "${YELLOW}🚨 Checking system alerts...${NC}"
        
        # Check Prometheus alerts (if available)
        if curl -f -s http://localhost:9090/-/healthy > /dev/null; then
            ALERTS=$(curl -s http://localhost:9090/api/v1/alerts)
            ACTIVE_ALERTS=$(echo "$ALERTS" | jq -r '.data.alerts | length')
            
            if [ "$ACTIVE_ALERTS" = "0" ]; then
                echo -e "${GREEN}✅ No active alerts${NC}"
            else
                echo -e "${RED}❌ $ACTIVE_ALERTS active alerts:${NC}"
                echo "$ALERTS" | jq -r '.data.alerts[] | "\(.labels.alertname): \(.annotations.summary)"'
            fi
        fi
        
        # Application health checks
        if curl -f -s http://localhost:3001/health/detailed > /dev/null; then
            HEALTH=$(curl -s http://localhost:3001/health/detailed)
            DB_STATUS=$(echo "$HEALTH" | jq -r '.services.database.status')
            
            if [ "$DB_STATUS" != "healthy" ]; then
                echo -e "${RED}❌ Database health issue: $DB_STATUS${NC}"
            fi
        fi
        
        # Resource usage alerts
        CPU_USAGE=$(docker stats --no-stream --format '{{.CPUPerc}}' simulator | sed 's/%//')
        if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
            echo -e "${RED}❌ High CPU usage: $CPU_USAGE%${NC}"
        fi
        ;;
    
    "help"|*)
        echo -e "${BLUE}Available commands:${NC}"
        echo "  status     - Show system status"
        echo "  logs       - Show service logs [service]"
        echo "  restart    - Restart services [service]"
        echo "  metrics    - Show system metrics"
        echo "  backup     - Create system backup"
        echo "  cleanup    - Clean up system resources"
        echo "  scale      - Scale simulator [replicas]"
        echo "  performance- Run performance diagnostics"
        echo "  alerts     - Check system alerts"
        echo ""
        echo "Services: simulator, mongo, redis, grafana, prometheus, all"
        ;;
esac

echo ""
echo -e "${GREEN}✅ Monitoring operation completed${NC}"
