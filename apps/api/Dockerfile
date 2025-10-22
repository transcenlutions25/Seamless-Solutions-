# syntax=docker/dockerfile:1
FROM node:20-alpine
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# Copy workspace manifests first (better layer caching)
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

# Install dependencies (workspace-aware)
RUN pnpm install

# Copy the rest of the repository
COPY . .

# Build only the API package
RUN pnpm -C apps/api build

EXPOSE 4000
CMD ["pnpm", "--filter", "@seamless/api", "start"]
