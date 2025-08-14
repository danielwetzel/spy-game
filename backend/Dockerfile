FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# Install dependencies (including dev) using lockfile
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build TypeScript
RUN pnpm build

# Copy JSON word lists into dist for runtime (paths must mirror compiled imports)
RUN mkdir -p dist/words && cp -r src/words/*.json dist/words/

FROM node:20-alpine AS runner
WORKDIR /app

# Enable corepack and pnpm
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# Install only production deps
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --prod --frozen-lockfile

# Copy built app
COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD ["node", "dist/index.js"]