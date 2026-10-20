import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Request, Response } from 'express'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter')

  catch(exception: unknown, host: ArgumentsHost): void {
    const startedAt = Date.now()
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const { method, url } = request

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const message = this.resolveMessage(exception)

    this.logger.error(`${method} ${url} ${status} - ${message}`)

    response.status(status).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      path: url,
      method,
      message,
      duration: `${Date.now() - startedAt}ms`,
    })
  }

  private resolveMessage(exception: unknown): string {
    if (!(exception instanceof HttpException)) {
      return exception instanceof Error ? exception.message : 'Internal server error'
    }

    const exceptionResponse = exception.getResponse()

    if (typeof exceptionResponse !== 'object' || exceptionResponse === null) {
      return exception.message
    }

    const { message } = exceptionResponse as { message?: string | string[] }

    return Array.isArray(message) ? message.join(', ') : message || exception.message
  }
}
