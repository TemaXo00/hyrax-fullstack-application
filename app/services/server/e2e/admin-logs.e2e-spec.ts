import { ADMIN_LOG_ACTIONS } from '@org/types';
import { AUTH_ADMIN_MESSAGES, AUTH_MESSAGES } from '@org/validation-messages';

import { getData, getErrorMessage } from './support/api-client';
import { promoteToAdmin } from './support/database';
import { setupE2e } from './support/setup';

import type { ApiClient } from './support/api-client';
import type { PaginatedAdminLogsOutput, UserEntity } from '@org/types';

const getContext = setupE2e();

async function createAdmin(client: ApiClient): Promise<UserEntity> {
  const user = getData(await client.register('Админ')).user;

  await promoteToAdmin(getContext().db, user.id);

  return user;
}

function futureDate(): Date {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

async function performAdminActions(adminClient: ApiClient): Promise<{
  blocked: UserEntity;
  revoked: UserEntity;
}> {
  const blockedClient = getContext().client();
  const revokedClient = getContext().client();
  const blocked = getData(await blockedClient.register('Блокируемый')).user;
  const revoked = getData(await revokedClient.register('Отзываемый')).user;

  expect(
    (
      await adminClient.patch(`/auth/admin/users/${blocked.id}/block`, {
        blockReason: 'нарушение правил',
        blockedUntil: futureDate().toISOString(),
      })
    ).status,
  ).toBe(200);
  expect(
    (await adminClient.patch(`/auth/admin/users/${blocked.id}/unblock`)).status,
  ).toBe(200);
  expect(
    (await adminClient.delete(`/auth/admin/users/${revoked.id}/sessions`))
      .status,
  ).toBe(200);

  return { blocked, revoked };
}

describe('Admin logs REST (e2e)', () => {
  it('показывает журнал действий администратора с вложенными пользователями', async () => {
    const adminClient = getContext().client();
    const admin = await createAdmin(adminClient);
    const { blocked, revoked } = await performAdminActions(adminClient);

    const response = await adminClient.query<PaginatedAdminLogsOutput>(
      '/auth/admin/users/logs',
      {},
    );

    expect(response.status).toBe(200);

    const data = getData(response);

    expect(data.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: 3,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });
    expect(data.logs).toHaveLength(3);

    const blockLog = data.logs.find(
      (log) => log.action === ADMIN_LOG_ACTIONS.USER_BLOCKED,
    );

    expect(blockLog).toMatchObject({
      admin: { id: admin.id, nickname: 'Админ' },
      targetUser: { id: blocked.id, nickname: 'Блокируемый' },
      details: {
        blockReason: 'нарушение правил',
      },
    });
    expect(blockLog?.createdAt).toEqual(expect.any(String));

    const unblockLog = data.logs.find(
      (log) => log.action === ADMIN_LOG_ACTIONS.USER_UNBLOCKED,
    );

    expect(unblockLog).toMatchObject({
      admin: { id: admin.id },
      targetUser: { id: blocked.id },
    });

    const revokeLog = data.logs.find(
      (log) => log.action === ADMIN_LOG_ACTIONS.USER_SESSIONS_REVOKED,
    );

    expect(revokeLog).toMatchObject({
      admin: { id: admin.id },
      targetUser: { id: revoked.id },
      details: null,
    });
  });

  it('фильтрует журнал по действию, администратору и пользователю', async () => {
    const adminClient = getContext().client();
    const admin = await createAdmin(adminClient);
    const { blocked, revoked } = await performAdminActions(adminClient);

    const blockedOnly = getData(
      await adminClient.query<PaginatedAdminLogsOutput>(
        '/auth/admin/users/logs',
        { action: ADMIN_LOG_ACTIONS.USER_BLOCKED },
      ),
    );

    expect(blockedOnly.pagination.total).toBe(1);
    expect(blockedOnly.logs[0].targetUser?.id).toBe(blocked.id);

    const byAdmin = getData(
      await adminClient.query<PaginatedAdminLogsOutput>(
        '/auth/admin/users/logs',
        { adminId: admin.id },
      ),
    );

    expect(byAdmin.pagination.total).toBe(3);

    const byTarget = getData(
      await adminClient.query<PaginatedAdminLogsOutput>(
        '/auth/admin/users/logs',
        { targetUserId: revoked.id },
      ),
    );

    expect(byTarget.pagination.total).toBe(1);
    expect(byTarget.logs[0].action).toBe(
      ADMIN_LOG_ACTIONS.USER_SESSIONS_REVOKED,
    );

    const combined = getData(
      await adminClient.query<PaginatedAdminLogsOutput>(
        '/auth/admin/users/logs',
        {
          adminId: admin.id,
          targetUserId: blocked.id,
          action: ADMIN_LOG_ACTIONS.USER_UNBLOCKED,
        },
      ),
    );

    expect(combined.pagination.total).toBe(1);

    const empty = getData(
      await adminClient.query<PaginatedAdminLogsOutput>(
        '/auth/admin/users/logs',
        { targetUserId: admin.id },
      ),
    );

    expect(empty.pagination.total).toBe(0);

    const invalidAction = await adminClient.query('/auth/admin/users/logs', {
      action: 'UNKNOWN',
    });

    expect(invalidAction.status).toBe(400);
    expect(getErrorMessage(invalidAction)).toContain(
      AUTH_ADMIN_MESSAGES.ADMIN_LOG_ACTION_VALIDATION.INVALID,
    );
  });

  it('пагинирует журнал от новых записей к старым', async () => {
    const adminClient = getContext().client();

    await createAdmin(adminClient);
    await performAdminActions(adminClient);

    const firstPage = getData(
      await adminClient.query<PaginatedAdminLogsOutput>(
        '/auth/admin/users/logs',
        { page: 1, limit: 2 },
      ),
    );

    expect(firstPage.pagination).toMatchObject({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
      hasNext: true,
      hasPrev: false,
    });
    expect(firstPage.logs).toHaveLength(2);

    const secondPage = getData(
      await adminClient.query<PaginatedAdminLogsOutput>(
        '/auth/admin/users/logs',
        { page: 2, limit: 2 },
      ),
    );

    expect(secondPage.pagination).toMatchObject({
      page: 2,
      hasNext: false,
      hasPrev: true,
    });
    expect(secondPage.logs).toHaveLength(1);
  });

  it('закрывает журнал от игроков и анонимных запросов', async () => {
    const playerClient = getContext().client();

    await playerClient.register('Игрок');

    const forbidden = await playerClient.query('/auth/admin/users/logs', {});

    expect(forbidden.status).toBe(403);
    expect(getErrorMessage(forbidden)).toBe(AUTH_MESSAGES.ACCESS_DENIED);

    expect(
      (await getContext().client().query('/auth/admin/users/logs', {})).status,
    ).toBe(401);
  });
});
