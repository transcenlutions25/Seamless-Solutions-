# Seamless Solutions

Monorepo for API (Fastify + Prisma) and Web (Next.js 15). Includes Docker infra and CI.

## Quickstart

1. Copy envs:
   - `cp .env.example .env`
   - `cp apps/api/.env.example apps/api/.env`
2. Start infra: `pnpm db:up`
3. Install deps: `pnpm install`
4. Generate Prisma: `pnpm prisma:generate`
5. Run dev:
   - `pnpm dev` (starts API 4000, Web 3000)
6. Seed data: `pnpm seed`

## API
- Health: `GET /health`
- Dev login: `POST /auth/dev-login` → `{ token }`
- Use `Authorization: Bearer <token>` for protected routes.

## OpenAPI
See `apps/api/openapi.yaml`.

## CI
GitHub Actions validates Prisma and builds.
