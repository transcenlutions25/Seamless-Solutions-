# Seamless Solutions

A modern Next.js application built with TypeScript, deployed on Vercel.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
pnpm install

# Run the web app in development mode
pnpm --filter @seamless/web dev

# Build the web app
pnpm turbo run build --filter=@seamless/web
```

### Deploy to Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy:**
1. Push to GitHub
2. Import to Vercel
3. Deploy automatically

## 📁 Project Structure

- `apps/web` - Next.js 15 frontend application
- `apps/api` - Fastify API backend
- `turbo.json` - Turborepo build configuration
- `vercel.json` - Vercel deployment configuration

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Package Manager:** pnpm
- **Monorepo Tool:** Turborepo
- **Deployment:** Vercel

## ✅ Ready for Production

This project is configured and ready to deploy to Vercel with:
- ✅ Optimized build configuration
- ✅ TypeScript support
- ✅ ESLint setup
- ✅ Monorepo support with Turbo
- ✅ Production-ready Next.js settings
