#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
: "${REPO_NAME:=seamless-solutions}"
: "${GITHUB_USERNAME:=}"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get GitHub username if not provided
if [ -z "$GITHUB_USERNAME" ]; then 
    read -p "GitHub username: " GITHUB_USERNAME
    if [ -z "$GITHUB_USERNAME" ]; then
        log_error "GitHub username is required"
        exit 1
    fi
fi

log_info "Setting up repository: $REPO_NAME for user: $GITHUB_USERNAME"

# Initialize git repository if needed
if [ ! -d .git ]; then 
    log_info "Initializing git repository..."
    git init
    git branch -m main || true
fi

# Check if there are changes to commit
if git diff-index --quiet HEAD -- 2>/dev/null; then
    log_warn "No changes to commit"
else
    log_info "Adding and committing changes..."
    git add .
    git commit -m "init Seamless Solutions" || log_warn "Nothing to commit or commit failed"
fi

# Check if remote exists
if git remote get-url origin >/dev/null 2>&1; then
    log_info "Remote origin already exists"
else
    log_info "Adding remote origin..."
    git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
fi

log_info "Repository setup complete!"
log_info "Next steps:"
log_info "1. Create the repository on GitHub: https://github.com/new"
log_info "2. Run: git push -u origin main"
