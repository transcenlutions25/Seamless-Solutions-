#!/bin/bash
# Database Restore Script for Seamless Solutions

set -e

# Configuration
BACKUP_DIR="./backups"
DB_CONTAINER="seamless-db"
DB_NAME="${DB_NAME:-seamless_solutions}"
DB_USER="${DB_USER:-postgres}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if backup file is provided
if [ -z "$1" ]; then
    print_error "Usage: $0 <backup_file>"
    print_status "Available backups:"
    ls -la $BACKUP_DIR/*.gz 2>/dev/null || print_warning "No backups found in $BACKUP_DIR"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

print_warning "⚠️  This will restore the database from: $BACKUP_FILE"
print_warning "⚠️  This will OVERWRITE all current data in the database!"
read -p "Are you sure you want to continue? (yes/no) " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_status "Restore cancelled"
    exit 0
fi

print_status "Starting database restore..."

# Create temporary uncompressed file if backup is compressed
TEMP_FILE=""
if [[ $BACKUP_FILE == *.gz ]]; then
    TEMP_FILE="/tmp/restore_temp_$(date +%s).sql"
    print_status "Decompressing backup file..."
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    RESTORE_FILE="$TEMP_FILE"
else
    RESTORE_FILE="$BACKUP_FILE"
fi

# Drop existing database and recreate
print_status "Dropping existing database..."
docker exec $DB_CONTAINER psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
docker exec $DB_CONTAINER psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

# Restore the backup
print_status "Restoring database..."
if docker exec -i $DB_CONTAINER psql -U $DB_USER $DB_NAME < "$RESTORE_FILE"; then
    print_status "✓ Database restored successfully"
else
    print_error "Restore failed!"
    # Clean up temp file if it exists
    [ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"
    exit 1
fi

# Clean up temp file if it exists
[ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"

print_status "Database restore completed successfully!"