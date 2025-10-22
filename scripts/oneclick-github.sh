#!/bin/bash

# Seamless Solutions - One-Click GitHub Push Script
# This script initializes a git repository, adds all files, and pushes to GitHub

set -e  # Exit on any error

echo "🚀 Seamless Solutions - GitHub Push Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git and try again."
    exit 1
fi

# Get repository name (default: seamless-solutions)
read -p "Enter GitHub repository name (default: seamless-solutions): " REPO_NAME
REPO_NAME=${REPO_NAME:-seamless-solutions}

# Get GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    print_error "GitHub username is required."
    exit 1
fi

# Check if we're already in a git repository
if [ -d ".git" ]; then
    print_warning "Already in a git repository."
    read -p "Do you want to continue? This will add and commit all changes. (y/N): " CONTINUE
    if [[ ! $CONTINUE =~ ^[Yy]$ ]]; then
        print_error "Aborted by user."
        exit 1
    fi
else
    print_status "Initializing git repository..."
    git init
    print_success "Git repository initialized."
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    print_status "Creating .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
.next/
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Database
*.db
*.sqlite

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
tmp/
temp/

# Docker
.dockerignore

# Prisma
prisma/migrations/
EOF
    print_success ".gitignore created."
fi

# Add all files
print_status "Adding files to git..."
git add .

# Check if there are any changes to commit
if git diff --staged --quiet; then
    print_warning "No changes to commit."
    exit 0
fi

# Get commit message
read -p "Enter commit message (default: 'Initial commit - Seamless Solutions Platform'): " COMMIT_MESSAGE
COMMIT_MESSAGE=${COMMIT_MESSAGE:-"Initial commit - Seamless Solutions Platform"}

# Commit changes
print_status "Committing changes..."
git commit -m "$COMMIT_MESSAGE"
print_success "Changes committed."

# Set up remote if it doesn't exist
REMOTE_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

if git remote get-url origin &> /dev/null; then
    print_warning "Remote 'origin' already exists."
    CURRENT_REMOTE=$(git remote get-url origin)
    print_status "Current remote: $CURRENT_REMOTE"
    
    read -p "Do you want to update the remote URL to $REMOTE_URL? (y/N): " UPDATE_REMOTE
    if [[ $UPDATE_REMOTE =~ ^[Yy]$ ]]; then
        git remote set-url origin "$REMOTE_URL"
        print_success "Remote URL updated."
    fi
else
    print_status "Adding remote origin..."
    git remote add origin "$REMOTE_URL"
    print_success "Remote origin added."
fi

# Get current branch name
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: $CURRENT_BRANCH"

# Push to GitHub
print_status "Pushing to GitHub..."
if git push -u origin "$CURRENT_BRANCH" 2>/dev/null; then
    print_success "Successfully pushed to GitHub!"
else
    print_warning "Push failed. This might be because the repository doesn't exist on GitHub yet."
    echo ""
    echo "Please create the repository on GitHub first:"
    echo "1. Go to https://github.com/new"
    echo "2. Repository name: $REPO_NAME"
    echo "3. Make it public or private as needed"
    echo "4. DON'T initialize with README, .gitignore, or license"
    echo "5. Click 'Create repository'"
    echo ""
    read -p "Press Enter after creating the repository on GitHub, then we'll try pushing again..."
    
    if git push -u origin "$CURRENT_BRANCH"; then
        print_success "Successfully pushed to GitHub!"
    else
        print_error "Push failed. Please check your GitHub credentials and repository settings."
        exit 1
    fi
fi

echo ""
print_success "🎉 All done!"
echo ""
echo "Your Seamless Solutions platform is now on GitHub:"
echo "Repository URL: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""
echo "Next steps:"
echo "1. Set up environment variables in your deployment platform"
echo "2. Configure your database connection"
echo "3. Set up Stripe keys for payment processing"
echo "4. Configure email/SMS services"
echo ""
echo "For deployment instructions, see the README.md file."