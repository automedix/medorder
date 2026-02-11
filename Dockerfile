FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy prisma schema
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built app
COPY .next ./.next
COPY next.config.* ./
# Copy public folder if it exists (optional)
RUN if [ -d "public" ]; then cp -r public ./public; fi

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "start"]
