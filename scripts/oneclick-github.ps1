# Seamless Solutions - One-Click GitHub Push Script (PowerShell)
# This script initializes a git repository, adds all files, and pushes to GitHub

param(
    [string]$RepoName = "seamless-solutions",
    [string]$GitHubUsername = "",
    [string]$CommitMessage = "Initial commit - Seamless Solutions Platform"
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Seamless Solutions - GitHub Push Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if git is installed
try {
    git --version | Out-Null
} catch {
    Write-Error "Git is not installed. Please install Git and try again."
    exit 1
}

# Get GitHub username if not provided
if ([string]::IsNullOrEmpty($GitHubUsername)) {
    $GitHubUsername = Read-Host "Enter your GitHub username"
    if ([string]::IsNullOrEmpty($GitHubUsername)) {
        Write-Error "GitHub username is required."
        exit 1
    }
}

# Get repository name if not provided
if ([string]::IsNullOrEmpty($RepoName)) {
    $RepoName = Read-Host "Enter GitHub repository name (default: seamless-solutions)"
    if ([string]::IsNullOrEmpty($RepoName)) {
        $RepoName = "seamless-solutions"
    }
}

# Check if we're already in a git repository
if (Test-Path ".git") {
    Write-Warning "Already in a git repository."
    $continue = Read-Host "Do you want to continue? This will add and commit all changes. (y/N)"
    if ($continue -notmatch "^[Yy]$") {
        Write-Error "Aborted by user."
        exit 1
    }
} else {
    Write-Status "Initializing git repository..."
    git init
    Write-Success "Git repository initialized."
}

# Create .gitignore if it doesn't exist
if (-not (Test-Path ".gitignore")) {
    Write-Status "Creating .gitignore..."
    
    $gitignoreContent = @"
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
"@
    
    $gitignoreContent | Out-File -FilePath ".gitignore" -Encoding UTF8
    Write-Success ".gitignore created."
}

# Add all files
Write-Status "Adding files to git..."
git add .

# Check if there are any changes to commit
$stagedChanges = git diff --staged --name-only
if (-not $stagedChanges) {
    Write-Warning "No changes to commit."
    exit 0
}

# Get commit message if not provided
if ([string]::IsNullOrEmpty($CommitMessage)) {
    $CommitMessage = Read-Host "Enter commit message (default: 'Initial commit - Seamless Solutions Platform')"
    if ([string]::IsNullOrEmpty($CommitMessage)) {
        $CommitMessage = "Initial commit - Seamless Solutions Platform"
    }
}

# Commit changes
Write-Status "Committing changes..."
git commit -m $CommitMessage
Write-Success "Changes committed."

# Set up remote if it doesn't exist
$RemoteUrl = "https://github.com/$GitHubUsername/$RepoName.git"

try {
    $currentRemote = git remote get-url origin 2>$null
    Write-Warning "Remote 'origin' already exists."
    Write-Status "Current remote: $currentRemote"
    
    $updateRemote = Read-Host "Do you want to update the remote URL to $RemoteUrl? (y/N)"
    if ($updateRemote -match "^[Yy]$") {
        git remote set-url origin $RemoteUrl
        Write-Success "Remote URL updated."
    }
} catch {
    Write-Status "Adding remote origin..."
    git remote add origin $RemoteUrl
    Write-Success "Remote origin added."
}

# Get current branch name
$currentBranch = git branch --show-current
Write-Status "Current branch: $currentBranch"

# Push to GitHub
Write-Status "Pushing to GitHub..."
try {
    git push -u origin $currentBranch 2>$null
    Write-Success "Successfully pushed to GitHub!"
} catch {
    Write-Warning "Push failed. This might be because the repository doesn't exist on GitHub yet."
    Write-Host ""
    Write-Host "Please create the repository on GitHub first:" -ForegroundColor Yellow
    Write-Host "1. Go to https://github.com/new" -ForegroundColor Yellow
    Write-Host "2. Repository name: $RepoName" -ForegroundColor Yellow
    Write-Host "3. Make it public or private as needed" -ForegroundColor Yellow
    Write-Host "4. DON'T initialize with README, .gitignore, or license" -ForegroundColor Yellow
    Write-Host "5. Click 'Create repository'" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter after creating the repository on GitHub, then we'll try pushing again..."
    
    try {
        git push -u origin $currentBranch
        Write-Success "Successfully pushed to GitHub!"
    } catch {
        Write-Error "Push failed. Please check your GitHub credentials and repository settings."
        exit 1
    }
}

Write-Host ""
Write-Success "🎉 All done!"
Write-Host ""
Write-Host "Your Seamless Solutions platform is now on GitHub:" -ForegroundColor Green
Write-Host "Repository URL: https://github.com/$GitHubUsername/$RepoName" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Set up environment variables in your deployment platform" -ForegroundColor Yellow
Write-Host "2. Configure your database connection" -ForegroundColor Yellow
Write-Host "3. Set up Stripe keys for payment processing" -ForegroundColor Yellow
Write-Host "4. Configure email/SMS services" -ForegroundColor Yellow
Write-Host ""
Write-Host "For deployment instructions, see the README.md file." -ForegroundColor Yellow