import { AUTH_MESSAGES } from '@org/validation-messages';

import { getData, getErrorMessage } from './support/api-client';
import { E2E_PASSWORD } from './support/fixtures';
import { nextClientIp, setupE2e } from './support/setup';

import type { ApiClient } from './support/api-client';
import type { MeEntity, SessionEntity, UserEntity } from '@org/types';

const getContext = setupE2e();

async function registerPlayer(
  client: ApiClient,
  nickname = 'Игрок',
): Promise<UserEntity> {
  const response = await client.register(nickname);

  expect(response.status).toBe(201);

  return getData(response).user;
}

describe('Auth REST (e2e)', () => {
  it('регистрирует игрока, выдаёт токены и возвращает профиль со связями', async () => {
    const client = getContext().client();

    const response = await client.register('Игрок');

    expect(response.status).toBe(201);

    const data = getData(response);

    expect(data.accessToken).toEqual(expect.any(String));
    expect(data.user).toMatchObject({
      nickname: 'Игрок',
      role: 'PLAYER',
      roleLabel: 'Игрок',
      isBlocked: false,
    });

    const cookies = response.headers.getSetCookie().join(';');

    expect(cookies).toContain('refreshToken=');
    expect(cookies).toContain('HttpOnly');
    expect(cookies).toContain('SameSite=Lax');

    const me = await client.me();

    expect(me.status).toBe(200);

    const profile = getData<MeEntity>(me);

    expect(profile.id).toBe(data.user.id);
    expect(profile.pet).toMatchObject({ name: 'Питомец Игрок', level: 1 });
    expect(profile.stats?.coins).toBe('0');
    expect(profile.foodInventory).toEqual([]);
    expect(profile.cosmeticInventory).toEqual([]);
    expect(profile.upgrades).toEqual([]);
    expect(profile.achievements).toEqual([]);
    expect(profile.streak).toBeNull();
    expect(profile).not.toHaveProperty('passwordHash');
  });

  it('хранит сессию с IP и user-agent клиента', async () => {
    const ip = nextClientIp();
    const client = getContext().client(ip);
    await client.register('Игрок');

    const sessions = await client.get<SessionEntity[]>('/auth/sessions');

    expect(sessions.status).toBe(200);

    const [session] = getData(sessions);

    expect(session).toMatchObject({
      ip,
      userAgent: 'hyrax-e2e',
      isCurrent: true,
      localName: null,
    });
  });

  it('отклоняет повторную регистрацию и некорректные данные', async () => {
    const client = getContext().client();

    await registerPlayer(client, 'Игрок');

    const duplicate = await client.register('Игрок');

    expect(duplicate.status).toBe(409);
    expect(getErrorMessage(duplicate)).toBe(
      AUTH_MESSAGES.USER_WITH_NICKNAME_EXISTS,
    );

    const mismatched = await client.register(
      'Другой',
      E2E_PASSWORD,
      'Another123',
    );

    expect(mismatched.status).toBe(400);
    expect(getErrorMessage(mismatched)).toBe(
      AUTH_MESSAGES.PASSWORDS_NOT_SIMILAR,
    );

    const weakPassword = await client.register('ЕщёОдин', 'weak');

    expect(weakPassword.status).toBe(400);
    expect(getErrorMessage(weakPassword)).toBe(
      AUTH_MESSAGES.PASSWORD_VALIDATION.STRONG,
    );

    const shortNickname = await client.register('ab');

    expect(shortNickname.status).toBe(400);
    expect(getErrorMessage(shortNickname)).toBe(
      AUTH_MESSAGES.NICKNAME_VALIDATION.MIN_LENGTH,
    );
  });

  it('авторизует игрока и отклоняет неверные данные', async () => {
    const client = getContext().client();
    const user = await registerPlayer(client, 'Игрок');

    client.token = null;

    const wrongPassword = await client.login('Игрок', 'Wrong1234');

    expect(wrongPassword.status).toBe(401);
    expect(getErrorMessage(wrongPassword)).toBe(
      AUTH_MESSAGES.INVALID_CREDENTIALS,
    );

    const unknownUser = await client.login('Неизвестный', E2E_PASSWORD);

    expect(unknownUser.status).toBe(401);
    expect(getErrorMessage(unknownUser)).toBe(
      AUTH_MESSAGES.INVALID_CREDENTIALS,
    );

    const login = await client.login('Игрок');

    expect(login.status).toBe(201);

    const loggedUser = getData(login).user;

    expect(loggedUser.id).toBe(user.id);
    expect(new Date(loggedUser.lastLoginAt).getTime()).toBeGreaterThanOrEqual(
      new Date(user.lastLoginAt).getTime(),
    );

    const sessions = await client.get<SessionEntity[]>('/auth/sessions');

    expect(getData(sessions)).toHaveLength(2);
  });

  it('блокирует вход заблокированного пользователя', async () => {
    const client = getContext().client();
    const user = await registerPlayer(client, 'Игрок');

    await getContext().db.user.update({
      where: { id: user.id },
      data: { isBlocked: true, blockReason: 'нарушение правил' },
    });

    client.token = null;

    const login = await client.login('Игрок');

    expect(login.status).toBe(403);
    expect(getErrorMessage(login)).toBe(
      AUTH_MESSAGES.USER_BLOCKED_FOREVER('нарушение правил'),
    );
  });

  it('снимает истёкшую блокировку при входе', async () => {
    const client = getContext().client();
    const user = await registerPlayer(client, 'Игрок');

    await getContext().db.user.update({
      where: { id: user.id },
      data: {
        isBlocked: true,
        blockReason: 'старое нарушение',
        blockedUntil: new Date(Date.now() - 60_000),
      },
    });

    client.token = null;

    const login = await client.login('Игрок');

    expect(login.status).toBe(201);

    const stored = await getContext().db.user.findUnique({
      where: { id: user.id },
    });

    expect(stored).toMatchObject({
      isBlocked: false,
      blockedUntil: null,
      blockReason: null,
    });
  });

  it('обновляет пару токенов и отзывает использованный refresh-токен', async () => {
    const client = getContext().client();
    await registerPlayer(client, 'Игрок');

    const firstRefreshToken = client.getCookie('refreshToken');

    expect(firstRefreshToken).toBeDefined();

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const refresh = await client.refresh();

    expect(refresh.status).toBe(201);
    expect(client.getCookie('refreshToken')).not.toBe(firstRefreshToken);
    expect(getData(refresh).accessToken).toEqual(expect.any(String));

    client.setCookie('refreshToken', firstRefreshToken as string);

    const reused = await client.refresh();

    expect(reused.status).toBe(401);
    expect(getErrorMessage(reused)).toBe(AUTH_MESSAGES.INVALID_TOKEN);
  });

  it('отклоняет refresh без cookie и с недействительным токеном', async () => {
    const client = getContext().client();

    const missing = await client.refresh();

    expect(missing.status).toBe(401);
    expect(getErrorMessage(missing)).toBe(AUTH_MESSAGES.REFRESH_TOKEN_REQUIRED);

    client.setCookie('refreshToken', 'not-a-jwt');

    const invalid = await client.refresh();

    expect(invalid.status).toBe(401);
    expect(getErrorMessage(invalid)).toBe(AUTH_MESSAGES.INVALID_TOKEN);
    expect(client.getCookie('refreshToken')).toBeUndefined();
  });

  it('выходит из сессии и делает токены недействительными', async () => {
    const client = getContext().client();
    await registerPlayer(client, 'Игрок');

    const accessToken = client.token;

    expect(accessToken).toBeTruthy();

    const logout = await client.logout();

    expect(logout.status).toBe(201);
    expect(client.getCookie('refreshToken')).toBeUndefined();

    const me = await client.me();

    expect(me.status).toBe(401);
    expect(getErrorMessage(me)).toBe(AUTH_MESSAGES.SESSION_NOT_FOUND);

    const refresh = await client.refresh();

    expect(refresh.status).toBe(401);
  });

  it('меняет пароль, завершает остальные сессии и оставляет текущую', async () => {
    const client = getContext().client();
    const otherClient = getContext().client();

    await registerPlayer(client, 'Игрок');
    await otherClient.login('Игрок');

    const wrongOldPassword = await client.patch('/auth/password/change', {
      oldPassword: 'Wrong1234',
      newPassword: 'NewSecret123',
      newPasswordConfirmation: 'NewSecret123',
    });

    expect(wrongOldPassword.status).toBe(401);
    expect(getErrorMessage(wrongOldPassword)).toBe(
      AUTH_MESSAGES.INVALID_CREDENTIALS,
    );

    const samePassword = await client.patch('/auth/password/change', {
      oldPassword: E2E_PASSWORD,
      newPassword: E2E_PASSWORD,
      newPasswordConfirmation: E2E_PASSWORD,
    });

    expect(samePassword.status).toBe(400);
    expect(getErrorMessage(samePassword)).toBe(AUTH_MESSAGES.SAME_PASSWORD);

    const change = await client.patch('/auth/password/change', {
      oldPassword: E2E_PASSWORD,
      newPassword: 'NewSecret123',
      newPasswordConfirmation: 'NewSecret123',
    });

    expect(change.status).toBe(200);

    const otherMe = await otherClient.me();

    expect(otherMe.status).toBe(401);

    const currentMe = await client.me();

    expect(currentMe.status).toBe(200);

    client.token = null;

    const oldLogin = await client.login('Игрок', E2E_PASSWORD);

    expect(oldLogin.status).toBe(401);

    const newLogin = await client.login('Игрок', 'NewSecret123');

    expect(newLogin.status).toBe(201);
  });

  it('управляет сессиями пользователя', async () => {
    const client = getContext().client();
    const otherClient = getContext().client();

    await registerPlayer(client, 'Игрок');
    await otherClient.login('Игрок');

    const sessionsResponse =
      await client.get<SessionEntity[]>('/auth/sessions');
    const sessions = getData(sessionsResponse);
    const current = sessions.find((session) => session.isCurrent);
    const other = sessions.find((session) => !session.isCurrent);

    expect(sessions).toHaveLength(2);
    expect(current).toBeDefined();
    expect(other).toBeDefined();

    const rename = await client.patch<SessionEntity>(
      `/auth/sessions/${other?.id}`,
      { localName: 'Рабочий ноутбук' },
    );

    expect(rename.status).toBe(200);
    expect(getData(rename).localName).toBe('Рабочий ноутбук');

    const removeCurrent = await client.delete(`/auth/sessions/${current?.id}`);

    expect(removeCurrent.status).toBe(400);
    expect(getErrorMessage(removeCurrent)).toBe(
      AUTH_MESSAGES.CANNOT_DELETE_CURRENT_SESSION,
    );

    const removeOther = await client.delete(`/auth/sessions/${other?.id}`);

    expect(removeOther.status).toBe(200);

    const otherMe = await otherClient.me();

    expect(otherMe.status).toBe(401);

    const secondClient = getContext().client();
    await secondClient.login('Игрок');

    const deleteAll = await client.delete('/auth/sessions');

    expect(deleteAll.status).toBe(200);

    const secondMe = await secondClient.me();

    expect(secondMe.status).toBe(401);
    expect((await client.me()).status).toBe(200);
  });

  it('возвращает 404 при переименовании чужой сессии', async () => {
    const client = getContext().client();
    const otherClient = getContext().client();

    await registerPlayer(client, 'Игрок');
    await registerPlayer(otherClient, 'Другой');

    const otherSessions =
      await otherClient.get<SessionEntity[]>('/auth/sessions');
    const [otherSession] = getData(otherSessions);

    const rename = await client.patch(`/auth/sessions/${otherSession.id}`, {
      localName: 'Чужая сессия',
    });

    expect(rename.status).toBe(404);
    expect(getErrorMessage(rename)).toBe(AUTH_MESSAGES.SESSION_NOT_FOUND);
  });

  it('требует авторизацию для защищённых методов', async () => {
    const anonymous = getContext().client();

    const noToken = await anonymous.me();

    expect(noToken.status).toBe(401);
    expect(getErrorMessage(noToken)).toBe(AUTH_MESSAGES.UNAUTHORIZED);

    const invalidToken = getContext().client();

    invalidToken.token = 'invalid.jwt.token';

    const response = await invalidToken.me();

    expect(response.status).toBe(401);
    expect(getErrorMessage(response)).toBe(AUTH_MESSAGES.INVALID_TOKEN);
  });
});
