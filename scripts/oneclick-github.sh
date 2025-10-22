#!/usr/bin/env bash
set -euo pipefail

# Configuration
: "${REPO_NAME:=seamless-solutions}"
: "${GITHUB_USERNAME:=}"

# Get GitHub username if not provided
if [ -z "$GITHUB_USERNAME" ]; then 
    read -p "GitHub username: " GITHUB_USERNAME
fi

# Initialize git if needed
if [ ! -d .git ]; then 
    echo "Initializing git repository..."
    git init
    git branch -m main || true
fi

# Stage and commit changes
echo "Staging changes..."
git add .

if git diff --staged --quiet; then
    echo "No changes to commit"
else
    echo "Committing changes..."
    git commit -m "init: Seamless Solutions" || true
fi

# Set up remote if not exists
if ! git remote | grep -q "origin"; then
    echo "Setting up GitHub remote..."
    git remote add origin "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
fi

echo "Repository setup complete!"
