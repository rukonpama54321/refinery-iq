# Multi-stage build for the Next.js web app (standalone output).
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat curl

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci || npm install

FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
