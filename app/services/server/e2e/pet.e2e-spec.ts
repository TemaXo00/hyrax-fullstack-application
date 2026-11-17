import { PET_MESSAGES } from '@org/validation-messages';

import { getData, getErrorMessage } from './support/api-client';
import { updatePet, updateStatistics } from './support/database';
import { FOODS, UPGRADES } from './support/fixtures';
import { setupE2e } from './support/setup';

import type { MeEntity, PetStateEntity } from '@org/types';

const getContext = setupE2e();

const WALK_COOLDOWN_PATTERN =
  /^Питомец ещё отдыхает после выгула\. Попробуйте через \d+ сек\.$/;

describe('Pets REST (e2e)', () => {
  it('возвращает состояние питомца нового игрока', async () => {
    const client = getContext().client();
    await client.register('Игрок');

    const response = await client.petState();

    expect(response.status).toBe(200);

    const state = getData<PetStateEntity>(response);

    expect(state.pet).toMatchObject({
      name: 'Питомец Игрок',
      level: 1,
      xp: 0,
      hunger: 100,
      mood: 100,
      moodStatus: 'HAPPY',
    });
    expect(state.stats.coins).toBe('0');
    expect(state.stats.totalClicks).toBe('0');
    expect(state.foodInventory).toEqual([]);
    expect(state.cosmeticInventory).toEqual([]);
    expect(state.upgrades).toEqual([]);
    expect(state.decay.moodPerHour).toBeGreaterThan(0);
    expect(state.decay.hungerPerHour).toBeGreaterThan(0);
    expect(state.autoIncomeCollected).toBe('0');
    expect(Number.isNaN(new Date(state.serverTime).getTime())).toBe(false);
  });

  it('переименовывает питомца и сбрасывает кеш профиля', async () => {
    const client = getContext().client();
    await client.register('Игрок');

    const cached = getData<MeEntity>(await client.me());

    expect(cached.pet?.name).toBe('Питомец Игрок');

    const rename = await client.renamePet('Барсик');

    expect(rename.status).toBe(200);
    expect(getData(rename).name).toBe('Барсик');

    const me = getData<MeEntity>(await client.me());

    expect(me.pet?.name).toBe('Барсик');

    const emptyName = await client.renamePet('');

    expect(emptyName.status).toBe(400);
    expect(getErrorMessage(emptyName)).toContain(
      PET_MESSAGES.NAME_VALIDATION.NOT_EMPTY,
    );
  });

  it('начисляет награду за клик и обновляет кеш профиля', async () => {
    const client = getContext().client();
    await client.register('Игрок');

    const before = getData<MeEntity>(await client.me());

    expect(before.stats?.coins).toBe('0');

    const click = await client.clickPet();

    expect(click.status).toBe(201);

    const result = getData(click);

    expect(result).toMatchObject({
      action: 'CLICK',
      actionLabel: 'Клик по питомцу',
      coinsEarned: '1',
      coinsBalance: '1',
      xpEarned: 2,
      totalClicks: '1',
      leveledUp: false,
      levelsGained: 0,
    });
    expect(result.pet.xp).toBe(2);

    const after = getData<MeEntity>(await client.me());

    expect(after.stats?.coins).toBe('1');
    expect(after.stats?.totalClicks).toBe('1');
  });

  it('выгуливает питомца по количеству кликов и держит кулдаун', async () => {
    const client = getContext().client();
    const user = await client
      .register('Игрок')
      .then((response) => getData(response).user);

    const walk = await client.walkPet(40);

    expect(walk.status).toBe(201);

    const result = getData(walk);

    expect(result).toMatchObject({
      action: 'WALK',
      actionLabel: 'Выгул питомца',
      coinsEarned: '200',
      coinsBalance: '200',
      xpEarned: 10,
    });
    expect(result.pet).toMatchObject({ hunger: 95, mood: 100, xp: 10 });

    const cooldown = await client.walkPet(1);

    expect(cooldown.status).toBe(400);
    expect(getErrorMessage(cooldown)).toMatch(WALK_COOLDOWN_PATTERN);

    await updatePet(getContext().db, user.id, {
      lastWalkAt: new Date(Date.now() - 31_000),
    });

    const repeated = await client.walkPet(1);

    expect(repeated.status).toBe(201);
    expect(getData(repeated).coinsEarned).toBe('5');

    const state = getData<PetStateEntity>(await client.petState());

    expect(state.stats.coins).toBe('205');
    expect(state.pet.hunger).toBe(90);
  });

  it('валидирует количество кликов при выгуле', async () => {
    const client = getContext().client();
    await client.register('Игрок');

    const zero = await client.walkPet(0);

    expect(zero.status).toBe(400);
    expect(getErrorMessage(zero)).toBe(PET_MESSAGES.WALK_CLICKS_VALIDATION.MIN);

    const tooMany = await client.walkPet(1001);

    expect(tooMany.status).toBe(400);
    expect(getErrorMessage(tooMany)).toBe(
      PET_MESSAGES.WALK_CLICKS_VALIDATION.MAX,
    );

    const missing = await client.post('/pets/walk', {});

    expect(missing.status).toBe(400);
    expect(getErrorMessage(missing)).toContain(
      PET_MESSAGES.WALK_CLICKS_VALIDATION.TYPE,
    );

    const notInteger = await client.post('/pets/walk', { clicks: 1.5 });

    expect(notInteger.status).toBe(400);
    expect(getErrorMessage(notInteger)).toContain(
      PET_MESSAGES.WALK_CLICKS_VALIDATION.TYPE,
    );
  });

  it('кормит питомца купленной едой и списывает инвентарь', async () => {
    const client = getContext().client();
    const user = await client
      .register('Игрок')
      .then((response) => getData(response).user);

    await updateStatistics(getContext().db, user.id, {
      coins: BigInt(1000),
    });
    await updatePet(getContext().db, user.id, {
      hunger: 50,
      mood: 50,
      lastHungerAt: new Date(),
      lastMoodAt: new Date(),
    });

    const buy = await client.post('/shop/foods/food-carrot/buy', {
      quantity: 2,
    });

    expect(buy.status).toBe(201);

    const feed = await client.feedPet(FOODS.carrot.id);

    expect(feed.status).toBe(201);

    const result = getData(feed);

    expect(result.action).toBe('FEED');
    expect(result.pet).toMatchObject({
      hunger: 65,
      mood: 52,
      xp: 5,
    });
    expect(result.totalFeeds).toBe('1');
    expect(result.coinsEarned).toBe('0');

    const state = getData<PetStateEntity>(await client.petState());

    expect(state.foodInventory).toHaveLength(1);
    expect(state.foodInventory[0].quantity).toBe(1);
    expect(state.foodInventory[0].food.id).toBe(FOODS.carrot.id);

    const repeat = await client.feedPet(FOODS.carrot.id);

    expect(repeat.status).toBe(201);
    expect(getData(repeat).totalFeeds).toBe('2');

    const empty = await client.feedPet(FOODS.carrot.id);

    expect(empty.status).toBe(400);
    expect(getErrorMessage(empty)).toBe(PET_MESSAGES.STORED_FOOD_NOT_FOUND);
  });

  it('начисляет награду за клик с учётом купленного улучшения', async () => {
    const client = getContext().client();
    const user = await client
      .register('Игрок')
      .then((response) => getData(response).user);

    await updateStatistics(getContext().db, user.id, {
      coins: BigInt(1000),
    });

    const purchase = await client.post(
      `/shop/upgrades/${UPGRADES.click.id}/buy`,
    );

    expect(purchase.status).toBe(201);

    const click = await client.clickPet();

    expect(click.status).toBe(201);
    expect(getData(click).coinsEarned).toBe('2');
  });

  it('не даёт управлять питомцем без токена', async () => {
    const anonymous = getContext().client();

    expect((await anonymous.petState()).status).toBe(401);
    expect((await anonymous.clickPet()).status).toBe(401);
    expect((await anonymous.walkPet(1)).status).toBe(401);
    expect((await anonymous.renamePet('Барсик')).status).toBe(401);
    expect((await anonymous.feedPet(FOODS.carrot.id)).status).toBe(401);
  });
});
