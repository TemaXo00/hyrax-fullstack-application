import { DAILY_REWARD_MESSAGES } from '@org/validation-messages';

import { getData, getErrorMessage } from './support/api-client';
import { promoteToAdmin } from './support/database';
import { COSMETICS } from './support/fixtures';
import { setupE2e } from './support/setup';

import type { ApiClient } from './support/api-client';
import type { DatabaseService } from '@org/database';
import type {
  DailyRewardClaimEntity,
  DailyRewardEntity,
  DailyRewardStateEntity,
  MeEntity,
} from '@org/types';

const getContext = setupE2e();

function utcDayOffset(days: number): Date {
  const now = new Date();

  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days),
  );
}

async function createPlayer(
  client: ApiClient,
  nickname = 'Игрок',
): Promise<string> {
  return getData(await client.register(nickname)).user.id;
}

async function createAdmin(client: ApiClient): Promise<string> {
  const user = getData(await client.register('Админ')).user;

  await promoteToAdmin(getContext().db, user.id);

  return user.id;
}

async function setStreak(
  db: DatabaseService,
  userId: string,
  data: { currentStreak: number; bestStreak: number; lastClaimDate: Date },
): Promise<void> {
  await db.loginStreak.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

describe('Daily rewards REST (e2e)', () => {
  it('возвращает календарь наград и стартовое состояние', async () => {
    const client = getContext().client();

    await createPlayer(client);

    const response = await client.query<DailyRewardStateEntity>(
      '/daily-rewards',
      {},
    );

    expect(response.status).toBe(200);

    const data = getData(response);

    expect(data).toMatchObject({
      currentStreak: 0,
      bestStreak: 0,
      lastClaimDate: null,
      canClaim: true,
      dayNumber: 1,
    });
    expect(data.rewards.map((reward) => reward.dayNumber)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
    expect(data.rewards[0]).toMatchObject({
      rewardCoins: 50,
      rewardItem: null,
    });
    expect(data.rewards[2]).toMatchObject({
      rewardCoins: 100,
      rewardItem: {
        id: COSMETICS.cap.id,
        slotLabel: 'Головной убор',
      },
    });

    expect(
      (await getContext().client().query('/daily-rewards', {})).status,
    ).toBe(401);
  });

  it('выдаёт награду за сегодня и продолжает серию на следующий день', async () => {
    const client = getContext().client();
    const userId = await createPlayer(client);

    const first = await client.post<DailyRewardClaimEntity>(
      '/daily-rewards/claim',
    );

    expect(first.status).toBe(201);
    expect(getData(first)).toMatchObject({
      dayNumber: 1,
      rewardCoins: 50,
      rewardItem: null,
      itemGranted: false,
      currentStreak: 1,
      bestStreak: 1,
      canClaim: false,
      coinsBalance: '50',
      totalCoinsEarned: '50',
    });

    const repeated = await client.post('/daily-rewards/claim');

    expect(repeated.status).toBe(409);
    expect(getErrorMessage(repeated)).toBe(
      DAILY_REWARD_MESSAGES.ALREADY_CLAIMED,
    );

    const claimedState = getData(
      await client.query<DailyRewardStateEntity>('/daily-rewards', {}),
    );

    expect(claimedState).toMatchObject({
      currentStreak: 1,
      bestStreak: 1,
      canClaim: false,
      dayNumber: 1,
    });

    await setStreak(getContext().db, userId, {
      currentStreak: 1,
      bestStreak: 1,
      lastClaimDate: utcDayOffset(-1),
    });

    const nextState = getData(
      await client.query<DailyRewardStateEntity>('/daily-rewards', {}),
    );

    expect(nextState).toMatchObject({
      currentStreak: 1,
      canClaim: true,
      dayNumber: 2,
    });

    const second = await client.post<DailyRewardClaimEntity>(
      '/daily-rewards/claim',
    );

    expect(getData(second)).toMatchObject({
      dayNumber: 2,
      rewardCoins: 75,
      currentStreak: 2,
      bestStreak: 2,
      canClaim: false,
      coinsBalance: '125',
      totalCoinsEarned: '125',
    });

    const me = getData<MeEntity>(await client.me());

    expect(me.stats).toMatchObject({
      coins: '125',
      totalCoinsEarned: '125',
      streak: 2,
    });
  });

  it('выдаёт косметику один раз и сохраняет предмет в награде', async () => {
    const client = getContext().client();
    const userId = await createPlayer(client);

    await setStreak(getContext().db, userId, {
      currentStreak: 2,
      bestStreak: 2,
      lastClaimDate: utcDayOffset(-1),
    });

    const claim = await client.post<DailyRewardClaimEntity>(
      '/daily-rewards/claim',
    );

    expect(getData(claim)).toMatchObject({
      dayNumber: 3,
      rewardCoins: 100,
      rewardItem: { id: COSMETICS.cap.id },
      itemGranted: true,
      currentStreak: 3,
      bestStreak: 3,
    });

    const firstInventory = getData<MeEntity>(
      await client.me(),
    ).cosmeticInventory;

    expect(firstInventory).toHaveLength(1);
    expect(firstInventory[0].cosmetic.id).toBe(COSMETICS.cap.id);

    await setStreak(getContext().db, userId, {
      currentStreak: 2,
      bestStreak: 3,
      lastClaimDate: utcDayOffset(-1),
    });

    const repeated = await client.post<DailyRewardClaimEntity>(
      '/daily-rewards/claim',
    );

    expect(getData(repeated)).toMatchObject({
      dayNumber: 3,
      rewardItem: { id: COSMETICS.cap.id },
      itemGranted: false,
      currentStreak: 3,
      bestStreak: 3,
    });

    expect(getData<MeEntity>(await client.me()).cosmeticInventory).toHaveLength(
      1,
    );
  });

  it('сбрасывает серию после пропуска и сохраняет лучший результат', async () => {
    const client = getContext().client();
    const userId = await createPlayer(client);

    await setStreak(getContext().db, userId, {
      currentStreak: 5,
      bestStreak: 5,
      lastClaimDate: utcDayOffset(-3),
    });

    const state = getData(
      await client.query<DailyRewardStateEntity>('/daily-rewards', {}),
    );

    expect(state).toMatchObject({
      currentStreak: 5,
      bestStreak: 5,
      canClaim: true,
      dayNumber: 1,
    });

    const claim = await client.post<DailyRewardClaimEntity>(
      '/daily-rewards/claim',
    );

    expect(getData(claim)).toMatchObject({
      dayNumber: 1,
      rewardCoins: 50,
      currentStreak: 1,
      bestStreak: 5,
      canClaim: false,
    });

    const after = getData(
      await client.query<DailyRewardStateEntity>('/daily-rewards', {}),
    );

    expect(after).toMatchObject({
      currentStreak: 1,
      bestStreak: 5,
      canClaim: false,
      dayNumber: 1,
    });
  });

  it('обновляет дни наград через админские маршруты', async () => {
    const adminClient = getContext().client();
    const playerClient = getContext().client();

    await createAdmin(adminClient);

    const catalog = getData<DailyRewardEntity[]>(
      await adminClient.get('/admin/daily-rewards'),
    );

    expect(catalog).toHaveLength(7);
    expect(catalog[0]).toMatchObject({ dayNumber: 1, rewardCoins: 50 });

    const updated = await adminClient.patch<DailyRewardEntity>(
      '/admin/daily-rewards/1',
      {
        rewardCoins: 500,
        rewardItemId: COSMETICS.background.id,
      },
    );

    expect(updated.status).toBe(200);
    expect(getData(updated)).toMatchObject({
      dayNumber: 1,
      rewardCoins: 500,
      rewardItem: { id: COSMETICS.background.id },
    });

    const cleared = await adminClient.patch<DailyRewardEntity>(
      '/admin/daily-rewards/7',
      { rewardItemId: null },
    );

    expect(getData(cleared)).toMatchObject({
      dayNumber: 7,
      rewardItem: null,
    });

    const unknownItem = await adminClient.patch('/admin/daily-rewards/2', {
      rewardItemId: 'unknown',
    });

    expect(unknownItem.status).toBe(404);
    expect(getErrorMessage(unknownItem)).toBe(
      DAILY_REWARD_MESSAGES.REWARD_ITEM_NOT_FOUND,
    );

    expect(
      (await adminClient.patch('/admin/daily-rewards/8', { rewardCoins: 10 }))
        .status,
    ).toBe(400);
    expect(
      (await adminClient.patch('/admin/daily-rewards/0', { rewardCoins: 10 }))
        .status,
    ).toBe(400);
    expect(
      (
        await adminClient.patch('/admin/daily-rewards/1', {
          rewardCoins: -1,
        })
      ).status,
    ).toBe(400);

    await createPlayer(playerClient);

    const claim = await playerClient.post<DailyRewardClaimEntity>(
      '/daily-rewards/claim',
    );

    expect(getData(claim)).toMatchObject({
      dayNumber: 1,
      rewardCoins: 500,
      rewardItem: { id: COSMETICS.background.id },
      itemGranted: true,
    });

    const forbidden = await playerClient.get('/admin/daily-rewards');
    const forbiddenUpdate = await playerClient.patch('/admin/daily-rewards/1', {
      rewardCoins: 1,
    });

    expect(forbidden.status).toBe(403);
    expect(forbiddenUpdate.status).toBe(403);
    expect(
      (await getContext().client().get('/admin/daily-rewards')).status,
    ).toBe(401);
  });
});
