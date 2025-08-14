FROM node:20-alpine AS builder

WORKDIR /app

# Enable corepack and pnpm
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# Install dependencies
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

# Copy sources
COPY . .

# Build (defaults use relative URLs in the app)
RUN pnpm build

FROM nginx:1.27-alpine AS runner

WORKDIR /usr/share/nginx/html

# Copy built assets
COPY --from=builder /app/dist .

# Nginx config with SPA fallback and backend proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


