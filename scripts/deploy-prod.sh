#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Deploying Seamless Solutions to production..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists in infra directory
if [ ! -f infra/.env ]; then
    echo -e "${RED}❌ infra/.env file not found!${NC}"
    echo "Please create infra/.env from infra/.env.example and configure production values."
    exit 1
fi

# Confirm deployment
echo -e "${YELLOW}⚠️  WARNING: This will deploy to production!${NC}"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

# Build Docker images
echo -e "${YELLOW}Building production Docker images...${NC}"
docker-compose -f infra/docker-compose.prod.yml build
echo -e "${GREEN}✓ Docker images built${NC}"

# Stop existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose -f infra/docker-compose.prod.yml down
echo -e "${GREEN}✓ Containers stopped${NC}"

# Start services
echo -e "${YELLOW}Starting production services...${NC}"
docker-compose -f infra/docker-compose.prod.yml up -d
echo -e "${GREEN}✓ Services started${NC}"

# Wait for database to be ready
echo -e "${YELLOW}Waiting for database...${NC}"
sleep 10

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
docker-compose -f infra/docker-compose.prod.yml exec -T api sh -c "cd /app/apps/api && pnpm exec prisma migrate deploy"
echo -e "${GREEN}✓ Migrations completed${NC}"

# Check health
echo -e "${YELLOW}Checking health...${NC}"
sleep 5

if curl -f http://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed!${NC}"
    echo "Check logs with: docker-compose -f infra/docker-compose.prod.yml logs"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Application is running at:"
echo "   http://localhost"
echo ""
echo "Useful commands:"
echo "   View logs:    docker-compose -f infra/docker-compose.prod.yml logs -f"
echo "   Stop:         docker-compose -f infra/docker-compose.prod.yml down"
echo "   Restart:      docker-compose -f infra/docker-compose.prod.yml restart"
echo ""
