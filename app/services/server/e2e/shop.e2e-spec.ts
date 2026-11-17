import {
  COSMETIC_MESSAGES,
  FOOD_MESSAGES,
  SHOP_MESSAGES,
  UPGRADE_MESSAGES,
} from '@org/validation-messages';

import { getData, getErrorMessage } from './support/api-client';
import { updateStatistics } from './support/database';
import { COSMETICS, FOODS, UPGRADES } from './support/fixtures';
import { setupE2e } from './support/setup';

import type { ApiClient } from './support/api-client';
import type { MeEntity, PetStateEntity } from '@org/types';

const getContext = setupE2e();

interface Paginated<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    search?: string;
  };
  foods?: T[];
  cosmetics?: T[];
  upgrades?: T[];
}

async function createPlayerWithCoins(
  client: ApiClient,
  coins = 1000,
): Promise<string> {
  const user = await client
    .register('Игрок')
    .then((response) => getData(response).user);

  await updateStatistics(getContext().db, user.id, {
    coins: BigInt(coins),
  });

  return user.id;
}

describe('Shop REST (e2e)', () => {
  it('показывает в каталоге еды только активные позиции', async () => {
    const client = getContext().client();
    await client.register('Игрок');

    const response = await client.query<Paginated<unknown>>('/shop/foods', {
      page: 1,
      limit: 10,
    });

    expect(response.status).toBe(200);

    const data = getData(response);

    expect(data.foods?.map((food) => (food as { id: string }).id)).toEqual([
      FOODS.carrot.id,
      FOODS.apple.id,
    ]);
    expect(data.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });

    const search = getData(
      await client.query<Paginated<unknown>>('/shop/foods', {
        search: 'Морк',
      }),
    );

    expect(search.foods).toHaveLength(1);
    expect(search.pagination.search).toBe('Морк');

    const tooShortSearch = await client.query('/shop/foods', { search: 'Мо' });

    expect(tooShortSearch.status).toBe(400);
  });

  it('покупает еду и накапливает инвентарь', async () => {
    const client = getContext().client();
    await createPlayerWithCoins(client, 100);

    const purchase = await client.post<{
      inventory: { quantity: number; food: { id: string } };
      spentCoins: string;
      coinsBalance: string;
    }>(`/shop/foods/${FOODS.carrot.id}/buy`, { quantity: 3 });

    expect(purchase.status).toBe(201);
    expect(getData(purchase)).toMatchObject({
      inventory: { quantity: 3, food: { id: FOODS.carrot.id } },
      spentCoins: '30',
      coinsBalance: '70',
    });

    const repeated = await client.post<{
      inventory: { quantity: number };
      spentCoins: string;
      coinsBalance: string;
    }>(`/shop/foods/${FOODS.carrot.id}/buy`, { quantity: 1 });

    expect(getData(repeated)).toMatchObject({
      inventory: { quantity: 4 },
      spentCoins: '10',
      coinsBalance: '60',
    });
  });

  it('отклоняет покупку еды без монет, неактивной и несуществующей позиции', async () => {
    const client = getContext().client();
    await createPlayerWithCoins(client, 5);

    const insufficient = await client.post(
      `/shop/foods/${FOODS.carrot.id}/buy`,
      { quantity: 1 },
    );

    expect(insufficient.status).toBe(400);
    expect(getErrorMessage(insufficient)).toBe(
      SHOP_MESSAGES.INSUFFICIENT_COINS(10, '5'),
    );

    const inactive = await client.post(`/shop/foods/${FOODS.inactive.id}/buy`, {
      quantity: 1,
    });

    expect(inactive.status).toBe(400);
    expect(getErrorMessage(inactive)).toBe(FOOD_MESSAGES.INACTIVE);

    const missing = await client.post('/shop/foods/unknown/buy', {
      quantity: 1,
    });

    expect(missing.status).toBe(404);
    expect(getErrorMessage(missing)).toBe(FOOD_MESSAGES.NOT_FOUND);

    const invalidQuantity = await client.post(
      `/shop/foods/${FOODS.carrot.id}/buy`,
      { quantity: 0 },
    );

    expect(invalidQuantity.status).toBe(400);
    expect(getErrorMessage(invalidQuantity)).toBe(
      FOOD_MESSAGES.QUANTITY_VALIDATION.MIN,
    );
  });

  it('покупает и экипирует косметику с учётом слота', async () => {
    const client = getContext().client();
    const userId = await createPlayerWithCoins(client, 1000);

    await getContext().db.cosmetic.create({
      data: {
        id: 'cosmetic-cap-2',
        name: 'Шляпа',
        description: 'Вторая шляпа',
        price: 10,
        slot: 'HAT',
        rarity: 'RARE',
        isActive: true,
      },
    });

    const catalog = getData(
      await client.query<Paginated<unknown>>('/shop/cosmetics', {}),
    );

    expect(catalog.cosmetics).toHaveLength(3);

    const buyFirst = await client.post(
      `/shop/cosmetics/${COSMETICS.cap.id}/buy`,
    );

    expect(buyFirst.status).toBe(201);

    const duplicate = await client.post(
      `/shop/cosmetics/${COSMETICS.cap.id}/buy`,
    );

    expect(duplicate.status).toBe(400);
    expect(getErrorMessage(duplicate)).toBe(COSMETIC_MESSAGES.ALREADY_OWNED);

    const buySecond = await client.post('/shop/cosmetics/cosmetic-cap-2/buy');

    expect(buySecond.status).toBe(201);

    const equipFirst = await client.patch<{ isEquipped: boolean }>(
      `/shop/cosmetics/${COSMETICS.cap.id}/equip`,
      { equipped: true },
    );

    expect(getData(equipFirst).isEquipped).toBe(true);

    const equipSecond = await client.patch<{ isEquipped: boolean }>(
      '/shop/cosmetics/cosmetic-cap-2/equip',
      { equipped: true },
    );

    expect(getData(equipSecond).isEquipped).toBe(true);

    const state = getData<PetStateEntity>(await client.petState());

    expect(
      state.cosmeticInventory.find(
        (item) => item.cosmetic.id === COSMETICS.cap.id,
      )?.isEquipped,
    ).toBe(false);
    expect(
      state.cosmeticInventory.find(
        (item) => item.cosmetic.id === 'cosmetic-cap-2',
      )?.isEquipped,
    ).toBe(true);

    const unequip = await client.patch<{ isEquipped: boolean }>(
      '/shop/cosmetics/cosmetic-cap-2/equip',
      { equipped: false },
    );

    expect(getData(unequip).isEquipped).toBe(false);

    const notOwned = await client.patch(
      `/shop/cosmetics/${COSMETICS.background.id}/equip`,
      { equipped: true },
    );

    expect(notOwned.status).toBe(404);
    expect(getErrorMessage(notOwned)).toBe(COSMETIC_MESSAGES.NOT_OWNED);

    const me = getData<MeEntity>(await client.me());

    expect(me.cosmeticInventory).toHaveLength(2);
    expect(me.stats?.coins).toBe('940');
    expect(userId).toBe(me.id);
  });

  it('не продаёт неактивную косметику', async () => {
    const client = getContext().client();
    await createPlayerWithCoins(client, 1000);

    const inactive = await client.post(
      `/shop/cosmetics/${COSMETICS.inactive.id}/buy`,
    );

    expect(inactive.status).toBe(400);
    expect(getErrorMessage(inactive)).toBe(COSMETIC_MESSAGES.INACTIVE);

    const missing = await client.post('/shop/cosmetics/unknown/buy');

    expect(missing.status).toBe(404);
    expect(getErrorMessage(missing)).toBe(COSMETIC_MESSAGES.NOT_FOUND);
  });

  it('показывает улучшения с уровнями и ценой следующего уровня', async () => {
    const client = getContext().client();
    await client.register('Игрок');

    const response = await client.query<Paginated<unknown>>(
      '/shop/upgrades',
      {},
    );

    expect(response.status).toBe(200);

    const upgrades = getData(response).upgrades as Array<{
      id: string;
      priceMultiplier: string;
      ownedLevel: number;
      nextLevelPrice: number;
      isMaxLevel: boolean;
    }>;

    expect(upgrades).toHaveLength(2);
    expect(upgrades[0]).toMatchObject({
      id: UPGRADES.click.id,
      priceMultiplier: '1.5',
      ownedLevel: 0,
      nextLevelPrice: 100,
      isMaxLevel: false,
    });
    expect(upgrades[1]).toMatchObject({
      id: UPGRADES.auto.id,
      nextLevelPrice: 200,
    });
  });

  it('покупает уровни улучшения и применяет эффект к статистике', async () => {
    const client = getContext().client();
    await createPlayerWithCoins(client, 1000);

    const first = await client.post<{
      userUpgrade: { level: number };
      spentCoins: string;
      coinsBalance: string;
    }>(`/shop/upgrades/${UPGRADES.click.id}/buy`);

    expect(first.status).toBe(201);
    expect(getData(first)).toMatchObject({
      userUpgrade: { level: 1 },
      spentCoins: '100',
      coinsBalance: '900',
    });

    const state = getData<PetStateEntity>(await client.petState());

    expect(state.stats.clickPower).toBe(2);
    expect(state.upgrades).toHaveLength(1);

    const second = getData(
      await client.post<{
        userUpgrade: { level: number };
        spentCoins: string;
        coinsBalance: string;
      }>(`/shop/upgrades/${UPGRADES.click.id}/buy`),
    );

    expect(second).toMatchObject({
      userUpgrade: { level: 2 },
      spentCoins: '150',
      coinsBalance: '750',
    });

    const third = getData(
      await client.post<{
        userUpgrade: { level: number };
        spentCoins: string;
        coinsBalance: string;
      }>(`/shop/upgrades/${UPGRADES.click.id}/buy`),
    );

    expect(third).toMatchObject({
      userUpgrade: { level: 3 },
      spentCoins: '225',
      coinsBalance: '525',
    });

    const catalog = getData(
      await client.query<Paginated<unknown>>('/shop/upgrades', {}),
    );
    const clickUpgrade = (
      catalog.upgrades as Array<{
        id: string;
        ownedLevel: number;
        nextLevelPrice: number;
        isMaxLevel: boolean;
      }>
    ).find((upgrade) => upgrade.id === UPGRADES.click.id);

    expect(clickUpgrade).toMatchObject({
      ownedLevel: 3,
      nextLevelPrice: 0,
      isMaxLevel: true,
    });

    const maxLevel = await client.post(
      `/shop/upgrades/${UPGRADES.click.id}/buy`,
    );

    expect(maxLevel.status).toBe(400);
    expect(getErrorMessage(maxLevel)).toBe(
      UPGRADE_MESSAGES.MAX_LEVEL_REACHED_WITH_VALUE(3),
    );
  });

  it('отклоняет покупку улучшения без монет и неизвестного улучшения', async () => {
    const client = getContext().client();
    await createPlayerWithCoins(client, 0);

    const insufficient = await client.post(
      `/shop/upgrades/${UPGRADES.click.id}/buy`,
    );

    expect(insufficient.status).toBe(400);
    expect(getErrorMessage(insufficient)).toBe(
      SHOP_MESSAGES.INSUFFICIENT_COINS(100, '0'),
    );

    const missing = await client.post('/shop/upgrades/unknown/buy');

    expect(missing.status).toBe(404);
    expect(getErrorMessage(missing)).toBe(UPGRADE_MESSAGES.NOT_FOUND);
  });

  it('требует авторизацию для каталогов и покупок', async () => {
    const anonymous = getContext().client();

    expect((await anonymous.query('/shop/foods', {})).status).toBe(401);
    expect((await anonymous.query('/shop/cosmetics', {})).status).toBe(401);
    expect((await anonymous.query('/shop/upgrades', {})).status).toBe(401);
    expect(
      (
        await anonymous.post(`/shop/foods/${FOODS.carrot.id}/buy`, {
          quantity: 1,
        })
      ).status,
    ).toBe(401);
  });
});
