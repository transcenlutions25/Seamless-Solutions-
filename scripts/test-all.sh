#!/usr/bin/env bash
set -euo pipefail

echo "🧪 Running all tests and checks..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

FAILED=0

# Linting
echo -e "${YELLOW}Running linter...${NC}"
if pnpm lint; then
    echo -e "${GREEN}✓ Linting passed${NC}"
else
    echo -e "${RED}✗ Linting failed${NC}"
    FAILED=1
fi

# Format check
echo -e "${YELLOW}Checking code formatting...${NC}"
if pnpm format:check; then
    echo -e "${GREEN}✓ Formatting check passed${NC}"
else
    echo -e "${RED}✗ Formatting check failed${NC}"
    FAILED=1
fi

# TypeScript compilation
echo -e "${YELLOW}Building TypeScript...${NC}"
if pnpm build; then
    echo -e "${GREEN}✓ TypeScript compilation passed${NC}"
else
    echo -e "${RED}✗ TypeScript compilation failed${NC}"
    FAILED=1
fi

# Unit tests
echo -e "${YELLOW}Running unit tests...${NC}"
if pnpm test; then
    echo -e "${GREEN}✓ Unit tests passed${NC}"
else
    echo -e "${RED}✗ Unit tests failed${NC}"
    FAILED=1
fi

echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}🎉 All checks passed!${NC}"
    echo -e "${GREEN}========================================${NC}"
    exit 0
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}❌ Some checks failed${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi
