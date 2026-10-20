import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import type { ResponseType } from '../types/shared.types.js'

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ResponseType<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseType<T>> {
    const request = context.switchToHttp().getRequest()
    const startedAt = Date.now()

    return next.handle().pipe(
      map((data) => ({
        status: 'success',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        path: request.url,
        data,
        duration: `${Date.now() - startedAt}ms`,
      })),
    )
  }
}
