# Seamless Solutions

A modern full-stack application built with TypeScript, Next.js, and Fastify.

## Project Structure

```
├── apps/
│   ├── api/          # Fastify API server
│   └── web/          # Next.js web application
├── infra/            # Docker infrastructure
├── scripts/          # Utility scripts
└── package.json      # Root package configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

This will start:
- API server on http://localhost:4000
- Web application on http://localhost:3000

### Available Scripts

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all applications
- `pnpm start` - Start production servers
- `pnpm push:github` - Initialize and push to GitHub

## Development

### API Server

The API server is built with Fastify and TypeScript:
- Health check endpoint: `GET /health`
- Located in `apps/api/`

### Web Application

The web application is built with Next.js 15 and React:
- Modern React with TypeScript
- App Router architecture
- Located in `apps/web/`

## Infrastructure

Docker Compose configuration for local development:
- PostgreSQL database (port 5432)
- Redis cache (port 6379)

Start with: `docker-compose -f infra/docker-compose.yml up -d`
