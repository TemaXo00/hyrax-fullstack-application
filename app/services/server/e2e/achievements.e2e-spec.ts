import { ACHIEVEMENT_MESSAGES } from '@org/validation-messages';

import { getData, getErrorMessage } from './support/api-client';
import {
  promoteToAdmin,
  updatePet,
  updateStatistics,
} from './support/database';
import { ACHIEVEMENTS } from './support/fixtures';
import { setupE2e } from './support/setup';

import type { ApiClient } from './support/api-client';
import type {
  AchievementClaimEntity,
  AchievementEntity,
  AchievementProgressEntity,
  PaginatedAchievementCatalogOutput,
  PaginatedAchievementsOutput,
} from '@org/types';

const getContext = setupE2e();

async function createPlayer(
  client: ApiClient,
  nickname = 'Игрок',
): Promise<string> {
  const user = getData(await client.register(nickname)).user;

  await updateStatistics(getContext().db, user.id, {
    totalClicks: BigInt(12),
    totalFeeds: BigInt(2),
    totalCoinsEarned: BigInt(120),
    streak: 3,
    coins: BigInt(0),
  });
  await updatePet(getContext().db, user.id, { level: 4 });

  return user.id;
}

async function createAdmin(client: ApiClient): Promise<string> {
  const user = getData(await client.register('Админ')).user;

  await promoteToAdmin(getContext().db, user.id);

  return user.id;
}

function findAchievement(
  achievements: AchievementProgressEntity[],
  code: string,
): AchievementProgressEntity {
  const achievement = achievements.find((item) => item.code === code);

  if (!achievement) {
    throw new Error(`В ответе нет достижения ${code}`);
  }

  return achievement;
}

