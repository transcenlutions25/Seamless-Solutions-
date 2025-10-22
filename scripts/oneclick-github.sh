#!/usr/bin/env bash
set -euo pipefail
: "${REPO_NAME:=seamless-solutions}"
: "${GITHUB_USERNAME:=}"
if [ -z "$GITHUB_USERNAME" ]; then read -p "GitHub username: " GITHUB_USERNAME; fi
if [ ! -d .git ]; then git init; git branch -m main || true; fi

echo "🚀 Building and deploying Seamless Solutions..."

# Build the application
echo "📦 Building application..."
pnpm install
pnpm build

# Add all files and commit
git add .
git commit -m "Deploy Seamless Solutions - $(date)" || true

# Push to GitHub
echo "📤 Pushing to GitHub..."
git remote add origin "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git" 2>/dev/null || true
git push -u origin main

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at:"
echo "   - Web: http://localhost:3000"
echo "   - API: http://localhost:4000"
echo ""
echo "🐳 To run with Docker:"
echo "   docker-compose -f docker-compose.prod.yml up -d"
