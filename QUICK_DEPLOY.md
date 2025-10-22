# Quick Deploy Reference

## 🚀 One-Command Deploy

```bash
bash scripts/deploy.sh
```

## 📋 Common Deployment Scenarios

### Local Development
```bash
pnpm install
docker-compose -f infra/docker-compose.yml up -d
pnpm dev
```

### VPS/Server (Ubuntu/Debian)
```bash
# 1. Install prerequisites
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
npm install -g pnpm pm2

# 2. Clone and setup
git clone YOUR_REPO_URL
cd seamless-solutions
pnpm install

# 3. Start infrastructure
docker-compose -f infra/docker-compose.yml up -d

# 4. Build and start with PM2
pnpm build
cd apps/api && pm2 start "pnpm dev" --name api
cd ../web && pm2 start "pnpm start" --name web
pm2 save && pm2 startup
```

### Vercel (Web Only)
```bash
cd apps/web
vercel --prod
```

### Docker Compose (Full Stack)
Create `docker-compose.prod.yml`:
```yaml
version: '3.9'
services:
  api:
    build: ./apps/api
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/seamless_solutions
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
  
  web:
    build: ./apps/web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:4000
    depends_on:
      - api
  
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_USER: postgres
      POSTGRES_DB: seamless_solutions
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

Deploy with:
```bash
docker compose -f docker-compose.prod.yml up -d
```

## 🔍 Health Checks

```bash
# API
curl http://localhost:4000/health

# Web
curl http://localhost:3000
```

## 🛠️ Useful Commands

```bash
# View logs
pm2 logs
docker-compose -f infra/docker-compose.yml logs -f

# Restart services
pm2 restart all
docker-compose -f infra/docker-compose.yml restart

# Stop services
pm2 stop all
docker-compose -f infra/docker-compose.yml down

# Database access
docker-compose -f infra/docker-compose.yml exec db psql -U postgres -d seamless_solutions
```

## 🔐 Environment Setup

```bash
# Copy example env
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local

# Edit as needed
nano apps/api/.env
nano apps/web/.env.local
```

## 📊 Port Reference

- **3000** - Next.js Web App
- **4000** - Fastify API
- **5432** - PostgreSQL
- **6379** - Redis

---

For complete documentation, see [DEPLOYMENT.md](./DEPLOYMENT.md)
