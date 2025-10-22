#!/bin/bash
set -euo pipefail

# Backup script for Seamless Solutions
# Usage: ./scripts/backup.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

cd "$PROJECT_DIR"

# Load environment variables
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

echo "💾 Starting backup process..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
echo "📊 Backing up database..."
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U ${POSTGRES_USER:-postgres} ${POSTGRES_DB:-seamless_solutions} > "$BACKUP_DIR/database_$TIMESTAMP.sql"

# Backup Redis data
echo "🔴 Backing up Redis data..."
docker-compose -f docker-compose.prod.yml exec -T redis redis-cli --rdb - > "$BACKUP_DIR/redis_$TIMESTAMP.rdb"

# Backup application logs
echo "📝 Backing up logs..."
if [ -d "logs" ]; then
    tar -czf "$BACKUP_DIR/logs_$TIMESTAMP.tar.gz" logs/
fi

# Backup environment configuration
echo "⚙️  Backing up configuration..."
cp .env.production "$BACKUP_DIR/env_$TIMESTAMP.production" 2>/dev/null || true

# Create backup manifest
cat > "$BACKUP_DIR/manifest_$TIMESTAMP.txt" << EOF
Backup created: $(date)
Database: database_$TIMESTAMP.sql
Redis: redis_$TIMESTAMP.rdb
Logs: logs_$TIMESTAMP.tar.gz
Environment: env_$TIMESTAMP.production
EOF

echo "✅ Backup completed successfully!"
echo "📁 Backup location: $BACKUP_DIR"
echo "📋 Backup manifest: $BACKUP_DIR/manifest_$TIMESTAMP.txt"

# Clean up old backups (keep last 7 days)
echo "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.rdb" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.txt" -mtime +7 -delete

echo "✅ Old backups cleaned up!"