#!/usr/bin/env bash
set -euo pipefail
: "${REPO_NAME:=seamless-solutions}"
: "${GITHUB_USERNAME:=}"
if [ -z "$GITHUB_USERNAME" ]; then read -p "GitHub username: " GITHUB_USERNAME; fi
if [ ! -d .git ]; then git init; git branch -m main || true; fi
git add .
git commit -m "init Seamless Solutions" || true
