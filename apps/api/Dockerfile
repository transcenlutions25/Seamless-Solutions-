FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.18.1 --activate

FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/api/node_modules ./apps/api/node_modules
COPY apps/api ./apps/api
COPY package.json pnpm-workspace.yaml ./

FROM base AS runtime
WORKDIR /app
RUN apk add --no-cache tini
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api ./apps/api
COPY package.json pnpm-workspace.yaml ./

ENV NODE_ENV=production
EXPOSE 4000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["pnpm", "--filter", "@seamless/api", "dev"]
