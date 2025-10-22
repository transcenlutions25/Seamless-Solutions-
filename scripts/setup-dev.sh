#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Setting up Seamless Solutions development environment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20.x or higher."
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. You can still run locally without Docker."
    echo "   Install Docker to use the containerized development environment."
fi

echo -e "${GREEN}✓ Prerequisites check complete${NC}"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pnpm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Set up environment files
echo -e "${YELLOW}Setting up environment files...${NC}"

if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env from .env.example${NC}"
else
    echo -e "${GREEN}✓ .env already exists${NC}"
fi

if [ ! -f apps/api/.env ]; then
    cp apps/api/.env.example apps/api/.env
    echo -e "${GREEN}✓ Created apps/api/.env${NC}"
else
    echo -e "${GREEN}✓ apps/api/.env already exists${NC}"
fi

if [ ! -f apps/web/.env ]; then
    cp apps/web/.env.example apps/web/.env
    echo -e "${GREEN}✓ Created apps/web/.env${NC}"
else
    echo -e "${GREEN}✓ apps/web/.env already exists${NC}"
fi

# Build shared packages
echo -e "${YELLOW}Building shared packages...${NC}"
pnpm build:packages
echo -e "${GREEN}✓ Shared packages built${NC}"

# Setup Husky
echo -e "${YELLOW}Setting up Git hooks...${NC}"
pnpm prepare
echo -e "${GREEN}✓ Git hooks configured${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Start PostgreSQL and Redis:"
echo "   ${YELLOW}docker-compose -f infra/docker-compose.yml up db redis${NC}"
echo ""
echo "2. Run database migrations:"
echo "   ${YELLOW}cd apps/api && pnpm exec prisma migrate dev${NC}"
echo ""
echo "3. Start the development servers:"
echo "   ${YELLOW}pnpm --filter @seamless/api dev${NC}     (in one terminal)"
echo "   ${YELLOW}pnpm --filter @seamless/web dev${NC}     (in another terminal)"
echo ""
echo "Or use Docker for everything:"
echo "   ${YELLOW}docker-compose -f infra/docker-compose.yml up${NC}"
echo ""
echo "Access the app:"
echo "   Web:  http://localhost:3000"
echo "   API:  http://localhost:4000"
echo ""
