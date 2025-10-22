#!/usr/bin/env bash
set -euo pipefail

# Configuration
: "${REPO_NAME:=seamless-solutions}"
: "${GITHUB_USERNAME:=}"

# Get GitHub username if not provided
if [ -z "$GITHUB_USERNAME" ]; then 
  read -p "GitHub username: " GITHUB_USERNAME
fi

# Initialize git repository if needed
if [ ! -d .git ]; then 
  echo "Initializing git repository..."
  git init
  git branch -m main || true
fi

# Add and commit changes
echo "Adding files to git..."
git add .

echo "Committing changes..."
git commit -m "init Seamless Solutions" || true

echo "Repository setup complete!"
echo "Next steps:"
echo "1. Create a new repository on GitHub named '$REPO_NAME'"
echo "2. Add the remote: git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
echo "3. Push: git push -u origin main"
