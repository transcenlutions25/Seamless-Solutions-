# Seamless Solutions

**Production-ready, multi-tenant, full-stack platform for service-based businesses**

Built with Next.js 15, Fastify, Prisma, PostgreSQL, and Redis.

---

## 🎯 Features

- **Multi-tenant Architecture** with organization scoping and RBAC
- **CRM & Lead Management** with Kanban pipeline
- **AI Bid Calculator** with intelligent pricing logic
- **Quote → Job → Invoice** workflow with Stripe integration
- **Vendor Portal** with clock in/out and QC tracking
- **Calendar & Dispatch** system
- **Marketing Automation** (Email/SMS campaigns)
- **Analytics Dashboard** with real-time KPIs
- **PWA Support** for mobile installation
- **Comprehensive Security** (JWT, rate limiting, Helmet, input validation)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd seamless-solutions

# Install dependencies
pnpm install

# Start infrastructure (Postgres + Redis)
docker-compose -f infra/docker-compose.yml up -d

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Edit apps/api/.env with your configuration
# At minimum, set DATABASE_URL and JWT_SECRET

# Generate Prisma client and run migrations
cd apps/api
pnpm prisma:generate
pnpm prisma:migrate

# Seed demo data
pnpm prisma:seed

# Return to root
cd ../..

# Start development servers
pnpm dev
```

The API will run on `http://localhost:4000` and the web app on `http://localhost:3000`.

### Demo Credentials

```
Email: owner@demo.com
Password: password123
```

---

## 📁 Project Structure

```
seamless-solutions/
├── apps/
│   ├── api/                 # Fastify API
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── config/      # Environment config
│   │       ├── lib/         # Prisma, Redis, Logger
│   │       ├── middleware/  # Auth, RBAC, org scoping
│   │       ├── routes/      # API endpoints
│   │       ├── services/    # Business logic
│   │       └── utils/       # Utilities
│   │
│   └── web/                 # Next.js frontend
│       ├── app/             # App router pages
│       ├── components/      # React components
│       └── lib/             # API client, store, utils
│
├── infra/
│   └── docker-compose.yml   # Postgres + Redis
│
├── .github/
│   └── workflows/
│       └── ci.yml           # CI/CD pipeline
│
├── scripts/
│   └── oneclick-github.sh   # Push to GitHub
│
├── openapi.yaml             # API specification
└── README.md
```

---

## 🛠 Development

### API Commands

```bash
cd apps/api

pnpm dev              # Start dev server with hot reload
pnpm build            # Build for production
pnpm start            # Start production server
pnpm prisma:studio    # Open Prisma Studio
pnpm prisma:migrate   # Run migrations
pnpm prisma:seed      # Seed database
pnpm typecheck        # Type checking
pnpm lint             # Lint code
```

### Web Commands

```bash
cd apps/web

pnpm dev              # Start Next.js dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm typecheck        # Type checking
pnpm lint             # Lint code
```

### Workspace Commands

```bash
pnpm dev              # Start all services
pnpm build            # Build all apps
pnpm push:github      # Push to GitHub (one-click script)
```

---

## 🗄 Database Schema

### Core Models

- **Organization** - Multi-tenant orgs with settings
- **User** - Users with role-based access (OWNER, STAFF, VENDOR, CLIENT)
- **Contact** - Unified contact management
- **Lead** - Sales pipeline with Kanban statuses
- **Bid** - AI-powered bid calculator results
- **Quote** - Customer quotes with line items
- **Job** - Job scheduling and tracking
- **Invoice** - Invoicing with Stripe integration
- **Vendor** - Vendor profiles with reliability scoring
- **Appointment** - Calendar and scheduling
- **Campaign** - Marketing automation
- **ActivityLog** - Comprehensive audit trail

See `apps/api/prisma/schema.prisma` for complete schema.

---

## 🔐 Security Features

