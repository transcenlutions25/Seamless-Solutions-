# Deployment Instructions for Seamless Solutions

## Overview

This monorepo contains two main applications:
- **API Service** (`apps/api`) - Fastify backend server
- **Web Application** (`apps/web`) - Next.js frontend application

## Prerequisites

- Node.js 18+ and pnpm installed
- Docker and Docker Compose (for containerized deployment)
- Git for version control
- Access to deployment platform (Vercel, Railway, AWS, etc.)

## Local Development

1. **Install Dependencies:**
   ```bash
   pnpm install
   ```

2. **Start Development Services:**
   ```bash
   # Start database and cache services
   docker-compose -f infra/docker-compose.yml up -d

   # Start all applications in development mode
   pnpm dev
   ```

## Deployment Options

### Option 1: Docker Deployment (Recommended for Self-Hosting)

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose -f docker-compose.production.yml up -d
   ```

2. **Environment Variables:**
   Configure production environment variables in `.env.production` file.

### Option 2: Platform Deployment

#### Deploy Web App to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd apps/web
   vercel --prod
   ```

#### Deploy API to Railway/Render

1. **Configure build command:**
   ```
   pnpm install && pnpm build
   ```

2. **Configure start command:**
   ```
   pnpm start:api
   ```

### Option 3: Manual VPS Deployment

1. **Clone Repository:**
   ```bash
   git clone <your-repo-url>
   cd seamless-solutions
   ```

2. **Install Dependencies:**
   ```bash
   pnpm install
   ```

3. **Build Applications:**
   ```bash
   pnpm build
   ```

4. **Start Production Services:**
   ```bash
   # Using PM2 (recommended)
   pm2 start ecosystem.config.js

   # Or directly
   pnpm start
   ```

## Environment Variables

### API Service (`apps/api/.env`)
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/seamless_solutions
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

### Web Application (`apps/web/.env`)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Database Setup

1. **PostgreSQL Database:**
   ```bash
   # Create database
   createdb seamless_solutions

   # Run migrations (if applicable)
   pnpm db:migrate
   ```

2. **Redis Cache:**
   ```bash
   # Start Redis
   redis-server
   ```

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test
      # Add deployment steps for your platform
```

## Monitoring & Maintenance

1. **Health Checks:**
   - API: `http://api.yourdomain.com/health`
   - Web: `http://yourdomain.com`

2. **Logs:**
   ```bash
   # Docker logs
   docker-compose logs -f

   # PM2 logs
   pm2 logs
   ```

3. **Updates:**
   ```bash
   git pull origin main
   pnpm install
   pnpm build
   # Restart services
   ```

## Security Considerations

1. **Use HTTPS in production**
2. **Set secure environment variables**
3. **Enable CORS appropriately**
4. **Use rate limiting**
5. **Keep dependencies updated**
6. **Regular backups of database**

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   - Change ports in environment variables
   - Check for running services: `lsof -i :PORT`

2. **Database connection issues:**
   - Verify DATABASE_URL is correct
   - Check database service is running
   - Ensure network connectivity

3. **Build failures:**
   - Clear cache: `pnpm store prune`
   - Delete node_modules and reinstall

## Quick Deploy Script

```bash
#!/bin/bash
# deploy.sh - Quick deployment script

set -e

echo "🚀 Starting deployment..."

# Pull latest changes
git pull origin main

# Install dependencies
pnpm install --frozen-lockfile

# Build applications
pnpm build

# Run database migrations
# pnpm db:migrate

# Restart services
pm2 restart all || pm2 start ecosystem.config.js

echo "✅ Deployment complete!"
```

## Support

For issues or questions:
- Check application logs
- Review environment variables
- Ensure all services are running
- Check network connectivity

## Next Steps

1. Set up monitoring (e.g., Datadog, New Relic)
2. Configure automated backups
3. Set up SSL certificates
4. Implement CI/CD pipeline
5. Configure CDN for static assets