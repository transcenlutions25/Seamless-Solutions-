#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Starting Seamless Solutions deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to kill processes on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping all services...${NC}"
    if [ ! -z "${API_PID:-}" ]; then
        kill $API_PID 2>/dev/null || true
    fi
    if [ ! -z "${WEB_PID:-}" ]; then
        kill $WEB_PID 2>/dev/null || true
    fi
    exit
}

trap cleanup EXIT INT TERM

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}Installing dependencies...${NC}"
    pnpm install
fi

# Start API in background
echo -e "${BLUE}Starting API server on port 4000...${NC}"
cd apps/api
npx tsx src/index.ts > ../../api.log 2>&1 &
API_PID=$!
cd ../..

# Wait a moment for API to start
sleep 2

# Build Next.js app if not built
if [ ! -d "apps/web/.next" ]; then
    echo -e "${BLUE}Building Next.js application...${NC}"
    cd apps/web
    npx next build
    cd ../..
fi

# Start Web app in background
echo -e "${BLUE}Starting Web application on port 3000...${NC}"
cd apps/web
PORT=3000 npx next start > ../../web.log 2>&1 &
WEB_PID=$!
cd ../..

echo -e "\n${GREEN}✅ Deployment successful!${NC}"
echo -e "${GREEN}📱 Web application: http://localhost:3000${NC}"
echo -e "${GREEN}🔧 API server: http://localhost:4000${NC}"
echo -e "${GREEN}❤️  Health check: http://localhost:4000/health${NC}"
echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}"

# Keep script running
while true; do
    sleep 1
done