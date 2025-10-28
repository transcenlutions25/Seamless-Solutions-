# Quick Start - Seamless Solutions Deployment

## 🚀 Fastest Deployment (Docker)

### 1. Prerequisites
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 2. Clone & Configure
```bash
# Clone the repository
git clone <your-repo-url>
cd seamless-solutions

# Set up environment
cp .env.example .env
# Edit .env with your values
nano .env
```

### 3. Deploy
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run deployment
./scripts/deploy.sh
```

Your application is now running at:
- 🌐 Web: http://localhost:3000
- 🔧 API: http://localhost:3001

## 📝 Essential Commands

```bash
# View logs
docker-compose -f docker-compose.production.yml logs -f

# Stop services
./scripts/deploy.sh stop

# Restart services
./scripts/deploy.sh restart

# Check health
./scripts/health-check.sh

# Backup database
./scripts/backup.sh

# Restore database
./scripts/restore.sh backup_file.gz
```

## 🔧 Configuration Files

- `.env` - Environment variables (create from .env.example)
- `docker-compose.production.yml` - Docker services configuration
- `nginx/nginx.conf` - Nginx reverse proxy configuration
- `ecosystem.config.js` - PM2 configuration (alternative to Docker)

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐
│   Nginx     │────▶│  Next.js    │
│  (Port 80)  │     │ (Port 3000) │
└─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  Fastify    │────▶│ PostgreSQL  │
│ (Port 3001) │     │ (Port 5432) │
└─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│    Redis    │
│ (Port 6379) │
└─────────────┘
```

## 🆘 Troubleshooting

### Services not starting?
```bash
# Check logs
docker-compose -f docker-compose.production.yml logs

# Check port availability
sudo lsof -i :3000
sudo lsof -i :3001
```

### Database connection issues?
```bash
# Check database is running
docker ps | grep postgres

# Test connection
docker exec seamless-db psql -U postgres -c "SELECT 1"
```

### Need help?
- Check full documentation: `DEPLOYMENT.md`
- Review logs: `docker-compose logs`
- Verify environment: `.env` file