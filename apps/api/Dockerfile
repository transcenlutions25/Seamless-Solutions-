# Multi-stage build for production
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS build
COPY . .
RUN pnpm build --filter @seamless/api

# Production stage
FROM node:18-alpine AS production

# Install pnpm
RUN npm install -g pnpm

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod --filter @seamless/api

# Copy built application
COPY --from=build --chown=nextjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=nextjs:nodejs /app/apps/api/src ./apps/api/src

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "apps/api/src/index.js"]