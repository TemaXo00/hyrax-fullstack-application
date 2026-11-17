import { ConfigService } from '@nestjs/config';

import { JwtStrategy } from './jwt.strategy';

import type { AuthJwtPayload } from '@org/types';

function setup(): { strategy: JwtStrategy; getOrThrow: jest.Mock } {
  const getOrThrow = jest.fn().mockReturnValue('access-token-secret');
  const strategy = new JwtStrategy({
    getOrThrow,
  } as unknown as ConfigService);

  return { strategy, getOrThrow };
}

describe('JwtStrategy', () => {
  it('берёт секрет из конфигурации', () => {
    const { strategy, getOrThrow } = setup();

    expect(strategy).toBeInstanceOf(JwtStrategy);
    expect(getOrThrow).toHaveBeenCalledWith('HYRAX_JWT_SECRET');
  });

  it('возвращает только поля access-токена', () => {
    const { strategy } = setup();
    const payload = {
      id: 'user-1',
      sessionId: 'session-1',
      role: 'PLAYER',
      nickname: 'Лишнее поле',
      isBlocked: false,
    } as AuthJwtPayload;

    expect(strategy.validate(payload)).toEqual({
      id: 'user-1',
      sessionId: 'session-1',
      role: 'PLAYER',
    });
  });
});
