# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

RUN \
  if [ -f package-lock.json ]; then \
    npm ci --no-audit --ignore-scripts; \
  elif [ -f yarn.lock ]; then \
    yarn install --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable && pnpm install --frozen-lockfile; \
  else \
    echo "No lockfile found." && exit 1; \
  fi

# Copy source and build
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

RUN \
  if [ -f package-lock.json ]; then \
    npm ci --no-audit --ignore-scripts --omit=dev; \
  elif [ -f yarn.lock ]; then \
    yarn install --production --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable && pnpm install --prod --frozen-lockfile; \
  else \
    echo "No lockfile found." && exit 1; \
  fi

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Install Prisma CLI for migrations
RUN npm install -g prisma

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/docs || exit 1

# Run migrations and start application
CMD sh -c "npx prisma migrate deploy && node dist/main"
