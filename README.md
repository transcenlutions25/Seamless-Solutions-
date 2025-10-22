# Seamless Solutions

A modern full-stack application with a Fastify API and Next.js web frontend.

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

### Docker Deployment
```bash
# Deploy entire stack (API, Web, PostgreSQL, Redis)
pnpm deploy

# Or manually with docker-compose
cd infra && docker-compose up -d --build
```

## 📦 What's Included

- **API**: Fastify server (port 4000)
- **Web**: Next.js 15 application (port 3000)
- **Database**: PostgreSQL 15 (port 5432)
- **Cache**: Redis 7 (port 6379)

## 📚 Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions and configuration options.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18
- **Backend**: Fastify 4
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Package Manager**: pnpm
- **Monorepo**: pnpm workspaces

## 📁 Project Structure

```
seamless-solutions/
├── apps/
│   ├── api/          # Fastify API server
│   └── web/          # Next.js web application
├── infra/
│   └── docker-compose.yml  # Container orchestration
└── scripts/          # Utility scripts
```
