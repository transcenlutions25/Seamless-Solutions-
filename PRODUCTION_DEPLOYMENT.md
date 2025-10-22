# Production Deployment Guide

This guide covers deploying Seamless Solutions to production using Docker and Docker Compose.

## 🏗️ Architecture

The production setup includes:
- **Nginx**: Reverse proxy and load balancer
- **Web App**: Next.js application (port 3000)
- **API**: Fastify API server (port 4000)
- **PostgreSQL**: Database (port 5432)
- **Redis**: Caching and sessions (port 6379)

## 🚀 Quick Start

### 1. Prerequisites
- Docker and Docker Compose installed
- Git repository cloned
- Domain name configured (optional)

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env.production

# Edit with your production values
nano .env.production
```

### 3. Deploy
```bash
# Deploy to production
pnpm run deploy:prod

# Or use the script directly
./scripts/deploy.sh production
```

### 4. Verify Deployment
```bash
# Check health status
pnpm run health

# Monitor system
pnpm run monitor
```

## 📋 Environment Configuration

### Required Environment Variables

```env
# Database
POSTGRES_DB=seamless_solutions
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_PORT=5432

# Redis
REDIS_PASSWORD=your_redis_password
REDIS_PORT=6379

# API
API_PORT=4000
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info

# Web
WEB_PORT=3000
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Nginx
NGINX_PORT=80
NGINX_SSL_PORT=443
```

## 🐳 Docker Services

### Service Overview
- **nginx**: Reverse proxy (port 80/443)
- **web**: Next.js application
- **api**: Fastify API server
- **postgres**: PostgreSQL database
- **redis**: Redis cache

### Health Checks
All services include health checks:
- API: `GET /health`
- Web: `GET /api/health`
- Nginx: `GET /health`
- PostgreSQL: `pg_isready`
- Redis: `redis-cli ping`

## 📊 Monitoring & Maintenance

### Available Commands
```bash
# View logs
pnpm run logs              # All services
pnpm run logs:api          # API only
pnpm run logs:web          # Web only
pnpm run logs:nginx        # Nginx only

# System monitoring
pnpm run monitor           # System overview
pnpm run health            # Health checks

# Backup
pnpm run backup            # Create backup

# Service management
pnpm run stop              # Stop all services
pnpm run restart           # Restart all services
```

### Log Locations
- Application logs: `logs/` directory
- Docker logs: `docker-compose logs`
- Nginx logs: Inside nginx container

## 🔒 Security Considerations

### SSL/TLS Setup
1. Place SSL certificates in `infra/ssl/`:
   - `cert.pem`: Certificate file
   - `key.pem`: Private key file

2. Update nginx configuration for SSL:
   - Uncomment SSL server block in `infra/nginx.conf`
   - Update domain names

### Security Headers
Nginx is configured with security headers:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

### Database Security
- Use strong passwords
- Enable SSL connections
- Regular backups
- Access restrictions

## 🔄 Updates & Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
pnpm run deploy:prod
```

### Database Migrations
```bash
# Access database
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d seamless_solutions

# Run migrations (if you have migration scripts)
# Add your migration commands here
```

### Backup Strategy
```bash
# Manual backup
pnpm run backup

# Automated backups (add to crontab)
0 2 * * * /path/to/project/scripts/backup.sh
```

## 🚨 Troubleshooting

### Common Issues

1. **Services won't start**
   ```bash
   # Check logs
   pnpm run logs
   
   # Check Docker status
   docker-compose -f docker-compose.prod.yml ps
   ```

2. **Database connection issues**
   ```bash
   # Check database logs
   docker-compose -f docker-compose.prod.yml logs postgres
   
   # Test connection
   docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres
   ```

3. **Port conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :80
   
   # Update ports in .env.production
   ```

### Performance Optimization

1. **Database Optimization**
   - Add indexes for frequently queried columns
   - Configure connection pooling
   - Regular VACUUM and ANALYZE

2. **Caching**
   - Redis for session storage
   - Nginx caching for static assets
   - Application-level caching

3. **Monitoring**
   - Set up log aggregation
   - Monitor resource usage
   - Set up alerts

## 📈 Scaling

### Horizontal Scaling
- Use multiple API instances
- Load balancer configuration
- Database read replicas
- Redis clustering

### Vertical Scaling
- Increase container resources
- Optimize database configuration
- Tune Nginx settings

## 🔧 Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| Database | Local PostgreSQL | Containerized PostgreSQL |
| Caching | In-memory | Redis |
| Logging | Console | Structured logs |
| Security | Basic | Full security headers |
| SSL | Optional | Required |
| Monitoring | Basic | Comprehensive |

## 📞 Support

For issues and questions:
1. Check the logs: `pnpm run logs`
2. Run health checks: `pnpm run health`
3. Monitor system: `pnpm run monitor`
4. Check this documentation
5. Review Docker and service logs

## 🎯 Next Steps

1. **Set up monitoring**: Configure external monitoring services
2. **Implement CI/CD**: Automated testing and deployment
3. **Add monitoring**: Application performance monitoring
4. **Security audit**: Regular security assessments
5. **Backup testing**: Verify backup and restore procedures