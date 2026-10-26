FROM node:26.12-alpine

WORKDIR /app

RUN npm install --no-package-lock prisma@7.10.0 dotenv

COPY app/server-libs/database/prisma ./database/prisma
COPY app/server-libs/database/prisma7.config.ts ./database/prisma7.config.ts

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

CMD ["npx", "prisma", "migrate", "deploy", "--config", "database/prisma7.config.ts"]
