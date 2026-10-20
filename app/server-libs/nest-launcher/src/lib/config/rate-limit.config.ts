import type { Options } from 'express-rate-limit'

export const RATE_LIMIT_CONFIG = (WINDOW_MS: number, REQUEST_LIMIT: number): Partial<Options> => {
  return {
    windowMs: WINDOW_MS * 60 * 1000,
    limit: REQUEST_LIMIT,
    message: 'Too many requests from this ip',
  }
}
