# Seamless Solutions

A modern monorepo with Fastify API and Next.js web application.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL + Redis)
docker-compose -f infra/docker-compose.yml up -d

# Start development servers
pnpm dev
```

- **API**: http://localhost:4000
- **Web**: http://localhost:3000

## Documentation

- **[Deployment Guide](./DEPLOYMENT.md)** - Complete deployment instructions for production
- **[Environment Variables](./.env.example)** - Configuration examples

## Project Structure

```
apps/
├── api/          # Fastify backend
└── web/          # Next.js frontend
infra/
└── docker-compose.yml  # PostgreSQL + Redis
```

## Development

Open this repo in Cursor, then paste the FINAL_MASTER_PROMPT.txt to build.

For deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).
