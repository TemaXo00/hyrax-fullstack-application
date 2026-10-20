import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface.js'

export const CORS_CONFIG = (origins: string[]): CorsOptions => {
  return {
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'QUERY', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Authorization', 'Set-Cookie', 'Access-Control-Allow-Credentials'],
    maxAge: 86400,
  }
}
