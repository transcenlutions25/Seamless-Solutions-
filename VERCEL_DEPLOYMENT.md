# Vercel Deployment Guide

This monorepo is configured for deployment on Vercel.

## What's Been Configured

### 1. **Web App (Next.js)**
- Located in `apps/web/`
- Added proper build, start, and lint scripts
- Created `next.config.js` with standalone output for optimized builds
- Added TypeScript configuration (`tsconfig.json`)
- Created root `layout.tsx` required for Next.js App Router

### 2. **Vercel Configuration**
- **`vercel.json`**: Configures the build and dev commands for the monorepo
- **`.vercelignore`**: Excludes unnecessary files from deployment (API, infra, scripts)

### 3. **Build Verification**
- Build tested locally and passes successfully
- Static pages are being generated correctly

## Deployment Instructions

### Option 1: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect the configuration from `vercel.json`
5. Click "Deploy"

### Option 2: Deploy via Vercel CLI
```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from the root directory)
vercel

# Deploy to production
vercel --prod
```

## Project Structure

```
/workspace
├── apps/
│   ├── web/          # Next.js frontend (deployed to Vercel)
│   └── api/          # Fastify backend (not deployed to Vercel)
├── vercel.json       # Vercel configuration
├── .vercelignore     # Files to ignore during deployment
└── pnpm-workspace.yaml
```

## Notes

- **API Backend**: The Fastify API (`apps/api/`) is not deployed to Vercel. If you need to deploy it, consider:
  - Converting it to Vercel Serverless Functions
  - Deploying it separately (e.g., Railway, Render, or another Node.js hosting service)
  
- **Environment Variables**: If your app uses environment variables, add them in the Vercel project settings.

- **Build Command**: The build command is configured to run from the web app directory: `cd apps/web && pnpm build`

- **Output Directory**: Set to `apps/web/.next`

## Testing Locally

```bash
# Install dependencies
pnpm install

# Build the web app
cd apps/web && pnpm build

# Start production server
pnpm start
```

Your app should be ready for Vercel deployment! 🚀
