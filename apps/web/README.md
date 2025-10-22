# Seamless Solutions Web App

A Next.js 15 application ready for deployment on Vercel.

## Features

- ⚡ Next.js 15 with App Router
- 🎨 Modern CSS styling
- 📱 Responsive design
- 🚀 Optimized for Vercel deployment
- 📦 TypeScript support

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm run start
```

## Deployment

This app is configured for seamless deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect the Next.js framework
3. The `vercel.json` configuration will handle the monorepo setup
4. Deploy!

## Project Structure

```
apps/web/
├── app/
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── next.config.mjs      # Next.js configuration
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── .eslintrc.json       # ESLint configuration
```