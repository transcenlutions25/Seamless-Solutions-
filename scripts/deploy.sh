#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Seamless Solutions Deployment Script"
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}Error: pnpm is not installed${NC}"
    echo "Install with: npm install -g pnpm"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}Warning: docker-compose not found. Skipping infrastructure setup.${NC}"
    SKIP_INFRA=true
else
    SKIP_INFRA=false
fi

echo ""
echo "Step 1: Installing dependencies..."
pnpm install

if [ "$SKIP_INFRA" = false ]; then
    echo ""
    echo "Step 2: Starting infrastructure (PostgreSQL + Redis)..."
    if command -v docker-compose &> /dev/null; then
        docker-compose -f infra/docker-compose.yml up -d
    else
        docker compose -f infra/docker-compose.yml up -d
    fi
else
    echo ""
    echo "Step 2: Skipping infrastructure setup (docker-compose not available)"
fi

echo ""
echo "Step 3: Building applications..."
pnpm build

echo ""
echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
echo ""
echo "Next steps:"
echo "  • For development: pnpm dev"
echo "  • For production with PM2:"
echo "      cd apps/api && pm2 start 'pnpm dev' --name api"
echo "      cd apps/web && pm2 start 'pnpm start' --name web"
echo ""
echo "  • Health checks:"
echo "      API: http://localhost:4000/health"
echo "      Web: http://localhost:3000"
echo ""
echo "For more deployment options, see DEPLOYMENT.md"
