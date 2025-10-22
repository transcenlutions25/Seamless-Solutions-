#!/bin/bash
set -euo pipefail

# Health check script for Seamless Solutions
# Usage: ./scripts/health-check.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Load environment variables
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

NGINX_PORT=${NGINX_PORT:-80}
API_PORT=${API_PORT:-4000}
WEB_PORT=${WEB_PORT:-3000}

echo "🏥 Running health checks..."

# Check if services are running
echo "📊 Checking service status..."
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🔍 Testing endpoints..."

# Test Nginx health endpoint
echo -n "   Nginx health: "
if curl -s -f "http://localhost:$NGINX_PORT/health" > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

# Test API health endpoint
echo -n "   API health: "
if curl -s -f "http://localhost:$NGINX_PORT/api/health" > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

# Test API status endpoint
echo -n "   API status: "
if curl -s -f "http://localhost:$NGINX_PORT/api/status" > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

# Test web application
echo -n "   Web app: "
if curl -s -f "http://localhost:$NGINX_PORT" > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

# Test database connection
echo -n "   Database: "
if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U ${POSTGRES_USER:-postgres} > /dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

# Test Redis connection
echo -n "   Redis: "
if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

echo ""
echo "🏥 Health check completed!"