# Seamless Solutions

A modern monorepo application with API and web services, ready for deployment.

## 🏗️ Architecture

- **Monorepo Structure**: Managed with pnpm workspaces
- **API Service**: Fastify-based REST API with TypeScript
- **Web Application**: Next.js 15 with React 18
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Containerization**: Docker with multi-stage builds

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm 10+
- Docker & Docker Compose (for containerized deployment)

### Development Setup

1. **Install dependencies:**
```bash
pnpm install
```

2. **Start development servers:**
```bash
pnpm dev
```

This starts:
- API server at http://localhost:4000
- Web application at http://localhost:3000

### Production Deployment

1. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your production values
```

2. **Build and start with Docker:**
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

## 📁 Project Structure

```
/workspace/
├── apps/
│   ├── api/          # Fastify API service
│   └── web/          # Next.js web application
├── infra/            # Infrastructure configuration
├── scripts/          # Utility scripts
└── package.json      # Root package configuration
```

## 🔧 Available Scripts

- `pnpm dev` - Start all services in development mode
- `pnpm build` - Build all services for production
- `pnpm start` - Start all services in production mode

## 🐳 Docker Services

- **db**: PostgreSQL database
- **redis**: Redis cache
- **api**: Fastify API service
- **web**: Next.js web application

## 📋 Deployment Checklist

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for a comprehensive deployment readiness assessment.

## 🔒 Security Notes

Before deploying to production:
1. Update all default passwords in `.env`
2. Configure proper CORS policies
3. Set up HTTPS/TLS certificates
4. Implement rate limiting
5. Configure firewall rules

## 📝 License

Private repository - All rights reserved
