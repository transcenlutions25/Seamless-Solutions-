# Seamless Solutions

A modern monorepo project built with TypeScript, Next.js, and Fastify.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 8.15+
- Docker (optional, for database services)

### Installation

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

### Available Scripts

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all applications
- `pnpm start` - Start production servers
- `pnpm lint` - Run linting across the project
- `pnpm docker:up` - Start Docker services (PostgreSQL, Redis)
- `pnpm docker:down` - Stop Docker services
- `pnpm push:github` - Initialize and push to GitHub

## 📁 Project Structure

```
├── apps/
│   ├── api/          # Fastify API server
│   └── web/          # Next.js web application
├── packages/         # Shared packages (future)
├── infra/           # Infrastructure configurations
└── scripts/         # Utility scripts
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Fastify, Node.js, TypeScript
- **Database**: PostgreSQL, Redis
- **Build Tools**: Turbo, pnpm workspaces
- **Development**: TSX, ESLint, Prettier

## 🔗 Services

- **Web App**: http://localhost:3000
- **API Server**: http://localhost:4000
- **API Health**: http://localhost:4000/health
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 📝 License

MIT