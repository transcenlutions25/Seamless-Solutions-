# Deployment Guide

This guide covers various deployment strategies for Seamless Solutions.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Docker Deployment](#docker-deployment)
4. [Cloud Platforms](#cloud-platforms)
5. [Database Migrations](#database-migrations)
6. [Monitoring & Logging](#monitoring--logging)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- Docker and Docker Compose installed (for containerized deployment)
- PostgreSQL 15+ database instance
- Redis 7+ instance
- SSL/TLS certificate for HTTPS (production)
- Domain name configured (production)

## Environment Configuration

### 1. Create Production Environment File

```bash
cd infra
cp .env.example .env
```

### 2. Configure Required Variables

Edit `infra/.env`:

```env
# Database - Use strong passwords!
POSTGRES_USER=seamless_prod
POSTGRES_PASSWORD=<generate-secure-password>
POSTGRES_DB=seamless_solutions
DATABASE_URL=postgresql://seamless_prod:<password>@db:5432/seamless_solutions

# JWT Secret - Generate with: openssl rand -base64 32
JWT_SECRET=<your-generated-secret>

# CORS - Your production domain
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# API URL
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Docker Deployment

### Development Environment

```bash
# Start all services
docker-compose -f infra/docker-compose.yml up

# Rebuild images
docker-compose -f infra/docker-compose.yml up --build

# View logs
docker-compose -f infra/docker-compose.yml logs -f

# Stop services
docker-compose -f infra/docker-compose.yml down
```

### Production Environment

```bash
# Build production images
docker-compose -f infra/docker-compose.prod.yml build

# Start services
docker-compose -f infra/docker-compose.prod.yml up -d

# Run database migrations
docker-compose -f infra/docker-compose.prod.yml exec api sh -c "cd /app/apps/api && pnpm exec prisma migrate deploy"

# View logs
docker-compose -f infra/docker-compose.prod.yml logs -f

# Check health
curl http://localhost/health

# Stop services
docker-compose -f infra/docker-compose.prod.yml down
```

## Cloud Platforms

### AWS Deployment

#### Using AWS ECS (Elastic Container Service)

1. **Build and push images to ECR**

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag images
docker build -t seamless-api -f apps/api/Dockerfile .
docker tag seamless-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/seamless-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/seamless-api:latest

docker build -t seamless-web -f apps/web/Dockerfile .
docker tag seamless-web:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/seamless-web:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/seamless-web:latest
```

2. **Create RDS PostgreSQL instance**
3. **Create ElastiCache Redis cluster**
4. **Create ECS task definitions** for API and Web
5. **Set up Application Load Balancer**
6. **Configure environment variables** in ECS task definitions

### Google Cloud Platform

#### Using Cloud Run

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/seamless-api apps/api
gcloud builds submit --tag gcr.io/PROJECT_ID/seamless-web apps/web

# Deploy API
gcloud run deploy seamless-api \
  --image gcr.io/PROJECT_ID/seamless-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Deploy Web
gcloud run deploy seamless-web \
  --image gcr.io/PROJECT_ID/seamless-web \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### DigitalOcean App Platform

1. Connect your GitHub repository
2. Configure build settings:
   - API: `apps/api/Dockerfile`
   - Web: `apps/web/Dockerfile`
3. Add managed PostgreSQL database
4. Add managed Redis instance
5. Configure environment variables
6. Deploy

### Vercel (Web App Only)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from web directory
cd apps/web
vercel --prod
```

Note: You'll need to deploy the API separately.

## Database Migrations

### Running Migrations

```bash
# Development
cd apps/api
pnpm exec prisma migrate dev

# Production (Docker)
docker-compose -f infra/docker-compose.prod.yml exec api sh -c "cd /app/apps/api && pnpm exec prisma migrate deploy"

# Production (Manual)
cd apps/api
pnpm exec prisma migrate deploy
```

### Creating New Migrations

```bash
cd apps/api
pnpm exec prisma migrate dev --name description_of_changes
```

### Resetting Database (Development Only!)

```bash
cd apps/api
pnpm exec prisma migrate reset
```

## SSL/TLS Configuration

### Using Let's Encrypt with Nginx

1. **Install Certbot**

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

2. **Obtain Certificate**

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

3. **Update nginx.conf**

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # ... rest of configuration
}
```

4. **Auto-renewal**

```bash
sudo certbot renew --dry-run
```

## Monitoring & Logging

### Health Checks

```bash
# API health
curl http://localhost:4000/health

# Via Nginx
curl http://localhost/health
```

### Docker Logs

```bash
# All services
docker-compose -f infra/docker-compose.prod.yml logs -f

# Specific service
docker-compose -f infra/docker-compose.prod.yml logs -f api
docker-compose -f infra/docker-compose.prod.yml logs -f web
```

### Application Logs

The API uses Pino logger. In production, logs are in JSON format for easy parsing.

### Recommended Monitoring Tools

- **Application Performance**: New Relic, Datadog, or AppDynamics
- **Error Tracking**: Sentry
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Log Aggregation**: ELK Stack, Splunk, or CloudWatch

## Backup Strategy

### Database Backups

```bash
# Backup PostgreSQL
docker-compose -f infra/docker-compose.prod.yml exec db pg_dump -U postgres seamless_solutions > backup-$(date +%Y%m%d).sql

# Restore from backup
docker-compose -f infra/docker-compose.prod.yml exec -T db psql -U postgres seamless_solutions < backup-20240101.sql
```

### Automated Backups

Set up a cron job:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/seamless-solutions && docker-compose -f infra/docker-compose.prod.yml exec db pg_dump -U postgres seamless_solutions > /backups/backup-$(date +\%Y\%m\%d).sql
```

## Scaling

### Horizontal Scaling

1. **Database**: Use read replicas for read-heavy workloads
2. **API**: Run multiple API containers behind load balancer
3. **Web**: Next.js supports automatic horizontal scaling
4. **Redis**: Use Redis Cluster for high availability

### Load Balancing

Update `docker-compose.prod.yml`:

```yaml
api:
  deploy:
    replicas: 3
  # ... rest of config

web:
  deploy:
    replicas: 3
  # ... rest of config
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```bash
# Check database is running
docker-compose -f infra/docker-compose.prod.yml ps db

# Check DATABASE_URL is correct
docker-compose -f infra/docker-compose.prod.yml exec api env | grep DATABASE_URL

# Test connection
docker-compose -f infra/docker-compose.prod.yml exec db psql -U postgres -d seamless_solutions -c "SELECT 1"
```

#### 2. Redis Connection Failed

```bash
# Check Redis is running
docker-compose -f infra/docker-compose.prod.yml ps redis

# Test connection
docker-compose -f infra/docker-compose.prod.yml exec redis redis-cli ping
```

#### 3. API Returns 500 Errors

```bash
# Check API logs
docker-compose -f infra/docker-compose.prod.yml logs api

# Check environment variables
docker-compose -f infra/docker-compose.prod.yml exec api env
```

#### 4. Web App Can't Connect to API

```bash
# Verify API is accessible
curl http://localhost:4000/health

# Check NEXT_PUBLIC_API_URL is set correctly
docker-compose -f infra/docker-compose.prod.yml exec web env | grep API_URL
```

### Performance Issues

1. **Enable Redis caching** for frequently accessed data
2. **Add database indexes** for common queries
3. **Enable Nginx caching** for static assets
4. **Use CDN** for static files
5. **Optimize Docker images** (multi-stage builds already implemented)

### Security Audit

```bash
# Check for vulnerable dependencies
pnpm audit

# Update dependencies
pnpm update --latest

# Scan Docker images
docker scan seamless-api
docker scan seamless-web
```

## CI/CD Integration

The project includes GitHub Actions workflows:

- `.github/workflows/ci.yml` - Runs on every push
- `.github/workflows/deploy.yml` - Deployment workflow

Customize deployment workflow for your infrastructure.

## Post-Deployment Checklist

- [ ] All services are running
- [ ] Health checks passing
- [ ] Database migrations completed
- [ ] SSL/TLS configured
- [ ] Domain DNS configured
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Error tracking configured
- [ ] Performance tested
- [ ] Security audit completed
- [ ] Documentation updated

## Support

For deployment issues:
1. Check logs first
2. Review this guide
3. Check GitHub issues
4. Contact your infrastructure team

---

Need help? Open an issue on GitHub or contact support.
