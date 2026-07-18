# ============================
# Stage 1 - Install Dependencies
# ============================
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./

# Install dependencies
RUN npm ci

# ============================
# Stage 2 - Build Application
# ============================
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# If using Prisma, uncomment the next line
# RUN npx prisma generate

RUN npm run build

# ============================
# Stage 3 - Production
# ============================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

EXPOSE 3000

CMD ["npm", "start"]

# add comment