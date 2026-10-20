import { ValidationPipeOptions } from '@nestjs/common'

export const VALIDATION_CONFIG: ValidationPipeOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
} as const
