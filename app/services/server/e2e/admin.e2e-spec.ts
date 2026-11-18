import { ADMIN_LOG_ACTIONS } from '@org/types';
import {
  AUTH_ADMIN_MESSAGES,
  AUTH_MESSAGES,
  COSMETIC_MESSAGES,
  FOOD_MESSAGES,
  PET_MESSAGES,
  UPGRADE_MESSAGES,
} from '@org/validation-messages';

import { getData, getErrorMessage } from './support/api-client';
import { promoteToAdmin, updateStatistics } from './support/database';
import { COSMETICS, FOODS, UPGRADES } from './support/fixtures';
import { setupE2e } from './support/setup';

import type { ApiClient } from './support/api-client';
import type {
  FoodEntity,
  CosmeticEntity,
  UpgradeEntity,
  MeEntity,
  PetAdminEntity,
  PetStateEntity,
  SessionEntity,
  UserEntity,
} from '@org/types';

const getContext = setupE2e();

interface PaginatedUsers {
  pagination: { total: number };
  users: UserEntity[];
}

interface PaginatedPets {
  pagination: { total: number };
  pets: PetAdminEntity[];
}

interface PaginatedFoods {
  pagination: { total: number };
  foods: FoodEntity[];
}

interface PaginatedCosmetics {
  pagination: { total: number };
  cosmetics: CosmeticEntity[];
}

interface PaginatedUpgrades {
  pagination: { total: number };
  upgrades: UpgradeEntity[];
}

async function createAdmin(client: ApiClient): Promise<UserEntity> {
  const user = getData(await client.register('Админ')).user;

  await promoteToAdmin(getContext().db, user.id);

  return user;
}

