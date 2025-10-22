#!/usr/bin/env bash
set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

ACTION="${1:-help}"

case "$ACTION" in
    start)
        echo -e "${BLUE}Starting Seamless Solutions...${NC}"
        
        # Start API
        echo -e "${BLUE}Starting API server...${NC}"
        cd apps/api && npx tsx src/index.ts > ../../api.log 2>&1 & 
        API_PID=$!
        echo $API_PID > ../../api.pid
        cd ../..
        
        # Start Web
        echo -e "${BLUE}Starting Web application...${NC}"
        cd apps/web && PORT=3000 npx next@15.0.0 dev > ../../web.log 2>&1 &
        WEB_PID=$!
        echo $WEB_PID > ../../web.pid
        cd ../..
        
        sleep 3
        echo -e "${GREEN}✅ Services started!${NC}"
        echo -e "${GREEN}Web: http://localhost:3000${NC}"
        echo -e "${GREEN}API: http://localhost:4000${NC}"
        ;;
        
    stop)
        echo -e "${YELLOW}Stopping services...${NC}"
        [ -f api.pid ] && kill $(cat api.pid) 2>/dev/null && rm api.pid || true
        [ -f web.pid ] && kill $(cat web.pid) 2>/dev/null && rm web.pid || true
        
        # Also kill by port if PID files are missing
        lsof -ti:4000 | xargs kill 2>/dev/null || true
        lsof -ti:3000 | xargs kill 2>/dev/null || true
        
        echo -e "${GREEN}✅ Services stopped${NC}"
        ;;
        
    status)
        echo -e "${BLUE}=== Service Status ===${NC}"
        
        # Check API
        if curl -s http://localhost:4000/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ API: Running on port 4000${NC}"
        else
            echo -e "${RED}❌ API: Not running${NC}"
        fi
        
        # Check Web
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Web: Running on port 3000${NC}"
        else
            echo -e "${RED}❌ Web: Not running${NC}"
        fi
        ;;
        
    logs)
        SERVICE="${2:-all}"
        case "$SERVICE" in
            api)
                echo -e "${BLUE}=== API Logs ===${NC}"
                [ -f api.log ] && tail -f api.log || echo "No API logs found"
                ;;
            web)
                echo -e "${BLUE}=== Web Logs ===${NC}"
                [ -f web.log ] && tail -f web.log || echo "No Web logs found"
                ;;
            all)
                echo -e "${BLUE}=== Recent Logs ===${NC}"
                echo -e "\n${YELLOW}API:${NC}"
                [ -f api.log ] && tail -10 api.log || echo "No API logs"
                echo -e "\n${YELLOW}Web:${NC}"
                [ -f web.log ] && tail -10 web.log || echo "No Web logs"
                ;;
        esac
        ;;
        
    restart)
        $0 stop
        sleep 2
        $0 start
        ;;
        
    help|*)
        echo -e "${BLUE}Seamless Solutions Management Script${NC}"
        echo -e "\nUsage: $0 {start|stop|restart|status|logs [api|web|all]|help}"
        echo -e "\nCommands:"
        echo -e "  ${GREEN}start${NC}    - Start all services"
        echo -e "  ${GREEN}stop${NC}     - Stop all services"
        echo -e "  ${GREEN}restart${NC}  - Restart all services"
        echo -e "  ${GREEN}status${NC}   - Check service status"
        echo -e "  ${GREEN}logs${NC}     - View service logs (api/web/all)"
        echo -e "  ${GREEN}help${NC}     - Show this help message"
        ;;
esac