FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root package files
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml* ./

# Copy api package files
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @seamless/api...

# Copy api source
COPY apps/api ./apps/api

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["npx", "tsx", "src/index.ts"]