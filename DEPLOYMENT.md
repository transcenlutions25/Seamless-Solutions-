# Deployment Instructions - Seamless Solutions

This monorepo contains a Fastify API and Next.js web application. Below are deployment instructions for various platforms.

## Project Structure

```
apps/
├── api/          # Fastify backend (port 4000)
└── web/          # Next.js frontend (port 3000)
infra/
└── docker-compose.yml  # PostgreSQL + Redis
```

## Prerequisites

- Node.js 18+ 
- pnpm 8+
- Docker & Docker Compose (for local infrastructure)

## Local Development

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start infrastructure (PostgreSQL + Redis):**
   ```bash
   docker-compose -f infra/docker-compose.yml up -d
   ```

3. **Start all services:**
   ```bash
   pnpm dev
   ```

   This runs both API (http://localhost:4000) and Web (http://localhost:3000)

4. **Stop infrastructure:**
   ```bash
   docker-compose -f infra/docker-compose.yml down
   ```

## Production Deployment Options

### Option 1: Docker Deployment (Recommended)

Create `Dockerfile` for API:

```dockerfile
# apps/api/Dockerfile
FROM node:18-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

FROM base AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY apps/api ./apps/api
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["pnpm", "dev"]
```

Create `Dockerfile` for Web:

```dockerfile
# apps/web/Dockerfile
FROM node:18-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY apps/web ./apps/web
WORKDIR /app/apps/web
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY apps/web/package.json ./apps/web/
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
```

### Option 2: Vercel (Next.js Web App)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy from project root:**
   ```bash
   cd apps/web
   vercel --prod
   ```

3. **Configure environment variables in Vercel dashboard:**
   - `NEXT_PUBLIC_API_URL`: Your API endpoint

### Option 3: Railway / Render

**For API:**
- Build Command: `cd apps/api && pnpm install`
- Start Command: `cd apps/api && pnpm dev`
- Port: 4000

**For Web:**
- Build Command: `cd apps/web && pnpm install && pnpm build`
- Start Command: `cd apps/web && pnpm start`
- Port: 3000

### Option 4: AWS / DigitalOcean / VPS

1. **SSH into server and clone repo:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/seamless-solutions.git
   cd seamless-solutions
   ```

2. **Install pnpm:**
   ```bash
   npm install -g pnpm
   ```

3. **Install dependencies:**
   ```bash
   pnpm install
   ```

4. **Build applications:**
   ```bash
   pnpm build
   ```

5. **Use PM2 for process management:**
   ```bash
   npm install -g pm2
   
   # Start API
   cd apps/api
   pm2 start "pnpm dev" --name api
   
   # Start Web
   cd ../web
   pm2 start "pnpm start" --name web
   
   # Save PM2 config
   pm2 save
   pm2 startup
   ```

6. **Setup Nginx as reverse proxy:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /api {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Environment Variables

Create `.env` files in each app:

**apps/api/.env:**
```env
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/seamless_solutions
REDIS_URL=redis://localhost:6379
NODE_ENV=production
```

**apps/web/.env:**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Database Migration

If using PostgreSQL:
```bash
# Access database
docker-compose -f infra/docker-compose.yml exec db psql -U postgres -d seamless_solutions

# Or from host
psql postgresql://postgres:postgres@localhost:5432/seamless_solutions
```

## Health Checks

- API: `http://localhost:4000/health` → `{"ok": true}`
- Web: `http://localhost:3000`

## GitHub Push

Push to GitHub using the provided script:
```bash
pnpm push:github
# Or manually:
# bash scripts/oneclick-github.sh
```

## Troubleshooting

**Port conflicts:**
```bash
# Check what's using ports
lsof -i :3000
lsof -i :4000
```

**Dependencies issues:**
```bash
# Clean install
rm -rf node_modules apps/*/node_modules
pnpm install
```

**Docker issues:**
```bash
# Restart containers
docker-compose -f infra/docker-compose.yml restart
# View logs
docker-compose -f infra/docker-compose.yml logs -f
```

## Monitoring & Logs

**Using PM2:**
```bash
pm2 logs
pm2 monit
```

**Docker logs:**
```bash
docker-compose -f infra/docker-compose.yml logs -f
```

## Security Considerations

1. Change default PostgreSQL password in production
2. Use environment variables for sensitive data
3. Enable HTTPS with Let's Encrypt/Certbot
4. Configure CORS appropriately in API
5. Use security headers in Next.js

## Scaling

- **Horizontal:** Deploy multiple instances behind a load balancer
- **Database:** Use managed PostgreSQL (AWS RDS, DigitalOcean Managed DB)
- **Cache:** Use managed Redis (AWS ElastiCache, Redis Cloud)
- **CDN:** Use Cloudflare or AWS CloudFront for static assets

---

For questions or issues, check the logs and ensure all prerequisites are installed.
