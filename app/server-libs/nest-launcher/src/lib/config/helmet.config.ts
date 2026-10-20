import { HelmetOptions } from 'helmet'

export const HELMET_CONFIG: HelmetOptions = {
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
      scriptSrc: ["'self'", "https: 'unsafe-inline'"],
    },
  },
}
