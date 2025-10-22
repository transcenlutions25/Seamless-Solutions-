#!/bin/bash
# Database Backup Script for Seamless Solutions

set -e

# Configuration
BACKUP_DIR="./backups"
DB_CONTAINER="seamless-db"
DB_NAME="${DB_NAME:-seamless_solutions}"
DB_USER="${DB_USER:-postgres}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

print_status "Starting database backup..."

# Perform backup
if docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE; then
    print_status "Backup created successfully: $BACKUP_FILE"
    
    # Compress the backup
    gzip $BACKUP_FILE
    print_status "Backup compressed: ${BACKUP_FILE}.gz"
    
    # Keep only last 7 backups
    print_status "Cleaning old backups (keeping last 7)..."
    ls -t $BACKUP_DIR/backup_*.gz | tail -n +8 | xargs -r rm
    
    print_status "✓ Backup completed successfully"
else
    print_error "Backup failed!"
    exit 1
fi

# Show backup size
BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
print_status "Backup size: $BACKUP_SIZE"