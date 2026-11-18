import { LEADERBOARD_MESSAGES } from '@org/validation-messages';

import { getData, getErrorMessage } from './support/api-client';
import { updatePet, updateStatistics } from './support/database';
import { setupE2e } from './support/setup';

import type { ApiClient } from './support/api-client';
import type {
  LeaderboardPositionEntity,
  PaginatedLeaderboardOutput,
  UserEntity,
} from '@org/types';

const getContext = setupE2e();

interface PlayerFixture {
  client: ApiClient;
  user: UserEntity;
}

async function createPlayer(
  nickname: string,
  totalCoinsEarned: number,
  totalClicks: number,
  level: number,
  streak: number,
): Promise<PlayerFixture> {
  const client = getContext().client();
  const user = getData(await client.register(nickname)).user;

  await updateStatistics(getContext().db, user.id, {
    totalCoinsEarned: BigInt(totalCoinsEarned),
    totalClicks: BigInt(totalClicks),
    streak,
  });
  await updatePet(getContext().db, user.id, { level });

  return { client, user };
}

describe('Leaderboard REST (e2e)', () => {
  it('возвращает рейтинг по заработанным монетам с местами и пагинацией', async () => {
    const first = await createPlayer('Первый', 100, 5, 1, 1);
    const second = await createPlayer('Второй', 300, 1, 3, 2);
    const third = await createPlayer('Третий', 200, 9, 2, 3);

    const response = await first.client.query<PaginatedLeaderboardOutput>(
      '/leaderboard',
      {},
    );

    expect(response.status).toBe(200);

    const data = getData(response);

    expect(data).toMatchObject({
      metric: 'TOTAL_COINS_EARNED',
      metricLabel: 'Всего заработано монет',
      pagination: { page: 1, limit: 10, total: 3, hasNext: false },
    });
    expect(data.entries).toEqual([
      {
        rank: 1,
        userId: second.user.id,
        nickname: 'Второй',
        petName: 'Питомец Второй',
        petLevel: 3,
        value: '300',
      },
      {
        rank: 2,
        userId: third.user.id,
        nickname: 'Третий',
        petName: 'Питомец Третий',
        petLevel: 2,
        value: '200',
      },
      {
        rank: 3,
        userId: first.user.id,
        nickname: 'Первый',
        petName: 'Питомец Первый',
        petLevel: 1,
        value: '100',
      },
    ]);

    const page = getData(
      await first.client.query<PaginatedLeaderboardOutput>('/leaderboard', {
        page: 2,
        limit: 1,
      }),
    );

    expect(page.pagination).toMatchObject({
      page: 2,
      limit: 1,
      total: 3,
      hasNext: true,
      hasPrev: true,
    });
    expect(page.entries[0]).toMatchObject({ rank: 2, nickname: 'Третий' });
  });

  it('сортирует рейтинг по выбранной метрике', async () => {
    const first = await createPlayer('Первый', 100, 5, 1, 1);
    const second = await createPlayer('Второй', 300, 1, 3, 2);
    const third = await createPlayer('Третий', 200, 9, 2, 3);

    const byClicks = getData(
      await first.client.query<PaginatedLeaderboardOutput>('/leaderboard', {
        metric: 'TOTAL_CLICKS',
      }),
    );

    expect(byClicks.metricLabel).toBe('Всего кликов');
    expect(byClicks.entries.map((entry) => entry.nickname)).toEqual([
      'Третий',
      'Первый',
      'Второй',
    ]);
    expect(byClicks.entries[0].value).toBe('9');

    const byLevel = getData(
      await first.client.query<PaginatedLeaderboardOutput>('/leaderboard', {
        metric: 'PET_LEVEL',
      }),
    );

    expect(byLevel.metricLabel).toBe('Уровень питомца');
    expect(byLevel.entries.map((entry) => entry.nickname)).toEqual([
      'Второй',
      'Третий',
      'Первый',
    ]);

    const byStreak = getData(
      await first.client.query<PaginatedLeaderboardOutput>('/leaderboard', {
        metric: 'STREAK',
      }),
    );

    expect(byStreak.metricLabel).toBe('Серия входов');
    expect(byStreak.entries.map((entry) => entry.nickname)).toEqual([
      'Третий',
      'Второй',
      'Первый',
    ]);

    expect(third.user.id).toBe(byStreak.entries[0].userId);
    expect(second.user.id).toBe(byLevel.entries[0].userId);
  });

  it('возвращает позицию текущего игрока по каждой метрике', async () => {
    const first = await createPlayer('Первый', 100, 5, 1, 1);
    await createPlayer('Второй', 300, 1, 3, 2);
    await createPlayer('Третий', 200, 9, 2, 3);

    const byEarned = getData(
      await first.client.query<LeaderboardPositionEntity>(
        '/leaderboard/me',
        {},
      ),
    );

    expect(byEarned).toEqual({
      metric: 'TOTAL_COINS_EARNED',
      metricLabel: 'Всего заработано монет',
      rank: 3,
      value: '100',
      total: 3,
      isRanked: true,
    });

    const byClicks = getData(
      await first.client.query<LeaderboardPositionEntity>('/leaderboard/me', {
        metric: 'TOTAL_CLICKS',
      }),
    );

    expect(byClicks).toMatchObject({ rank: 2, value: '5', total: 3 });

    const byLevel = getData(
      await first.client.query<LeaderboardPositionEntity>('/leaderboard/me', {
        metric: 'PET_LEVEL',
      }),
    );

    expect(byLevel).toMatchObject({ rank: 3, value: '1', total: 3 });
  });

  it('исключает заблокированных игроков из рейтинга', async () => {
    const first = await createPlayer('Первый', 100, 5, 1, 1);
    const second = await createPlayer('Второй', 300, 1, 3, 2);

    await getContext().db.user.update({
      where: { id: second.user.id },
      data: { isBlocked: true, blockReason: 'нарушение правил' },
    });

    const data = getData(
      await first.client.query<PaginatedLeaderboardOutput>('/leaderboard', {}),
    );

    expect(data.pagination.total).toBe(1);
    expect(data.entries).toHaveLength(1);
    expect(data.entries[0].userId).toBe(first.user.id);
  });

  it('сбрасывает кеш рейтинга после действия игрока', async () => {
    const first = await createPlayer('Первый', 100, 5, 1, 1);
    await createPlayer('Второй', 300, 1, 3, 2);

    const before = getData(
      await first.client.query<PaginatedLeaderboardOutput>('/leaderboard', {}),
    );

    expect(before.entries[1]).toMatchObject({
      nickname: 'Первый',
      value: '100',
    });

    const click = await first.client.clickPet();

    expect(click.status).toBe(201);

    const after = getData(
      await first.client.query<PaginatedLeaderboardOutput>('/leaderboard', {}),
    );

    expect(after.entries[1]).toMatchObject({
      nickname: 'Первый',
      value: '101',
    });
  });

  it('валидирует метрику рейтинга', async () => {
    const client = getContext().client();
    await client.register('Игрок');

    const invalidList = await client.query('/leaderboard', {
      metric: 'UNKNOWN',
    });

    expect(invalidList.status).toBe(400);
    expect(getErrorMessage(invalidList)).toContain(
      LEADERBOARD_MESSAGES.METRIC_VALIDATION.INVALID,
    );

    const invalidPosition = await client.query('/leaderboard/me', {
      metric: 'UNKNOWN',
    });

    expect(invalidPosition.status).toBe(400);
    expect(getErrorMessage(invalidPosition)).toContain(
      LEADERBOARD_MESSAGES.METRIC_VALIDATION.INVALID,
    );
  });

  it('требует авторизацию для рейтинга', async () => {
    const anonymous = getContext().client();

    expect((await anonymous.query('/leaderboard', {})).status).toBe(401);
    expect((await anonymous.query('/leaderboard/me', {})).status).toBe(401);
  });
});
