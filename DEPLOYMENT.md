# Vercel Deployment Guide

## Quick Deploy

### Method 1: Auto-Deploy from Git (Recommended)

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Fix Vercel deployment configuration"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the configuration from `vercel.json`
   - Click "Deploy"

### Method 2: Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy from the project root
cd /workspace
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - What's your project's name? seamless-solutions (or your choice)
# - In which directory is your code located? ./
# - Vercel will detect Next.js automatically
```

## Configuration Details

The project is now configured with:

- ✅ **Next.js 15** with App Router
- ✅ **TypeScript** with proper configuration
- ✅ **Turbo** for monorepo builds
- ✅ **pnpm** as package manager
- ✅ **Proper build outputs** configured
- ✅ **ESLint** for code quality

## Project Structure

```
/workspace
├── apps/
│   ├── web/          # Next.js frontend (deploys to Vercel)
│   └── api/          # Fastify backend (not deployed with web)
├── vercel.json       # Vercel configuration
└── turbo.json        # Turborepo configuration
```

## Build Commands

The following commands work in this project:

```bash
# Install dependencies
pnpm install

# Build the web app
pnpm turbo run build --filter=@seamless/web

# Run locally
pnpm --filter @seamless/web dev
```

## Troubleshooting

### Build fails on Vercel
- Check the build logs in Vercel dashboard
- Ensure all dependencies are listed in `apps/web/package.json`
- Verify Node.js version is 18.x or higher

### Monorepo issues
- The `vercel.json` is configured for monorepo deployment
- Root directory is automatically detected
- Build command uses Turbo for optimization

### Environment Variables
If you need environment variables:
1. Go to Vercel dashboard → Your Project → Settings → Environment Variables
2. Add your variables
3. Redeploy the project

## Success Indicators

Your deployment is successful when:
1. Build completes without errors
2. You receive a deployment URL (e.g., `your-app.vercel.app`)
3. Visiting the URL shows "Seamless Solutions" page

## Next Steps

After successful deployment:
1. Set up a custom domain in Vercel dashboard
2. Configure CI/CD for automatic deployments
3. Add environment-specific configurations
4. Set up preview deployments for branches
