#!/usr/bin/env bash
set -euo pipefail

echo "📦 Creating database backup..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create backups directory if it doesn't exist
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/seamless_backup_$TIMESTAMP.sql"

# Check if running in Docker
if docker-compose -f infra/docker-compose.prod.yml ps db &> /dev/null; then
    echo -e "${YELLOW}Creating backup from Docker container...${NC}"
    docker-compose -f infra/docker-compose.prod.yml exec -T db pg_dump -U postgres seamless_solutions > "$BACKUP_FILE"
elif docker-compose -f infra/docker-compose.yml ps db &> /dev/null; then
    echo -e "${YELLOW}Creating backup from dev Docker container...${NC}"
    docker-compose -f infra/docker-compose.yml exec -T db pg_dump -U postgres seamless_solutions > "$BACKUP_FILE"
else
    echo -e "${YELLOW}Creating backup from local PostgreSQL...${NC}"
    pg_dump -U postgres seamless_solutions > "$BACKUP_FILE"
fi

# Compress backup
echo -e "${YELLOW}Compressing backup...${NC}"
gzip "$BACKUP_FILE"

echo -e "${GREEN}✓ Backup created: ${BACKUP_FILE}.gz${NC}"
echo ""
echo "To restore this backup:"
echo "  gunzip ${BACKUP_FILE}.gz"
echo "  psql -U postgres seamless_solutions < $BACKUP_FILE"
echo ""
