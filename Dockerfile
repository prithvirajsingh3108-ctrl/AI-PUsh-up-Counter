# Base runtime layer
FROM node:20-alpine AS builder

WORKDIR /app

# Copy lock files and assets
COPY package.json ./
RUN npm install

# Copy source code codebases
COPY . .

# Build production assets inside dist/
RUN npm run build

# Standalone hosting layer
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Install small static file hosting command for SPA
RUN npm install -g serve

EXPOSE 3000

# Start on expected ingress port 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
