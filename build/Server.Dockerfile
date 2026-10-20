FROM node:26.12-alpine AS builder

WORKDIR /app

COPY app/package.json ./
COPY app/package-lock.json ./
COPY app/nx.json ./
COPY app/tsconfig*.json ./

COPY app/services/server ./services/server
COPY app/server-libs ./server-libs
COPY app/core-libs ./core-libs

RUN npm ci
RUN npm run nx:sync
RUN npm run db:generate
RUN npx nx build server

FROM node:26.12-alpine AS deps

WORKDIR /app

COPY app/package.json ./
COPY app/package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

FROM node:26.12-alpine AS worker

WORKDIR /app

COPY --from=builder /app/services/server/dist ./dist
COPY --from=builder /app/server-libs ./node_modules/@org
COPY --from=builder /app/core-libs ./node_modules/@org

COPY --from=deps /app/node_modules ./node_modules

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 3000

CMD ["node", "dist/main.js"]
