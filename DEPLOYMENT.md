# Deployment Guide

## Prerequisites

- Docker and Docker Compose installed on your system
- Node.js 22+ and pnpm (for local development)

## Quick Start - Docker Deployment

The easiest way to deploy the entire application stack:

```bash
# Deploy everything (builds and starts all services)
pnpm deploy

# Or manually:
cd infra
docker-compose up -d --build
```

This will start:
- PostgreSQL database on port 5432
- Redis on port 6379
- API server on port 4000
- Web application on port 3000

## Deployment Commands

```bash
# Build Docker images
pnpm docker:build

# Start all services
pnpm docker:up

# Stop all services
pnpm docker:down

# View logs
pnpm docker:logs
```

## Local Development (without Docker)

```bash
# Install dependencies
pnpm install

# Start PostgreSQL and Redis with Docker
cd infra
docker-compose up db redis -d

# In separate terminals, start the apps
pnpm --filter @seamless/api dev
pnpm --filter @seamless/web dev
```

## Service URLs

Once deployed, access the services at:

- **Web App**: http://localhost:3000
- **API**: http://localhost:4000
- **API Health Check**: http://localhost:4000/health
- **PostgreSQL**: localhost:5432 (user: postgres, password: postgres, db: seamless_solutions)
- **Redis**: localhost:6379

## Environment Variables

The docker-compose.yml configures the following environment variables:

### API
- `NODE_ENV=production`
- `DATABASE_URL=postgresql://postgres:postgres@db:5432/seamless_solutions`
- `REDIS_URL=redis://redis:6379`

### Web
- `NODE_ENV=production`
- `NEXT_PUBLIC_API_URL=http://api:4000`

## Production Deployment

For production deployment to a cloud provider:

1. **Set up a server** with Docker and Docker Compose
2. **Clone the repository**
3. **Update environment variables** in `infra/docker-compose.yml` for production secrets
4. **Run** `pnpm deploy` or `docker-compose up -d --build`

### Cloud Platform Options

- **AWS ECS/Fargate**: Use the Dockerfiles to create ECR images
- **Google Cloud Run**: Deploy containers individually
- **DigitalOcean App Platform**: Connect your GitHub repo
- **Railway/Render**: One-click deploy from GitHub
- **Kubernetes**: Use the Dockerfiles as a base for k8s deployments

## Troubleshooting

View logs for a specific service:
```bash
cd infra
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f db
```

Restart a specific service:
```bash
cd infra
docker-compose restart api
```

Rebuild after code changes:
```bash
pnpm deploy
```
