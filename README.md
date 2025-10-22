# Seamless Solutions

A complete, production-ready platform for service-based businesses to manage leads, calculate bids, schedule jobs, send invoices, and track performance.

## 🚀 Features

### Core Business Management
- **CRM & Lead Management** - Capture leads from your website, track through pipeline, convert to customers
- **AI-Powered Bid Calculator** - Generate accurate quotes with intelligent pricing based on complexity, urgency, and market conditions
- **Quote & Job Management** - Professional quotes, job scheduling, and completion tracking
- **Invoicing & Payments** - Stripe integration for seamless payment processing
- **Vendor Portal** - Time tracking, QC photo uploads, performance scoring

### Automation & Analytics
- **Marketing Automation** - Email/SMS campaigns with filters and scheduling
- **Calendar & Dispatch** - Smart scheduling with conflict detection and availability checking
- **Analytics Dashboard** - Revenue tracking, conversion rates, performance metrics
- **File Management** - Secure file uploads with Supabase integration

### Technical Features
- **Multi-tenant Architecture** - Organization-scoped data with role-based access
- **Real-time Updates** - WebSocket support for live notifications
- **PWA Support** - Installable on mobile devices with offline capabilities
- **Security First** - JWT authentication, rate limiting, input validation, audit logs

## 🛠 Tech Stack

### Backend (API)
- **Framework**: Fastify with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for sessions and rate limiting
- **Authentication**: JWT with role-based access control
- **Payments**: Stripe integration with webhooks
- **Email/SMS**: Nodemailer + Twilio
- **File Storage**: Supabase Storage
- **Documentation**: OpenAPI/Swagger

### Frontend (Web)
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for analytics
- **PWA**: Service worker with offline support

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Database**: PostgreSQL 15 with connection pooling
- **Cache**: Redis 7 for sessions and background jobs
- **CI/CD**: GitHub Actions with automated testing
- **Monitoring**: Health checks and structured logging

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd seamless-solutions
npm install
```

### 2. Environment Setup
```bash
# Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Edit the .env files with your configuration
```

### 3. Start Development Environment
```bash
# Start database and Redis
docker-compose -f infra/docker-compose.yml up -d postgres redis

# Run database migrations
cd apps/api
npm run db:push
npm run db:seed

# Start development servers
cd ../..
npm run dev
```

The application will be available at:
- **Web App**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/docs

### 4. Demo Login
- **Owner**: owner@democleaning.com
- **Staff**: staff@democleaning.com

## 📁 Project Structure

```
seamless-solutions/
├── apps/
│   ├── api/                 # Fastify API server
│   │   ├── src/
│   │   │   ├── routes/      # API route handlers
│   │   │   ├── middleware/  # Auth, validation, etc.
│   │   │   ├── services/    # Business logic
│   │   │   └── utils/       # Helper functions
│   │   ├── prisma/          # Database schema & migrations
│   │   └── package.json
│   └── web/                 # Next.js frontend
│       ├── src/
│       │   ├── app/         # App Router pages
│       │   ├── components/  # React components
│       │   ├── lib/         # Utilities & API client
│       │   └── hooks/       # Custom React hooks
│       └── package.json
├── infra/
│   ├── docker-compose.yml   # Development infrastructure
│   └── Dockerfiles          # Production containers
├── scripts/
│   ├── oneclick-github.sh   # Deploy to GitHub
│   └── oneclick-github.ps1  # Windows version
└── package.json             # Workspace configuration
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start all development servers
npm run build           # Build all applications
npm run start           # Start production servers

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema changes
npm run db:migrate      # Run migrations
npm run db:seed         # Seed with demo data

# Quality
npm run lint            # Lint all code
npm run test            # Run tests
npm run type-check      # TypeScript validation

# Deployment
npm run push:github     # Push to GitHub repository
```

### API Routes

#### Authentication
- `POST /api/auth/register` - Create new organization & owner
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/invite` - Invite team members

#### Lead Management
- `GET /api/leads` - List leads with filtering
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `POST /api/leads/:id/convert` - Convert lead to client
- `POST /api/leads/public` - Public lead form (no auth)

#### Bid Calculator
- `POST /api/bids/calculate` - Calculate bid price
- `POST /api/bids` - Save bid
- `GET /api/bids` - List saved bids

#### Quotes & Jobs
- `POST /api/quotes` - Create quote from bid
- `POST /api/quotes/:id/send` - Email quote to client
- `POST /api/jobs` - Create job from accepted quote
- `POST /api/jobs/clock-in` - Vendor clock in
- `POST /api/jobs/clock-out` - Vendor clock out

#### Invoicing
- `POST /api/invoices` - Create invoice from completed job
- `POST /api/invoices/payment-intent` - Create Stripe payment
- `POST /api/webhooks/stripe` - Handle payment webhooks

#### Analytics
- `GET /api/analytics/dashboard` - Key metrics overview
- `GET /api/analytics/pipeline` - Lead conversion funnel
- `GET /api/analytics/revenue` - Revenue analytics

## 🔐 Environment Variables

### API (.env)
```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/seamless_solutions"
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email & SMS
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="your-token"

# File Storage (Optional)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_KEY="your-service-key"
```

### Web (.env.local)
```bash
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## 🚀 Deployment

### Using Docker Compose (Recommended)
```bash
# Build and start all services
docker-compose -f infra/docker-compose.yml up -d

# Run migrations
docker-compose exec api npx prisma migrate deploy
```

### Manual Deployment

1. **Database Setup**
   ```bash
   # Set up PostgreSQL and Redis
   # Run migrations
   npx prisma migrate deploy
   ```

2. **Build Applications**
   ```bash
   cd apps/api && npm run build
   cd ../web && npm run build
   ```

3. **Start Services**
   ```bash
   # Start API server
   cd apps/api && npm start

   # Start web server
   cd apps/web && npm start
   ```

### GitHub Deployment
Use the included one-click script:
```bash
# Linux/Mac
./scripts/oneclick-github.sh

# Windows
.\scripts\oneclick-github.ps1
```

## 📊 Key Metrics & KPIs

The platform tracks essential business metrics:

- **Lead Conversion Rate** - NEW → QUALIFIED → QUOTED → WON
- **Revenue Metrics** - Monthly recurring revenue, average job value
- **Operational Efficiency** - Job completion rate, vendor performance
- **Customer Satisfaction** - Response times, service quality scores
- **Financial Health** - Outstanding invoices, payment collection rates

## 🔒 Security Features

- **Authentication**: JWT-based with role-based access control
- **Authorization**: Organization-scoped data access
- **Input Validation**: Zod schemas for all API inputs
- **Rate Limiting**: Redis-backed request throttling
- **Audit Logging**: Complete activity trail
- **Data Protection**: Encrypted sensitive data, secure file uploads
- **CORS & Helmet**: Security headers and cross-origin protection

## 🧪 Testing

```bash
# Run all tests
npm test

# Run API tests
cd apps/api && npm test

# Run with coverage
npm run test:coverage
```

## 📈 Performance

- **Database**: Optimized queries with proper indexing
- **Caching**: Redis for sessions and frequently accessed data
- **Frontend**: Code splitting, lazy loading, image optimization
- **API**: Request/response compression, connection pooling
- **Monitoring**: Health checks, structured logging, error tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` endpoint when running the API
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

## 🗺 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced reporting & dashboards
- [ ] Integration marketplace (QuickBooks, etc.)
- [ ] Multi-language support
- [ ] Advanced workflow automation
- [ ] AI-powered insights and recommendations

---

**Built with ❤️ for service businesses everywhere**