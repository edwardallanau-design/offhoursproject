# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci

COPY server/tsconfig.json ./server/
COPY server/src/ ./server/src/

WORKDIR /app/server
RUN npm run build

# ── Stage 2: runner ───────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci --omit=dev

COPY --from=builder /app/server/dist ./server/dist

WORKDIR /app/server

EXPOSE 3001

CMD ["node", "--require", "dotenv/config", "dist/index.js"]
