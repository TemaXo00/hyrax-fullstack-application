import { Logger } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'

export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const logger = new Logger('HTTP')
  const { method, originalUrl } = req

  res.on('finish', () => {
    const { statusCode } = res

    if (statusCode >= 400) {
      return
    }

    logger.log(`${method} ${originalUrl} ${statusCode}`)
  })

  next()
}
