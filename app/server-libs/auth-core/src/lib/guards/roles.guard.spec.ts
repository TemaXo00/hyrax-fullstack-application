import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AUTH_ROLES_KEY } from '@org/types';
import { AUTH_MESSAGES } from '@org/validation-messages';

import { RolesGuard } from './roles.guard';

import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { AuthenticatedUser, UserRole } from '@org/types';

const HANDLER = function handler(): void {
  return undefined;
};
const CONTROLLER = class TestController {};

function createContext(user?: Partial<AuthenticatedUser>): ExecutionContext {
  return {
    getHandler: () => HANDLER,
    getClass: () => CONTROLLER,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

function setup(allowedRoles?: UserRole[]): {
  guard: RolesGuard;
  getAllAndOverride: jest.Mock;
} {
  const getAllAndOverride = jest.fn().mockReturnValue(allowedRoles);
  const guard = new RolesGuard({
    getAllAndOverride,
  } as unknown as Reflector);

  return { guard, getAllAndOverride };
}

describe('RolesGuard', () => {
  it('пропускает маршрут без ограничений по ролям', () => {
    const { guard, getAllAndOverride } = setup(undefined);
    const context = createContext(undefined);

    expect(guard.canActivate(context)).toBe(true);
    expect(getAllAndOverride).toHaveBeenCalledWith(AUTH_ROLES_KEY, [
      HANDLER,
      CONTROLLER,
    ]);
  });

  it('пропускает маршрут с пустым списком ролей', () => {
    const { guard } = setup([]);

    expect(guard.canActivate(createContext({ role: 'PLAYER' }))).toBe(true);
  });

  it('требует пользователя для защищённого маршрута', () => {
    const { guard } = setup(['ADMIN']);

    expect(() => guard.canActivate(createContext(undefined))).toThrow(
      new UnauthorizedException(AUTH_MESSAGES.UNAUTHORIZED),
    );
  });

  it('запрещает доступ пользователю с неподходящей ролью', () => {
    const { guard } = setup(['ADMIN']);

    expect(() => guard.canActivate(createContext({ role: 'PLAYER' }))).toThrow(
      new ForbiddenException(AUTH_MESSAGES.ACCESS_DENIED),
    );
  });

  it('пропускает пользователя с разрешённой ролью', () => {
    const { guard } = setup(['ADMIN', 'PLAYER']);

    expect(guard.canActivate(createContext({ role: 'PLAYER' }))).toBe(true);
  });
});
