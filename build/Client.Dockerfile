FROM node:26.12-alpine AS builder

WORKDIR /app

COPY app/package.json ./
COPY app/package-lock.json ./
COPY app/services/client ./services/client
COPY app/client-libs ./client-libs
COPY app/nx.json ./
COPY app/tsconfig*.json ./

RUN npm ci
RUN npx nx sync
RUN npx nx build client

FROM nginx:alpine AS worker

COPY --from=builder /app/services/client/dist /usr/share/nginx/html

RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    resolver 127.0.0.11 valid=30s; \
    set $api_upstream server-test:3000; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://$api_upstream; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
