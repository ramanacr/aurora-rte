# Multi-stage Dockerfile for Aurora RTE Platform
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate

# Copy workspace and lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json tsconfig.json ./

# Copy all packages, services, and apps manifests
COPY packages ./packages
COPY services ./services
COPY apps ./apps
COPY scripts ./scripts

# Install dependencies
RUN pnpm install --frozen-lockfile

# Compile TypeScript packages and build Playground with Vite
RUN pnpm build
RUN npx vite build apps/playground

# Prune dev dependencies so node_modules contains only production dependencies
RUN pnpm prune --prod

# Production runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy root manifests and static server
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY services ./services
COPY scripts ./scripts
COPY server.mjs ./

# Copy documentation source (served via /api/docs/* at runtime)
COPY apps/docs ./apps/docs

# Copy compiled outputs and production dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services ./services
COPY --from=builder /app/apps/playground/dist ./apps/playground/dist

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1

CMD ["node", "server.mjs"]