describe('Achievements REST (e2e)', () => {
  it('показывает достижения с прогрессом и статусом получения', async () => {
    const client = getContext().client();

    await createPlayer(client);

    const response = await client.query<PaginatedAchievementsOutput>(
      '/achievements',
      { page: 1, limit: 10 },
    );

    expect(response.status).toBe(200);

    const data = getData(response);

    expect(data.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: 5,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });
    expect(data.achievements.map((item) => item.code)).toEqual([
      'FIRST_CLICKS',
      'HUNGRY_PET',
      'GROWING_UP',
      'RICH_PLAYER',
      'REGULAR_PLAYER',
    ]);

    expect(findAchievement(data.achievements, 'FIRST_CLICKS')).toMatchObject({
      conditionType: 'TOTAL_CLICKS',
      conditionTypeLabel: 'Всего кликов',
      conditionValue: 10,
      progress: 10,
      isUnlocked: true,
      isClaimed: false,
      claimedAt: null,
    });
    expect(findAchievement(data.achievements, 'HUNGRY_PET')).toMatchObject({
      progress: 2,
      isUnlocked: false,
    });
    expect(findAchievement(data.achievements, 'GROWING_UP')).toMatchObject({
      progress: 4,
      isUnlocked: false,
    });
    expect(findAchievement(data.achievements, 'RICH_PLAYER')).toMatchObject({
      progress: 120,
      isUnlocked: false,
    });
    expect(findAchievement(data.achievements, 'REGULAR_PLAYER')).toMatchObject({
      progress: 3,
      isUnlocked: true,
    });

    const filtered = getData(
      await client.query<PaginatedAchievementsOutput>('/achievements', {
        conditionType: 'LEVEL',
      }),
    );

    expect(filtered.pagination.total).toBe(1);
    expect(filtered.achievements[0].code).toBe('GROWING_UP');

    const search = getData(
      await client.query<PaginatedAchievementsOutput>('/achievements', {
        search: 'клик',
      }),
    );

    expect(search.pagination.total).toBe(1);
    expect(search.achievements[0].code).toBe('FIRST_CLICKS');

    const invalidFilter = await client.query('/achievements', {
      conditionType: 'UNKNOWN',
    });

    expect(invalidFilter.status).toBe(400);
    expect(getErrorMessage(invalidFilter)).toContain(
      ACHIEVEMENT_MESSAGES.CONDITION_TYPE_VALIDATION.INVALID,
    );
  });

  it('выдаёт награду за выполненное достижение и отклоняет повторы', async () => {
    const client = getContext().client();
    const userId = await createPlayer(client);

    const claim = await client.post<AchievementClaimEntity>(
      `/achievements/${ACHIEVEMENTS.clicks.id}/claim`,
    );

    expect(claim.status).toBe(201);

    const data = getData(claim);

    expect(data).toMatchObject({
      rewardCoins: 50,
      coinsBalance: '50',
      totalCoinsEarned: '170',
      achievement: {
        id: ACHIEVEMENTS.clicks.id,
        code: 'FIRST_CLICKS',
        progress: 10,
        isUnlocked: true,
        isClaimed: true,
      },
    });
    expect(data.achievement.claimedAt).not.toBeNull();

    const claimed = await getContext().db.userAchievment.count({
      where: { userId },
    });

    expect(claimed).toBe(1);

    const me = getData(await client.me());

    expect(me.stats).toMatchObject({
      coins: '50',
      totalCoinsEarned: '170',
    });

    const repeated = await client.post(
      `/achievements/${ACHIEVEMENTS.clicks.id}/claim`,
    );

    expect(repeated.status).toBe(409);
    expect(getErrorMessage(repeated)).toBe(
      ACHIEVEMENT_MESSAGES.ALREADY_CLAIMED,
    );

    const notUnlocked = await client.post(
      `/achievements/${ACHIEVEMENTS.feeds.id}/claim`,
    );

    expect(notUnlocked.status).toBe(400);
    expect(getErrorMessage(notUnlocked)).toBe(
      ACHIEVEMENT_MESSAGES.NOT_UNLOCKED,
    );

    const missing = await client.post('/achievements/unknown/claim');

    expect(missing.status).toBe(404);
    expect(getErrorMessage(missing)).toBe(ACHIEVEMENT_MESSAGES.NOT_FOUND);
  });

  it('управляет каталогом достижений через админские маршруты', async () => {
    const adminClient = getContext().client();
    const playerClient = getContext().client();

    await createAdmin(adminClient);
    await createPlayer(playerClient);

    const created = await adminClient.post<AchievementEntity>(
      '/admin/achievements',
      {
        code: 'WEEKLY_FEEDER',
        title: 'Недельный кормилец',
        description: 'Покормите питомца двадцать раз',
        conditionType: 'TOTAL_FEEDS',
        conditionValue: 20,
        rewardCoins: 500,
      },
    );

    expect(created.status).toBe(201);

    const achievement = getData(created);

    expect(achievement).toMatchObject({
      code: 'WEEKLY_FEEDER',
      title: 'Недельный кормилец',
      conditionType: 'TOTAL_FEEDS',
      conditionTypeLabel: 'Всего кормлений',
      conditionValue: 20,
      rewardCoins: 500,
    });

    const duplicate = await adminClient.post('/admin/achievements', {
      code: 'WEEKLY_FEEDER',
      title: 'Дубль',
      conditionType: 'TOTAL_FEEDS',
      conditionValue: 30,
    });

    expect(duplicate.status).toBe(409);
    expect(getErrorMessage(duplicate)).toBe(ACHIEVEMENT_MESSAGES.CODE_CONFLICT);

    const invalidCondition = await adminClient.post('/admin/achievements', {
      code: 'INVALID_CONDITION',
      title: 'Некорректное условие',
      conditionType: 'UNKNOWN',
      conditionValue: 1,
    });

    expect(invalidCondition.status).toBe(400);
    expect(getErrorMessage(invalidCondition)).toContain(
      ACHIEVEMENT_MESSAGES.CONDITION_TYPE_VALIDATION.INVALID,
    );

    const catalog = getData(
      await adminClient.query<PaginatedAchievementCatalogOutput>(
        '/admin/achievements',
        {},
      ),
    );

    expect(catalog.pagination.total).toBe(6);

    const searched = getData(
      await adminClient.query<PaginatedAchievementCatalogOutput>(
        '/admin/achievements',
        { search: 'Недельный' },
      ),
    );

    expect(searched.pagination.total).toBe(1);

    const found = await adminClient.get<AchievementEntity>(
      `/admin/achievements/${achievement.id}`,
    );

    expect(getData(found)).toMatchObject({ code: 'WEEKLY_FEEDER' });

    const updated = await adminClient.patch<AchievementEntity>(
      `/admin/achievements/${achievement.id}`,
      { title: 'Кормилец недели', conditionValue: 25, rewardCoins: 600 },
    );

    expect(getData(updated)).toMatchObject({
      title: 'Кормилец недели',
      conditionValue: 25,
      rewardCoins: 600,
    });

    const codeConflict = await adminClient.patch(
      `/admin/achievements/${achievement.id}`,
      { code: 'FIRST_CLICKS' },
    );

    expect(codeConflict.status).toBe(409);
    expect(getErrorMessage(codeConflict)).toBe(
      ACHIEVEMENT_MESSAGES.CODE_CONFLICT,
    );

    expect(
      (await adminClient.patch('/admin/achievements/unknown', { title: 'x' }))
        .status,
    ).toBe(404);
    expect((await adminClient.get('/admin/achievements/unknown')).status).toBe(
      404,
    );

    const removed = await adminClient.delete(
      `/admin/achievements/${achievement.id}`,
    );

    expect(removed.status).toBe(200);
    expect(
      (await adminClient.get(`/admin/achievements/${achievement.id}`)).status,
    ).toBe(404);
  });

  it('запрещает удаление полученного достижения и закрывает админку от игрока', async () => {
    const adminClient = getContext().client();
    const playerClient = getContext().client();

    await createAdmin(adminClient);
    await createPlayer(playerClient);

    const claim = await playerClient.post(
      `/achievements/${ACHIEVEMENTS.clicks.id}/claim`,
    );

    expect(claim.status).toBe(201);

    const conflict = await adminClient.delete(
      `/admin/achievements/${ACHIEVEMENTS.clicks.id}`,
    );

    expect(conflict.status).toBe(409);
    expect(getErrorMessage(conflict)).toBe(
      ACHIEVEMENT_MESSAGES.DELETE_CONFLICT,
    );

    const forbidden = await playerClient.query('/admin/achievements', {});
    const forbiddenCreate = await playerClient.post('/admin/achievements', {
      code: 'PLAYER_MADE',
      title: 'От игрока',
      conditionType: 'TOTAL_CLICKS',
      conditionValue: 1,
    });

    expect(forbidden.status).toBe(403);
    expect(forbiddenCreate.status).toBe(403);

    const anonymous = getContext().client();

    expect((await anonymous.query('/achievements', {})).status).toBe(401);
    expect(
      (await anonymous.post(`/achievements/${ACHIEVEMENTS.clicks.id}/claim`))
        .status,
    ).toBe(401);
  });
});