describe('Admin REST (e2e)', () => {
  it('закрывает админские маршруты от игрока', async () => {
    const player = getContext().client();
    const user = getData(await player.register('Игрок')).user;

    const responses = [
      await player.query('/auth/admin/users', {}),
      await player.get(`/auth/admin/users/${user.id}`),
      await player.query('/admin/pets', {}),
      await player.get('/admin/pets/unknown'),
      await player.patch(`/admin/pets/${user.id}`, { level: 2 }),
      await player.post('/admin/shop/foods', {}),
      await player.patch('/admin/shop/foods/unknown', {}),
      await player.delete('/admin/shop/cosmetics/unknown'),
      await player.post('/admin/shop/upgrades', {}),
    ];

    for (const response of responses) {
      expect(response.status).toBe(403);
      expect(getErrorMessage(response)).toBe(AUTH_MESSAGES.ACCESS_DENIED);
    }
  });

  it('применяет новую роль администратора без повторного входа', async () => {
    const adminClient = getContext().client();
    const admin = await createAdmin(adminClient);

    const response = await adminClient.get<UserEntity>(
      `/auth/admin/users/${admin.id}`,
    );

    expect(response.status).toBe(200);
    expect(getData(response)).toMatchObject({
      id: admin.id,
      role: 'ADMIN',
      roleLabel: 'Администратор',
    });
  });

  it('меняет роль пользователя, применяет её без повторного входа и журналирует действие', async () => {
    const adminClient = getContext().client();
    const playerClient = getContext().client();
    const admin = await createAdmin(adminClient);
    const player = getData(await playerClient.register('Игрок')).user;

    await playerClient.me();

    const promote = await adminClient.patch<UserEntity>(
      `/auth/admin/users/${player.id}/role`,
      { role: 'ADMIN' },
    );

    expect(promote.status).toBe(200);
    expect(getData(promote)).toMatchObject({
      id: player.id,
      role: 'ADMIN',
      roleLabel: 'Администратор',
    });

    const promotedAccess = await playerClient.query('/auth/admin/users', {
      search: 'Игрок',
    });

    expect(promotedAccess.status).toBe(200);

    const demote = await adminClient.patch<UserEntity>(
      `/auth/admin/users/${player.id}/role`,
      { role: 'PLAYER' },
    );

    expect(demote.status).toBe(200);
    expect(getData(demote)).toMatchObject({
      id: player.id,
      role: 'PLAYER',
      roleLabel: 'Игрок',
    });

    const denied = await playerClient.query('/auth/admin/users', {});

    expect(denied.status).toBe(403);
    expect(getErrorMessage(denied)).toBe(AUTH_MESSAGES.ACCESS_DENIED);

    const log = await getContext().db.adminLog.findFirst({
      where: {
        adminId: admin.id,
        targetUserId: player.id,
        action: ADMIN_LOG_ACTIONS.USER_ROLE_CHANGED,
      },
      orderBy: { createdAt: 'asc' },
    });

    expect(log).not.toBeNull();
    expect(log?.details).toMatchObject({
      previousRole: 'PLAYER',
      role: 'ADMIN',
    });

    const selfChange = await adminClient.patch(
      `/auth/admin/users/${admin.id}/role`,
      { role: 'PLAYER' },
    );

    expect(selfChange.status).toBe(400);
    expect(getErrorMessage(selfChange)).toBe(
      AUTH_ADMIN_MESSAGES.CANNOT_CHANGE_OWN_ROLE,
    );

    const unchanged = await adminClient.patch(
      `/auth/admin/users/${player.id}/role`,
      { role: 'PLAYER' },
    );

    expect(unchanged.status).toBe(400);
    expect(getErrorMessage(unchanged)).toBe(
      AUTH_ADMIN_MESSAGES.USER_ROLE_UNCHANGED,
    );

    const invalidRole = await adminClient.patch(
      `/auth/admin/users/${player.id}/role`,
      { role: 'OWNER' },
    );

    expect(invalidRole.status).toBe(400);
    expect(getErrorMessage(invalidRole)).toContain(
      AUTH_ADMIN_MESSAGES.ROLE_VALIDATION.INVALID,
    );

    const missing = await adminClient.patch('/auth/admin/users/unknown/role', {
      role: 'PLAYER',
    });

    expect(missing.status).toBe(404);
    expect(getErrorMessage(missing)).toBe(AUTH_ADMIN_MESSAGES.USER_NOT_FOUND);
  });

  it('фильтрует и ищет пользователей', async () => {
    const adminClient = getContext().client();
    const playerClient = getContext().client();
    const secondPlayerClient = getContext().client();

    const admin = await createAdmin(adminClient);
    const player = getData(await playerClient.register('Игрок')).user;

    await secondPlayerClient.register('ИгрокДва');

    const search = await adminClient.query<PaginatedUsers>(
      '/auth/admin/users',
      { search: 'Игрок' },
    );

    expect(search.status).toBe(200);
    expect(getData(search).pagination.total).toBe(2);

    const byRole = getData(
      await adminClient.query<PaginatedUsers>('/auth/admin/users', {
        role: 'ADMIN',
      }),
    );

    expect(byRole.users.map((user) => user.id)).toEqual([admin.id]);

    const active = getData(
      await adminClient.query<PaginatedUsers>('/auth/admin/users', {
        isBlocked: false,
      }),
    );

    expect(active.pagination.total).toBe(3);

    const sessions = await adminClient.get<SessionEntity[]>(
      `/auth/admin/users/${player.id}/sessions`,
    );

    expect(sessions.status).toBe(200);
    expect(getData(sessions)).toHaveLength(1);
    expect(getData(sessions)[0].isCurrent).toBe(false);

    const missing = await adminClient.get('/auth/admin/users/unknown');

    expect(missing.status).toBe(404);
    expect(getErrorMessage(missing)).toBe(AUTH_ADMIN_MESSAGES.USER_NOT_FOUND);
  });

  it('блокирует, разблокирует и журналирует действия администратора', async () => {
    const adminClient = getContext().client();
    const playerClient = getContext().client();
    const admin = await createAdmin(adminClient);
    const player = getData(await playerClient.register('Игрок')).user;

    const blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const block = await adminClient.patch<UserEntity>(
      `/auth/admin/users/${player.id}/block`,
      {
        blockReason: 'нарушение правил',
        blockedUntil: blockedUntil.toISOString(),
      },
    );

    expect(block.status).toBe(200);
    expect(getData(block)).toMatchObject({
      id: player.id,
      isBlocked: true,
      blockReason: 'нарушение правил',
    });

    const playerMe = await playerClient.me();

    expect(playerMe.status).toBe(401);

    playerClient.token = null;

    const blockedLogin = await playerClient.login('Игрок');

    expect(blockedLogin.status).toBe(403);
    expect(getErrorMessage(blockedLogin)).toBe(
      AUTH_MESSAGES.USER_BLOCKED(blockedUntil, 'нарушение правил'),
    );

    const repeatedBlock = await adminClient.patch(
      `/auth/admin/users/${player.id}/block`,
      {
        blockReason: 'нарушение правил',
        blockedUntil: blockedUntil.toISOString(),
      },
    );

    expect(repeatedBlock.status).toBe(400);
    expect(getErrorMessage(repeatedBlock)).toBe(
      AUTH_ADMIN_MESSAGES.USER_ALREADY_BLOCKED,
    );

    const blockLog = await getContext().db.adminLog.findFirst({
      where: {
        adminId: admin.id,
        targetUserId: player.id,
        action: ADMIN_LOG_ACTIONS.USER_BLOCKED,
      },
    });

    expect(blockLog).not.toBeNull();
    expect(blockLog?.details).toMatchObject({
      blockReason: 'нарушение правил',
    });

    const unblock = await adminClient.patch<UserEntity>(
      `/auth/admin/users/${player.id}/unblock`,
    );

    expect(getData(unblock)).toMatchObject({
      isBlocked: false,
      blockedUntil: null,
      blockReason: null,
    });

    const unblockLog = await getContext().db.adminLog.findFirst({
      where: {
        adminId: admin.id,
        targetUserId: player.id,
        action: ADMIN_LOG_ACTIONS.USER_UNBLOCKED,
      },
    });

    expect(unblockLog).not.toBeNull();

    const repeatedUnblock = await adminClient.patch(
      `/auth/admin/users/${player.id}/unblock`,
    );

    expect(repeatedUnblock.status).toBe(400);
    expect(getErrorMessage(repeatedUnblock)).toBe(
      AUTH_ADMIN_MESSAGES.USER_NOT_BLOCKED,
    );

    const login = await playerClient.login('Игрок');

    expect(login.status).toBe(201);

    const selfBlock = await adminClient.patch(
      `/auth/admin/users/${admin.id}/block`,
      {
        blockReason: 'самоблокировка',
        blockedUntil: blockedUntil.toISOString(),
      },
    );

    expect(selfBlock.status).toBe(400);
    expect(getErrorMessage(selfBlock)).toBe(
      AUTH_ADMIN_MESSAGES.CANNOT_BLOCK_SELF,
    );

    const pastDate = await adminClient.patch(
      `/auth/admin/users/${player.id}/block`,
      {
        blockReason: 'старая дата',
        blockedUntil: new Date(Date.now() - 60_000).toISOString(),
      },
    );

    expect(pastDate.status).toBe(400);
    expect(getErrorMessage(pastDate)).toContain(
      AUTH_ADMIN_MESSAGES.BLOCKED_UNTIL_VALIDATION.DATE,
    );

    const shortReason = await adminClient.patch(
      `/auth/admin/users/${player.id}/block`,
      {
        blockReason: 'ab',
        blockedUntil: blockedUntil.toISOString(),
      },
    );

    expect(shortReason.status).toBe(400);
    expect(getErrorMessage(shortReason)).toContain(
      AUTH_ADMIN_MESSAGES.BLOCK_REASON_VALIDATION.LENGTH,
    );
  });

  it('отзывает все сессии пользователя', async () => {
    const adminClient = getContext().client();
    const playerClient = getContext().client();
    const admin = await createAdmin(adminClient);
    const player = getData(await playerClient.register('Игрок')).user;

    const revoke = await adminClient.delete(
      `/auth/admin/users/${player.id}/sessions`,
    );

    expect(revoke.status).toBe(200);

    const me = await playerClient.me();

    expect(me.status).toBe(401);

    const sessions = getData(
      await adminClient.get<SessionEntity[]>(
        `/auth/admin/users/${player.id}/sessions`,
      ),
    );

    expect(sessions).toEqual([]);

    const log = await getContext().db.adminLog.findFirst({
      where: {
        adminId: admin.id,
        targetUserId: player.id,
        action: ADMIN_LOG_ACTIONS.USER_SESSIONS_REVOKED,
      },
    });

    expect(log).not.toBeNull();

    expect(
      (await adminClient.delete('/auth/admin/users/unknown/sessions')).status,
    ).toBe(404);
  });

  it('показывает питомцев с владельцем и статистикой, ищет и фильтрует по уровню', async () => {
    const adminClient = getContext().client();
    const playerClient = getContext().client();

    await createAdmin(adminClient);

    const player = getData(await playerClient.register('Игрок')).user;

    const response = await adminClient.query<PaginatedPets>('/admin/pets', {
      search: 'Игрок',
    });

    expect(response.status).toBe(200);

    const list = getData(response);

    expect(list.pagination.total).toBe(1);
    expect(list.pets[0]).toMatchObject({
      name: 'Питомец Игрок',
      level: 1,
      owner: {
        id: player.id,
        nickname: 'Игрок',
        role: 'PLAYER',
        roleLabel: 'Игрок',
        isBlocked: false,
      },
      statistics: { coins: '0', totalClicks: '0' },
    });

    const petId = list.pets[0].id;

    expect((await adminClient.get(`/admin/pets/${petId}`)).status).toBe(200);

    const update = await adminClient.patch<PetAdminEntity>(
      `/admin/pets/${petId}`,
      { level: 7 },
    );

    expect(getData(update).level).toBe(7);

    const filtered = getData(
      await adminClient.query<PaginatedPets>('/admin/pets', {
        minLevel: 7,
        maxLevel: 7,
      }),
    );

    expect(filtered.pagination.total).toBe(1);

    const empty = getData(
      await adminClient.query<PaginatedPets>('/admin/pets', { minLevel: 50 }),
    );

    expect(empty.pagination.total).toBe(0);

    const missing = await adminClient.get('/admin/pets/unknown');

    expect(missing.status).toBe(404);
    expect(getErrorMessage(missing)).toBe(PET_MESSAGES.PET_NOT_FOUND);
  });

  it('обновляет питомца и статистику владельца, сбрасывая кеш игрока', async () => {
    const adminClient = getContext().client();
    const playerClient = getContext().client();

    await createAdmin(adminClient);
    await playerClient.register('Игрок');

    const cached = getData<MeEntity>(await playerClient.me());

    expect(cached.pet?.level).toBe(1);

    const petId = cached.pet?.id as string;

    const update = await adminClient.patch<PetAdminEntity>(
      `/admin/pets/${petId}`,
      {
        name: 'Барсик',
        level: 5,
        xp: 20,
        hunger: 10,
        mood: 20,
      },
    );

    expect(update.status).toBe(200);
    expect(getData(update)).toMatchObject({
      name: 'Барсик',
      level: 5,
      xp: 20,
      hunger: 10,
      mood: 20,
    });

    const stateAfterPet = getData<PetStateEntity>(
      await playerClient.petState(),
    );

    expect(stateAfterPet.pet).toMatchObject({
      name: 'Барсик',
      level: 5,
      xp: 20,
    });

    const statistics = await adminClient.patch<PetAdminEntity>(
      `/admin/pets/${petId}/statistics`,
      {
        coins: 500,
        totalCoinsEarned: 500,
        totalClicks: 7,
        totalFeeds: 3,
        clickPower: 3,
        autoIncome: 0,
      },
    );

    expect(statistics.status).toBe(200);
    expect(getData(statistics).statistics).toMatchObject({
      coins: '500',
      totalCoinsEarned: '500',
      totalClicks: '7',
      totalFeeds: '3',
      clickPower: 3,
    });

    const stateAfterStatistics = getData<PetStateEntity>(
      await playerClient.petState(),
    );

    expect(stateAfterStatistics.stats).toMatchObject({
      coins: '500',
      totalClicks: '7',
      clickPower: 3,
    });

    expect(
      (await adminClient.patch('/admin/pets/unknown', { level: 2 })).status,
    ).toBe(404);
    expect(
      (
        await adminClient.patch('/admin/pets/unknown/statistics', {
          coins: 1,
        })
      ).status,
    ).toBe(404);
  });

  it('управляет каталогом еды: создание, обновление, удаление и конфликты', async () => {
    const adminClient = getContext().client();
    const playerClient = getContext().client();

    await createAdmin(adminClient);

    const player = getData(await playerClient.register('Игрок')).user;

    await updateStatistics(getContext().db, player.id, {
      coins: BigInt(100),
    });

    const created = await adminClient.post<FoodEntity>('/admin/shop/foods', {
      name: 'Пирожок',
      description: 'Свежий пирожок',
      price: 30,
      hungerRestore: 20,
      moodBonus: 4,
    });

    expect(created.status).toBe(201);

    const food = getData(created);

    expect(food).toMatchObject({
      name: 'Пирожок',
      price: 30,
      isActive: false,
    });

    const adminList = getData(
      await adminClient.query<PaginatedFoods>('/admin/shop/foods', {}),
    );

    expect(adminList.pagination.total).toBe(4);

    const publicList = getData(
      await playerClient.query<PaginatedFoods>('/shop/foods', {}),
    );

    expect(publicList.pagination.total).toBe(2);

    const updated = await adminClient.patch<FoodEntity>(
      `/admin/shop/foods/${food.id}`,
      { name: 'Пирожок с вишней', price: 35, isActive: true },
    );

    expect(updated.status).toBe(200);
    expect(getData(updated)).toMatchObject({
      name: 'Пирожок с вишней',
      price: 35,
      isActive: true,
    });

    const publicAfterUpdate = getData(
      await playerClient.query<PaginatedFoods>('/shop/foods', {}),
    );

    expect(publicAfterUpdate.pagination.total).toBe(3);

    const invalidName = await adminClient.post('/admin/shop/foods', {
      name: '',
      price: 10,
      hungerRestore: 10,
      moodBonus: 1,
    });

    expect(invalidName.status).toBe(400);
    expect(getErrorMessage(invalidName)).toContain(
      FOOD_MESSAGES.NAME_VALIDATION.NOT_EMPTY,
    );

    const invalidPrice = await adminClient.post('/admin/shop/foods', {
      name: 'Дешёвая еда',
      price: -1,
      hungerRestore: 10,
      moodBonus: 1,
    });

    expect(invalidPrice.status).toBe(400);
    expect(getErrorMessage(invalidPrice)).toContain(
      FOOD_MESSAGES.PRICE_VALIDATION.MIN,
    );

    const buy = await playerClient.post(`/shop/foods/${FOODS.carrot.id}/buy`, {
      quantity: 1,
    });

    expect(buy.status).toBe(201);

    const conflict = await adminClient.delete(
      `/admin/shop/foods/${FOODS.carrot.id}`,
    );

    expect(conflict.status).toBe(409);
    expect(getErrorMessage(conflict)).toBe(FOOD_MESSAGES.DELETE_CONFLICT);

    const removed = await adminClient.delete(`/admin/shop/foods/${food.id}`);

    expect(removed.status).toBe(200);
    expect((await adminClient.get(`/admin/shop/foods/${food.id}`)).status).toBe(
      404,
    );
  });

  it('управляет каталогом косметики и валидирует слот', async () => {
    const adminClient = getContext().client();
    await createAdmin(adminClient);

    const created = await adminClient.post<CosmeticEntity>(
      '/admin/shop/cosmetics',
      {
        name: 'Цилиндр',
        description: 'Высокий цилиндр',
        price: 75,
        slot: 'HAT',
        rarity: 'RARE',
        isActive: true,
      },
    );

    expect(created.status).toBe(201);
    expect(getData(created)).toMatchObject({
      name: 'Цилиндр',
      slot: 'HAT',
      slotLabel: 'Головной убор',
      rarity: 'RARE',
      rarityLabel: 'Редкая',
      isActive: true,
    });

    const cosmetic = getData(created);

    const updated = await adminClient.patch<CosmeticEntity>(
      `/admin/shop/cosmetics/${cosmetic.id}`,
      { price: 90, isActive: false },
    );

    expect(getData(updated)).toMatchObject({ price: 90, isActive: false });

    const invalidSlot = await adminClient.post('/admin/shop/cosmetics', {
      name: 'Некорректный слот',
      price: 10,
      slot: 'UNKNOWN',
      rarity: 'COMMON',
    });

    expect(invalidSlot.status).toBe(400);
    expect(getErrorMessage(invalidSlot)).toContain(
      COSMETIC_MESSAGES.SLOT_VALIDATION.INVALID,
    );

    expect(
      (await adminClient.delete(`/admin/shop/cosmetics/${cosmetic.id}`)).status,
    ).toBe(200);

    const playerClient = getContext().client();
    const player = getData(await playerClient.register('Игрок')).user;

    await updateStatistics(getContext().db, player.id, {
      coins: BigInt(100),
    });

    expect(
      (await playerClient.post(`/shop/cosmetics/${COSMETICS.cap.id}/buy`))
        .status,
    ).toBe(201);

    const conflict = await adminClient.delete(
      `/admin/shop/cosmetics/${COSMETICS.cap.id}`,
    );

    expect(conflict.status).toBe(409);
    expect(getErrorMessage(conflict)).toBe(COSMETIC_MESSAGES.DELETE_CONFLICT);
  });

  it('управляет каталогом улучшений и отдаёт множитель строкой', async () => {
    const adminClient = getContext().client();
    const playerClient = getContext().client();

    await createAdmin(adminClient);
    const player = getData(await playerClient.register('Игрок')).user;

    const created = await adminClient.post<UpgradeEntity>(
      '/admin/shop/upgrades',
      {
        name: 'Турбо-клик',
        description: 'Ускоряет клик',
        effectType: 'CLICK_POWER',
        effectValue: 5,
        basePrice: 300,
        priceMultiplier: 1.25,
        maxLevel: 5,
      },
    );

    expect(created.status).toBe(201);

    const upgrade = getData(created);

    expect(upgrade).toMatchObject({
      name: 'Турбо-клик',
      effectType: 'CLICK_POWER',
      effectTypeLabel: 'Сила клика',
      priceMultiplier: '1.25',
      maxLevel: 5,
    });

    const adminList = getData(
      await adminClient.query<PaginatedUpgrades>('/admin/shop/upgrades', {}),
    );

    expect(adminList.pagination.total).toBe(3);

    const updated = await adminClient.patch<UpgradeEntity>(
      `/admin/shop/upgrades/${upgrade.id}`,
      { effectValue: 10, priceMultiplier: 2 },
    );

    expect(getData(updated)).toMatchObject({
      effectValue: 10,
      priceMultiplier: '2',
    });

    const invalidEffect = await adminClient.post('/admin/shop/upgrades', {
      name: 'Плохое улучшение',
      effectType: 'UNKNOWN',
      effectValue: 1,
      basePrice: 10,
      priceMultiplier: 1,
      maxLevel: 1,
    });

    expect(invalidEffect.status).toBe(400);
    expect(getErrorMessage(invalidEffect)).toContain(
      UPGRADE_MESSAGES.EFFECT_TYPE_VALIDATION.INVALID,
    );

    await updateStatistics(getContext().db, player.id, {
      coins: BigInt(1000),
    });

    const buy = await playerClient.post(
      `/shop/upgrades/${UPGRADES.click.id}/buy`,
    );

    expect(buy.status).toBe(201);

    const conflict = await adminClient.delete(
      `/admin/shop/upgrades/${UPGRADES.click.id}`,
    );

    expect(conflict.status).toBe(409);
    expect(getErrorMessage(conflict)).toBe(UPGRADE_MESSAGES.DELETE_CONFLICT);

    expect(
      (await adminClient.delete(`/admin/shop/upgrades/${upgrade.id}`)).status,
    ).toBe(200);

    expect(
      (await adminClient.get(`/admin/shop/upgrades/${upgrade.id}`)).status,
    ).toBe(404);
  });

  it('публикует админские изменения каталога сразу в публичном каталоге', async () => {
    const adminClient = getContext().client();
    const playerClient = getContext().client();

    await createAdmin(adminClient);
    await playerClient.register('Игрок');

    const before = getData(
      await playerClient.query<PaginatedCosmetics>('/shop/cosmetics', {}),
    );

    expect(before.pagination.total).toBe(2);

    const created = getData(
      await adminClient.post<CosmeticEntity>('/admin/shop/cosmetics', {
        name: 'Зимний фон',
        price: 120,
        slot: 'BACKGROUND',
        rarity: 'COMMON',
        isActive: true,
      }),
    );

    const after = getData(
      await playerClient.query<PaginatedCosmetics>('/shop/cosmetics', {}),
    );

    expect(after.pagination.total).toBe(3);
    expect(after.cosmetics.map((item) => item.id)).toContain(created.id);

    await adminClient.patch(`/admin/shop/cosmetics/${created.id}`, {
      isActive: false,
    });

    const hidden = getData(
      await playerClient.query<PaginatedCosmetics>('/shop/cosmetics', {}),
    );

    expect(hidden.pagination.total).toBe(2);
  });
});
