#!/bin/bash
# Health Check Script for Seamless Solutions

set -e

# Configuration
API_URL="${API_URL:-http://localhost:3001}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Status tracking
HEALTH_STATUS=0

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
    HEALTH_STATUS=1
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_header() {
    echo ""
    echo "======================================"
    echo "  $1"
    echo "======================================"
}

check_service() {
    local service_name=$1
    local check_command=$2
    
    if eval $check_command &> /dev/null; then
        print_status "$service_name is healthy"
        return 0
    else
        print_error "$service_name is not responding"
        return 1
    fi
}

# Main health checks
print_header "Seamless Solutions Health Check"

# Check Docker services
print_header "Docker Services"
if command -v docker &> /dev/null; then
    docker-compose -f docker-compose.production.yml ps --format "table {{.Service}}\t{{.Status}}"
else
    print_warning "Docker not found, skipping container checks"
fi

# Check Database
print_header "Database"
check_service "PostgreSQL" "nc -z $DB_HOST $DB_PORT"

# Check Redis
print_header "Redis Cache"
check_service "Redis" "nc -z $REDIS_HOST $REDIS_PORT"

# Check API
print_header "API Service"
if curl -f -s -o /dev/null -w "%{http_code}" $API_URL/health | grep -q "200"; then
    print_status "API is healthy"
    
    # Get API details if available
    if command -v curl &> /dev/null; then
        response=$(curl -s $API_URL/health 2>/dev/null || echo "{}")
        echo "  Response: $response"
    fi
else
    print_error "API is not responding"
fi

# Check Web Application
print_header "Web Application"
if curl -f -s -o /dev/null -w "%{http_code}" $WEB_URL | grep -q "200"; then
    print_status "Web application is healthy"
else
    print_error "Web application is not responding"
fi

# Check Disk Space
print_header "System Resources"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 90 ]; then
    print_status "Disk usage: ${DISK_USAGE}%"
else
    print_warning "Disk usage high: ${DISK_USAGE}%"
fi

# Check Memory
if command -v free &> /dev/null; then
    MEM_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
    if [ "$MEM_USAGE" -lt 90 ]; then
        print_status "Memory usage: ${MEM_USAGE}%"
    else
        print_warning "Memory usage high: ${MEM_USAGE}%"
    fi
fi

# Summary
print_header "Summary"
if [ $HEALTH_STATUS -eq 0 ]; then
    echo -e "${GREEN}All services are healthy!${NC}"
else
    echo -e "${RED}Some services are not healthy. Please check the logs.${NC}"
fi

exit $HEALTH_STATUS