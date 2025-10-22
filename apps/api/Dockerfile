FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --filter @seamless/api

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY apps/api ./apps/api
RUN cd apps/api && pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=deps /app/apps/api/node_modules ./node_modules

EXPOSE 4000
CMD ["node", "dist/index.js"]