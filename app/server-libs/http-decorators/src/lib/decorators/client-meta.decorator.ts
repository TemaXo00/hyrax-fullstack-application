import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { ClientMeta } from '@org/types';
import type { Request } from 'express';

export const ClientMetaParam = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ClientMeta => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const userAgent = request.headers['user-agent'];

    return {
      ip: request.ip ?? request.socket.remoteAddress ?? 'unknown',
      userAgent: typeof userAgent === 'string' ? userAgent : 'unknown',
    };
  },
);
