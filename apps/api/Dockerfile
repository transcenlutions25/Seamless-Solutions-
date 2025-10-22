FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the application
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy source code
COPY apps/api ./apps/api
COPY package.json pnpm-workspace.yaml ./

# Generate Prisma client
RUN cd apps/api && pnpm prisma:generate

# Build
RUN cd apps/api && pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 seamless

# Copy built application
COPY --from=builder --chown=seamless:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=seamless:nodejs /app/apps/api/node_modules ./node_modules
COPY --from=builder --chown=seamless:nodejs /app/apps/api/prisma ./prisma
COPY --from=builder --chown=seamless:nodejs /app/apps/api/package.json ./

USER seamless

EXPOSE 4000

CMD ["node", "dist/index.js"]
