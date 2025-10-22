# Vercel Deployment Guide

This app has been configured for Vercel deployment with the following changes:

## Changes Made

1. **Next.js Configuration**: Added proper build scripts and Next.js config for monorepo
2. **API Migration**: Converted Fastify API to Next.js API routes using App Router
3. **Vercel Configuration**: Created `vercel.json` with proper build commands
4. **Package Scripts**: Updated scripts for Vercel deployment
5. **TypeScript Setup**: Added proper TypeScript configuration
6. **Build Optimization**: Added `.vercelignore` to exclude unnecessary files

## Deployment Steps

1. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect this as a Next.js project

2. **Configuration**:
   - Root Directory: Leave as `/` (monorepo root)
   - Build Command: `cd apps/web && pnpm build` (automatically configured)
   - Output Directory: `apps/web/.next` (automatically configured)
   - Install Command: `pnpm install` (automatically configured)

3. **Environment Variables** (if needed):
   - Add any environment variables in the Vercel dashboard

## API Endpoints

- Health check: `/api/health` - Returns `{ ok: true, timestamp: "...", message: "API is healthy" }`

## Project Structure

```
/workspace/
├── apps/
│   └── web/                 # Next.js app (deployed to Vercel)
│       ├── app/
│       │   ├── api/health/  # API routes
│       │   ├── layout.tsx   # Root layout
│       │   └── page.tsx     # Home page
│       ├── next.config.js   # Next.js configuration
│       ├── package.json     # Web app dependencies
│       └── tsconfig.json    # TypeScript config
├── vercel.json              # Vercel deployment config
├── .vercelignore           # Files to ignore during deployment
└── package.json            # Root package.json with workspace scripts
```

## Local Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

The app is now ready for Vercel deployment while maintaining its structural integrity!