import { AppThrottlerGuard } from './app-throttler.guard';

import type { ExecutionContext } from '@nestjs/common';

function createContext(type: string): ExecutionContext {
  return { getType: () => type } as unknown as ExecutionContext;
}

describe('AppThrottlerGuard', () => {
  const guard = Object.create(AppThrottlerGuard.prototype) as AppThrottlerGuard;

  it('does not throttle WebSocket contexts', async () => {
    await expect(guard['shouldSkip'](createContext('ws'))).resolves.toBe(true);
  });

  it('does not skip HTTP contexts', async () => {
    await expect(guard['shouldSkip'](createContext('http'))).resolves.toBe(
      false,
    );
  });
});
