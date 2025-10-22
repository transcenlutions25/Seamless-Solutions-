# syntax=docker/dockerfile:1
FROM node:20-alpine
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json

# Install dependencies
RUN pnpm install

# Copy source
COPY . .

# Build web
RUN pnpm -C apps/web build

EXPOSE 3000
CMD ["pnpm", "--filter", "@seamless/web", "start"]
