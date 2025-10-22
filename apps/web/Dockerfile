FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root package files
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml* ./

# Copy web package files
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @seamless/web...

# Copy web source
COPY apps/web ./apps/web

# Build the Next.js application
WORKDIR /app/apps/web
RUN npx next build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web ./apps/web
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["npx", "next", "start"]