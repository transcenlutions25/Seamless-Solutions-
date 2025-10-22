# Seamless Solutions

A production-ready, multi-tenant, full-stack platform for service-based businesses to manage leads, customers, vendors, calculate AI-assisted bids, schedule jobs, send invoices, and launch marketing campaigns.

## 🚀 Features

- **CRM & Lead Management**: Public lead forms, Kanban pipeline, contact management
- **AI Bid Calculator**: Intelligent pricing with scope toggles, rush multipliers, and risk factors
- **Quote & Job Management**: Quote builder, PDF generation, job scheduling and tracking
- **Invoice & Payment**: Stripe integration, automated payment processing
- **Vendor Portal**: Clock in/out, QC photos, reliability scoring
- **Calendar & Dispatch**: Appointment scheduling, SMS/Email reminders
- **Marketing Automation**: Email/SMS campaigns, analytics, triggers
- **Analytics Dashboard**: KPIs, conversion rates, revenue tracking
- **PWA Support**: Mobile-friendly, offline capabilities

## 🏗️ Architecture

### Backend (API)
- **Framework**: Fastify + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT with role-based access control
- **Payments**: Stripe integration
- **Communication**: Twilio (SMS), Resend (Email)
- **File Storage**: Supabase Storage
- **Documentation**: OpenAPI/Swagger

### Frontend (Web)
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand + React Query
- **Authentication**: NextAuth.js
- **Charts**: Recharts
- **PDF Generation**: jsPDF

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **CI/CD**: GitHub Actions (planned)

## 🛠️ Tech Stack

### Backend
- Node.js 18
- Fastify 4.28
- Prisma 5.7
- PostgreSQL 15
- Redis 7
- JWT Authentication
- Stripe API
- Twilio API
- Zod Validation

### Frontend
- Next.js 15
- React 18
- TypeScript 5
- Tailwind CSS 3
- shadcn/ui
- React Query
- NextAuth.js
- Zustand

## 📦 Project Structure

```
seamless-solutions/
├── apps/
│   ├── api/                 # Fastify API backend
│   │   ├── src/
│   │   │   ├── routes/      # API route handlers
│   │   │   ├── services/    # Business logic
│   │   │   ├── middleware/  # Auth, validation, etc.
│   │   │   ├── types/       # TypeScript types
│   │   │   └── utils/       # Utilities
│   │   ├── prisma/          # Database schema & migrations
│   │   └── Dockerfile
│   └── web/                 # Next.js frontend
│       ├── app/             # App Router pages
│       ├── components/      # React components
│       ├── lib/             # Utilities & API client
│       ├── types/           # TypeScript types
│       └── Dockerfile
├── infra/
│   └── docker-compose.yml   # Development environment
└── scripts/
    └── oneclick-github.sh   # Deployment script
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm
- Docker & Docker Compose
- PostgreSQL (if running locally)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd seamless-solutions
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment files
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   
   # Edit the files with your configuration
   ```

4. **Start the development environment**
   ```bash
   # Using Docker Compose (recommended)
   cd infra
   docker-compose up -d postgres redis
   
   # Or start everything
   docker-compose up
   ```

5. **Set up the database**
   ```bash
   cd apps/api
   pnpm prisma db push
   pnpm prisma db seed
   ```

6. **Start the development servers**
   ```bash
   # Terminal 1 - API
   cd apps/api
   pnpm dev
   
   # Terminal 2 - Web
   cd apps/web
   pnpm dev
   ```

7. **Access the application**
   - Web App: http://localhost:3000
   - API: http://localhost:3001
   - API Docs: http://localhost:3001/docs

### Production Deployment

1. **Build and deploy with Docker**
   ```bash
   cd infra
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

2. **Or use the one-click GitHub deployment**
   ```bash
   ./scripts/oneclick-github.sh
   ```

## 🔧 Configuration

### Environment Variables

#### API (.env)
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/seamless_solutions?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Twilio
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1234567890"

# Email (Resend)
RESEND_API_KEY="re_..."

# File Storage (Supabase)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# App
NODE_ENV="development"
PORT=3001
API_URL="http://localhost:3001"
WEB_URL="http://localhost:3000"
```

#### Web (.env.local)
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## 📊 Database Schema

The application uses a comprehensive PostgreSQL schema with the following main entities:

- **Users**: Authentication and user management
- **Organizations**: Multi-tenant organization structure
- **Contacts**: Lead, client, vendor, and internal contacts
- **Properties**: Properties and sites for jobs
- **Leads**: Sales pipeline management
- **Bids**: AI-calculated pricing
- **Quotes**: Quote generation and management
- **Jobs**: Job scheduling and tracking
- **Invoices**: Billing and payment processing
- **Appointments**: Calendar and scheduling
- **Campaigns**: Marketing automation
- **Vendors**: Vendor management and scoring
- **ActivityLogs**: Audit trail and activity tracking

## 🔐 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Organization-scoped data access
- Input validation with Zod
- Rate limiting
- CORS protection
- Helmet security headers
- SQL injection prevention (Prisma)
- XSS protection
- Audit logging

## 📈 Performance Features

- Redis caching
- Database query optimization
- Connection pooling
- Image optimization
- Code splitting
- Lazy loading
- PWA caching
- CDN ready

## 🧪 Testing

```bash
# Run API tests
cd apps/api
pnpm test

# Run web tests
cd apps/web
pnpm test

# Run all tests
pnpm test
```

## 📝 API Documentation

The API includes comprehensive OpenAPI documentation available at:
- Development: http://localhost:3001/docs
- Production: https://your-domain.com/docs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] AI-powered lead scoring
- [ ] Advanced reporting
- [ ] Multi-language support
- [ ] Advanced workflow automation
- [ ] Third-party integrations
- [ ] White-label solutions

---

**Built with ❤️ for service-based businesses**
