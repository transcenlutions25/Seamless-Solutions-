#!/bin/bash
set -euo pipefail

# Monitoring script for Seamless Solutions
# Usage: ./scripts/monitor.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Load environment variables
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

echo "📊 Seamless Solutions - System Monitor"
echo "======================================"
echo ""

# System resources
echo "💻 System Resources:"
echo "   CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')"
echo "   Memory Usage: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
echo "   Disk Usage: $(df -h / | awk 'NR==2{printf "%s", $5}')"
echo ""

# Docker containers
echo "🐳 Docker Containers:"
docker-compose -f docker-compose.prod.yml ps
echo ""

# Service health
echo "🏥 Service Health:"
./scripts/health-check.sh
echo ""

# Recent logs
echo "📝 Recent Logs (last 10 lines):"
echo "   API Logs:"
docker-compose -f docker-compose.prod.yml logs --tail=5 api
echo ""
echo "   Web Logs:"
docker-compose -f docker-compose.prod.yml logs --tail=5 web
echo ""
echo "   Nginx Logs:"
docker-compose -f docker-compose.prod.yml logs --tail=5 nginx
echo ""

# Database stats
echo "📊 Database Statistics:"
if docker-compose -f docker-compose.prod.yml exec -T postgres psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-seamless_solutions} -c "SELECT COUNT(*) as user_count FROM app.users;" 2>/dev/null; then
    echo "   Database is accessible"
else
    echo "   Database connection failed"
fi

echo ""
echo "🕐 Monitor completed at: $(date)"