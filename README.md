# Seamless Solutions 🚀

> A production-ready, multi-tenant platform for service businesses to manage leads, schedule jobs, send invoices, and grow revenue.

[![CI](https://github.com/yourusername/seamless-solutions/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/seamless-solutions/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Features

### Core Capabilities
- **🔐 Auth & Organizations** - Multi-tenant architecture with role-based access (OWNER, STAFF, VENDOR, CLIENT)
- **📊 CRM & Leads** - Full pipeline management with conversion tracking
- **🤖 AI Bid Calculator** - Smart pricing engine with auto-tuning based on conversion data
- **📄 Quotes & Invoices** - Professional PDF generation with Stripe payment processing
- **📅 Job Management** - Scheduling, dispatch, and real-time tracking
- **👷 Vendor Portal** - Mobile-friendly field management with clock in/out and QC photos
- **📧 Marketing Automation** - Email/SMS campaigns with targeting and analytics
- **📈 Analytics Dashboard** - Real-time KPIs and business intelligence
- **💾 File Management** - Secure cloud storage with S3/Supabase
- **📱 PWA Support** - Installable progressive web app with offline capabilities

## 🛠️ Tech Stack

### Backend
- **Fastify** - High-performance Node.js framework
- **Prisma** - Type-safe ORM with PostgreSQL
- **Redis** - Caching and session management
- **Stripe** - Payment processing
- **Supabase** - Auth and real-time features
- **Zod** - Runtime validation
- **JWT** - Secure authentication

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety throughout
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Premium component library
- **React Query** - Data fetching and caching
- **Zustand** - State management
- **React Hook Form** - Form handling

### Infrastructure
- **Docker** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **pnpm** - Fast package management
- **Turbo** - Monorepo build system

## 📦 Project Structure

```
seamless-solutions/
├── apps/
│   ├── api/          # Fastify backend API
│   │   ├── prisma/   # Database schema & migrations
│   │   └── src/      # API source code
│   └── web/          # Next.js frontend
│       ├── app/      # App router pages
│       └── components/ # React components
├── packages/
│   └── shared/       # Shared types & schemas
├── infra/
│   └── docker-compose.yml
└── scripts/          # Utility scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL (via Docker)
- Redis (via Docker)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/seamless-solutions.git
cd seamless-solutions
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start infrastructure services**
```bash
pnpm docker:up
```

5. **Run database migrations**
```bash
pnpm prisma:migrate
```

6. **Seed the database**
```bash
pnpm prisma:seed
```

7. **Start development servers**
```bash
pnpm dev
```

The application will be available at:
- Web: http://localhost:3000
- API: http://localhost:3001
- API Docs: http://localhost:3001/docs

## 📝 Available Scripts

```bash
# Development
pnpm dev              # Start all services in dev mode
pnpm dev:api          # Start API only
pnpm dev:web          # Start web only

# Database
pnpm prisma:migrate   # Run migrations
pnpm prisma:seed      # Seed database
pnpm db:reset         # Reset database

# Docker
pnpm docker:up        # Start Postgres & Redis
pnpm docker:down      # Stop services
pnpm docker:build     # Build production images
pnpm docker:prod      # Run production stack

# Quality
pnpm lint             # Run ESLint
pnpm typecheck        # TypeScript checking
pnpm test             # Run tests
pnpm build            # Build for production

# Deployment
pnpm push:github      # Push to GitHub
```

## 🔑 Default Credentials

### Demo Organization
- **Subdomain:** demo
- **Owner:** owner@demo.com / password123
- **Staff:** sarah@demo.com / password123
- **Vendor:** alex@demo.com / password123

## 🏗️ API Endpoints

### Authentication
- `POST /auth/signup` - Create new account
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user
- `POST /auth/refresh` - Refresh token

### Leads
- `POST /leads/capture` - Public lead form
- `GET /leads` - List leads
- `GET /leads/:id` - Get lead details
- `PATCH /leads/:id/status` - Update status
- `GET /leads/stats/pipeline` - Pipeline statistics

### AI Bidding
- `POST /ai/bid` - Calculate bid
- `GET /ai/bid/:id` - Get bid details
- `POST /ai/bid/:id/recalculate` - Recalculate
- `POST /ai/tune-pricing` - Auto-tune pricing

### Quotes
- `POST /quotes` - Create quote
- `GET /quotes` - List quotes
- `GET /quotes/:id` - Get quote
- `POST /quotes/:id/send` - Send to client
- `GET /quotes/:id/pdf` - Generate PDF
- `POST /quotes/:id/accept` - Accept quote
- `POST /quotes/:id/reject` - Reject quote

### Jobs
- `POST /jobs` - Create job
- `GET /jobs` - List jobs
- `GET /jobs/:id` - Get job
- `PATCH /jobs/:id/status` - Update status
- `POST /jobs/:id/clock-in` - Vendor clock in
- `POST /jobs/:id/clock-out` - Vendor clock out

### Invoices
- `POST /invoices` - Create invoice
- `GET /invoices` - List invoices
- `GET /invoices/:id` - Get invoice
- `POST /invoices/:id/send` - Send invoice
- `POST /invoices/:id/pay` - Process payment
- `GET /invoices/:id/pdf` - Generate PDF

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Organization-scoped data isolation
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation with Zod
- SQL injection prevention (Prisma)
- XSS protection
- HTTPS enforcement (production)

## 📊 Database Schema

Key models include:
- **User** - System users with roles
- **Org** - Multi-tenant organizations
- **Contact** - Leads, clients, vendors
- **Lead** - Sales pipeline management
- **Bid** - AI-calculated pricing
- **Quote** - Customer proposals
- **Job** - Work orders and scheduling
- **Invoice** - Billing and payments
- **Campaign** - Marketing automation
- **ActivityLog** - Audit trail

## 🚢 Deployment

### Docker Production

```bash
# Build images
pnpm docker:build

# Run production stack
pnpm docker:prod
```

### Environment Variables

Required for production:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `JWT_SECRET` - Secure random string
- `STRIPE_SECRET_KEY` - Stripe API key
- `SUPABASE_*` - Supabase credentials

### One-Click GitHub Deploy

```bash
pnpm push:github
```

This script:
1. Creates/updates GitHub repository
2. Commits all changes
3. Pushes to main branch
4. Triggers CI/CD pipeline

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific suite
pnpm test -- auth
```

## 📈 Performance Optimizations

- Database query optimization with indexes
- Redis caching for frequently accessed data
- API response compression
- Image optimization with Next.js
- Code splitting and lazy loading
- Turbo build caching
- Connection pooling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT © 2025 Seamless Solutions

## 🆘 Support

- Documentation: [docs.seamless.com](https://docs.seamless.com)
- Email: support@seamless.com
- Discord: [Join our community](https://discord.gg/seamless)

## 🎯 Roadmap

- [ ] Mobile apps (React Native)
- [ ] Advanced reporting
- [ ] Webhook integrations
- [ ] Multi-language support
- [ ] Advanced automation rules
- [ ] AI-powered insights
- [ ] White-label options
- [ ] Marketplace for integrations

---

**Built with ❤️ for service businesses everywhere**

Open this repo in Cursor, then paste the FINAL_MASTER_PROMPT.txt to build.
