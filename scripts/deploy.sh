#!/bin/bash
set -euo pipefail

# Production deployment script for Seamless Solutions
# Usage: ./scripts/deploy.sh [environment]

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting deployment for environment: $ENVIRONMENT"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

cd "$PROJECT_DIR"

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    echo "📋 Loading environment variables from .env.$ENVIRONMENT"
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
elif [ -f ".env.production" ]; then
    echo "📋 Loading environment variables from .env.production"
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "⚠️  No environment file found. Using default values."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p infra/ssl
mkdir -p logs

# Generate SSL certificates if they don't exist (self-signed for development)
if [ ! -f "infra/ssl/cert.pem" ] || [ ! -f "infra/ssl/key.pem" ]; then
    echo "🔐 Generating self-signed SSL certificates..."
    openssl req -x509 -newkey rsa:4096 -keyout infra/ssl/key.pem -out infra/ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.prod.yml down --remove-orphans
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
timeout=300
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if docker-compose -f docker-compose.prod.yml ps | grep -q "unhealthy"; then
        echo "⏳ Services are starting up... ($elapsed/$timeout seconds)"
        sleep 10
        elapsed=$((elapsed + 10))
    else
        echo "✅ All services are healthy!"
        break
    fi
done

if [ $elapsed -ge $timeout ]; then
    echo "❌ Services failed to become healthy within $timeout seconds"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

# Display service status
echo "📊 Service Status:"
docker-compose -f docker-compose.prod.yml ps

# Display access URLs
echo ""
echo "🌐 Application URLs:"
echo "   Web Application: http://localhost:${NGINX_PORT:-80}"
echo "   API Endpoint: http://localhost:${NGINX_PORT:-80}/api"
echo "   Health Check: http://localhost:${NGINX_PORT:-80}/health"
echo ""
echo "📋 Service Ports:"
echo "   Nginx: ${NGINX_PORT:-80}"
echo "   Web App: ${WEB_PORT:-3000}"
echo "   API: ${API_PORT:-4000}"
echo "   PostgreSQL: ${POSTGRES_PORT:-5432}"
echo "   Redis: ${REDIS_PORT:-6379}"

echo ""
echo "✅ Deployment completed successfully!"
echo "📝 To view logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "🛑 To stop services: docker-compose -f docker-compose.prod.yml down"