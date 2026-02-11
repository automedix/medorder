# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies (including devDependencies)
COPY package*.json ./
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY . .

# Create data directory and database for build
RUN mkdir -p /app/data
ENV DATABASE_URL="file:/app/data/build.db"
RUN npx prisma migrate deploy || true
RUN npx prisma db push || true

# Build the Next.js app
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built app from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.* ./
# Copy public folder if it exists
RUN if [ -d "/app/public" ]; then cp -r /app/public ./public; fi

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["npm", "start"]
