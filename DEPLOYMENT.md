# Deployment Instructions - Seamless Solutions

This document provides comprehensive deployment instructions for the Seamless Solutions monorepo project.

## Project Overview

Seamless Solutions is a full-stack application built with:
- **Frontend**: Next.js 15 React application (`@seamless/web`)
- **Backend**: Fastify API server (`@seamless/api`)
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Package Manager**: pnpm with workspace configuration
- **Monorepo Management**: Turborepo

## Prerequisites

Before deploying, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (latest version)
- **Docker** and **Docker Compose** (for local development and containerized deployment)
- **Git**

## Local Development Setup

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd seamless-solutions
pnpm install
```

### 2. Start Infrastructure Services

Start PostgreSQL and Redis using Docker Compose:

```bash
cd infra
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432 (user: postgres, password: postgres, database: seamless_solutions)
- Redis on port 6379

### 3. Start Development Servers

From the root directory:

```bash
# Start all services in development mode
pnpm dev
```

This will start:
- API server on http://localhost:4000
- Web application on http://localhost:3000

### 4. Verify Setup

- API Health Check: http://localhost:4000/health
- Web Application: http://localhost:3000

## Production Deployment Options

### Option 1: Docker-Based Deployment (Recommended)

#### Step 1: Create Production Docker Configuration

Create `docker-compose.prod.yml`:

```yaml
version: '3.9'
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-your_secure_password}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-seamless_solutions}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-your_secure_password}@db:5432/${POSTGRES_DB:-seamless_solutions}
      - REDIS_URL=redis://redis:6379
    ports:
      - "4000:4000"
    depends_on:
      - db
      - redis
    restart: unless-stopped

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://api:4000
    ports:
      - "3000:3000"
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

#### Step 2: Create Dockerfiles

Create `apps/api/Dockerfile`:

```dockerfile
FROM node:18-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build --filter @seamless/api

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
COPY --from=builder /app/apps/api/dist ./
COPY --from=builder /app/node_modules ./node_modules
USER nodejs
EXPOSE 4000
CMD ["node", "index.js"]
```

Create `apps/web/Dockerfile`:

```dockerfile
FROM node:18-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build --filter @seamless/web

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public
USER nodejs
EXPOSE 3000
CMD ["node", "server.js"]
```

#### Step 3: Deploy with Docker Compose

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Option 2: Traditional Server Deployment

#### Step 1: Prepare the Server

```bash
# Install Node.js and pnpm on your server
curl -fsSL https://get.pnpm.io/install.sh | sh
```

#### Step 2: Build the Applications

```bash
# Install dependencies
pnpm install

# Build all applications
pnpm build
```

#### Step 3: Set Environment Variables

Create `.env.production`:

```env
NODE_ENV=production
DATABASE_URL=postgresql://username:password@localhost:5432/seamless_solutions
REDIS_URL=redis://localhost:6379
PORT_API=4000
PORT_WEB=3000
```

#### Step 4: Start Services

```bash
# Start API server
cd apps/api
pnpm start &

# Start Web application
cd ../web
pnpm start &
```

### Option 3: Cloud Platform Deployment

#### Vercel (Web App)

1. Connect your GitHub repository to Vercel
2. Set build command: `pnpm build --filter @seamless/web`
3. Set output directory: `apps/web/.next`
4. Configure environment variables in Vercel dashboard

#### Railway/Render (API)

1. Connect your GitHub repository
2. Set build command: `pnpm build --filter @seamless/api`
3. Set start command: `pnpm start --filter @seamless/api`
4. Configure environment variables in platform dashboard

## Environment Variables

### Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=seamless_solutions

# Redis
REDIS_URL=redis://host:port

# Application
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

## Health Checks and Monitoring

### API Health Check
```bash
curl http://localhost:4000/health
```

Expected response:
```json
{"ok": true}
```

### Database Connection Check
```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d seamless_solutions
```

### Redis Connection Check
```bash
# Connect to Redis
redis-cli ping
```

## Backup and Maintenance

### Database Backup
```bash
# Create backup
pg_dump -h localhost -U postgres seamless_solutions > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql -h localhost -U postgres -d seamless_solutions < backup_file.sql
```

### Redis Backup
```bash
# Redis automatically creates dump.rdb
# Copy /data/dump.rdb for backup
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 4000, 5432, and 6379 are available
2. **Database connection**: Verify PostgreSQL is running and credentials are correct
3. **Build failures**: Check Node.js version compatibility (v18+)
4. **Permission errors**: Ensure proper file permissions for Docker volumes

### Logs

```bash
# Docker logs
docker-compose logs -f [service_name]

# Application logs
pnpm logs --filter @seamless/api
pnpm logs --filter @seamless/web
```

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to version control
2. **Database**: Use strong passwords and limit network access
3. **HTTPS**: Always use HTTPS in production
4. **Firewall**: Configure firewall rules to limit access to necessary ports only
5. **Updates**: Regularly update dependencies and base images

## GitHub Integration

Use the provided script to push to GitHub:

```bash
# Set your GitHub username
export GITHUB_USERNAME=your_username

# Push to GitHub
pnpm push:github
```

## Support

For deployment issues:
1. Check the logs for error messages
2. Verify all environment variables are set correctly
3. Ensure all services are running and healthy
4. Check network connectivity between services

---

**Note**: This deployment guide assumes a basic setup. For production environments, consider additional security measures, load balancing, SSL certificates, and monitoring solutions.