- **JWT Authentication** with secure token handling
- **RBAC** (Role-Based Access Control)
- **Organization Scoping** - All queries scoped to user's org
- **Rate Limiting** - Protection against abuse
- **Helmet.js** - Security headers
- **Input Validation** - Zod schemas on all endpoints
- **Activity Logging** - Audit trail with trace IDs
- **CORS** - Configurable cross-origin policies
- **Secrets Management** - Environment-based configuration

---

## 🔌 API Documentation

OpenAPI 3.0 specification available at `/openapi.yaml`.

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new organization
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

#### Leads & CRM
- `GET /api/leads` - Get all leads (Kanban view)
- `POST /api/leads/public` - Public lead submission
- `PATCH /api/leads/:id` - Update lead
- `POST /api/leads/:id/convert` - Convert lead to client

#### Bids & Quotes
- `POST /api/bids` - Calculate AI bid
- `GET /api/quotes` - Get quotes
- `POST /api/quotes/:id/send` - Send quote to customer
- `POST /api/quotes/:id/accept` - Accept quote (creates job)

#### Jobs
- `GET /api/jobs` - Get jobs (filterable by status)
- `PATCH /api/jobs/:id` - Update job
- `POST /api/jobs/:id/clock-in` - Vendor clock in
- `POST /api/jobs/:id/clock-out` - Vendor clock out

#### Invoices
- `GET /api/invoices` - Get invoices
- `POST /api/invoices/:id/send` - Send invoice
- `POST /api/invoices/:id/mark-paid` - Mark as paid
- `POST /api/invoices/webhook/stripe` - Stripe webhook

#### Analytics
- `GET /api/analytics/dashboard` - Dashboard KPIs
- `GET /api/analytics/revenue` - Revenue over time
- `GET /api/analytics/vendors` - Vendor performance

All authenticated endpoints require `Authorization: Bearer <token>` header.

---

## 🎨 UI/UX

### Design System

- **Primary Color**: Teal `#00A8A8`
- **Secondary Color**: Gray `#6B7280`
- **Dark**: `#0B0E0F`
- **Typography**: Inter font family
- **Components**: Built with Radix UI + Tailwind CSS
- **Success Chimes**: Royal audio feedback on key actions

### PWA Features

- Installable on mobile devices
- Offline-capable basic operations
- App manifest at `/manifest.json`

---

## 🚢 Deployment

### Environment Variables

**API (.env)**
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-secret
STRIPE_SECRET_KEY=sk_...
SUPABASE_URL=https://...
```

**Web (.env)**
```env
NEXT_PUBLIC_API_URL=https://api.yourapp.com/api
```

### Production Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Configure production `DATABASE_URL`
- [ ] Set up Stripe webhooks
- [ ] Configure CORS origins
- [ ] Enable HTTPS
- [ ] Set up monitoring/logging
- [ ] Configure backups
- [ ] Run Prisma migrations
- [ ] Seed production data (if needed)

### Docker Deployment

```bash
# Build images
docker build -t seamless-api -f apps/api/Dockerfile .
docker build -t seamless-web -f apps/web/Dockerfile .

# Run with docker-compose
docker-compose -f infra/docker-compose.yml up -d
```

---

## 🧪 Testing

```bash
# Run type checking
pnpm typecheck

# Run linter
pnpm lint

# Validate Prisma schema
cd apps/api && npx prisma validate
```

---

## 📊 CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`) runs on push/PR:

1. Install dependencies
2. Validate Prisma schema
3. Type checking (API + Web)
4. Linting
5. Build both apps

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Proprietary - All Rights Reserved

---

## 🆘 Support

For issues or questions:
- Open a GitHub issue
- Contact: support@seamlesssolutions.com

---

## ✅ Roadmap

- [x] Core CRM & Lead Management
- [x] AI Bid Calculator
- [x] Quote → Job → Invoice Flow
- [x] Vendor Portal
- [x] Analytics Dashboard
- [x] Marketing Campaigns
- [ ] LLM Integration for Bids
- [ ] Advanced Reporting
- [ ] Mobile Apps (React Native)
- [ ] Third-party Integrations (QuickBooks, etc.)

---

**Built with ❤️ for service businesses everywhere.**
