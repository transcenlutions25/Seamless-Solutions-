## API Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml ./

# Copy API sources
COPY apps/api/package.json apps/api/package.json
COPY apps/api/tsconfig.json apps/api/tsconfig.json
COPY apps/api/src apps/api/src

# Install deps for the workspace and build API
RUN pnpm install --ignore-scripts
RUN pnpm --filter @seamless/api build

# --- Runtime image ---
FROM node:20-alpine AS runtime
WORKDIR /app/apps/api
ENV NODE_ENV=production

# Copy built app and runtime deps
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json

EXPOSE 4000
CMD ["node", "dist/index.js"]
