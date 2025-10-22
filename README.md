# Seamless Solutions

Modern web application built with Next.js 15 and deployed on Vercel.

## Project Structure

This is a monorepo containing:
- `apps/web` - Next.js 15 web application
- `apps/api` - Fastify API server (optional)

## Deployment to Vercel

### Quick Deploy

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your GitHub repository
4. Vercel will automatically detect the Next.js app
5. Deploy!

### Manual Configuration

If you need to configure manually, use these settings:
- **Framework Preset**: Next.js
- **Root Directory**: `./` (keep as root)
- **Build Command**: `cd apps/web && npm install && npm run build`
- **Output Directory**: `apps/web/.next`
- **Install Command**: `npm install --prefix apps/web`

### Environment Variables

Set any required environment variables in Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add your variables

## Local Development

### Web App Only
```bash
cd apps/web
npm install
npm run dev
```

### Full Monorepo (with pnpm)
```bash
pnpm install
pnpm dev:web
```

## Tech Stack

- **Framework**: Next.js 15
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Deployment**: Vercel

## Build Status

The app is configured for automatic deployments on Vercel. Each push to the main branch triggers a new deployment.