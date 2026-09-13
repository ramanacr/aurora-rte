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

# Production runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install pnpm in runner to run production dependencies
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate

# Copy root manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY services ./services
COPY apps ./apps
COPY scripts ./scripts
COPY server.mjs ./

# Copy compiled outputs from builder
COPY --from=builder /app/packages /app/packages
COPY --from=builder /app/services /app/services
COPY --from=builder /app/apps/playground/dist /app/apps/playground/dist

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1

CMD ["node", "server.mjs"]
