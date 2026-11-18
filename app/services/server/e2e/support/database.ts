import {
  ALL_ACHIEVEMENTS,
  ALL_UPGRADES,
  DAILY_REWARDS,
  FOODS,
  COSMETICS,
} from './fixtures';

import type { DatabaseService, Prisma } from '@org/database';

const APP_TABLES = [
  'admin_logs',
  'user_achievments',
  'achievments',
  'user_upgrades',
  'upgrades',
  'cosmetic_in_inventory',
  'cosmetics',
  'food_in_inventory',
  'food',
  'login_streaks',
  'sessions',
  'players_statistics',
  'pets',
  'users',
  'daily_reward_config',
];

export async function resetDatabase(db: DatabaseService): Promise<void> {
  const tables = APP_TABLES.map((table) => `"${table}"`).join(', ');

  await db.$executeRawUnsafe(
    `TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`,
  );
  await seedCatalog(db);
}

export async function seedCatalog(db: DatabaseService): Promise<void> {
  await db.food.createMany({
    data: [FOODS.carrot, FOODS.apple, FOODS.inactive],
  });
  await db.cosmetic.createMany({
    data: [COSMETICS.cap, COSMETICS.background, COSMETICS.inactive],
  });
  await db.upgrade.createMany({
    data: ALL_UPGRADES,
  });
  await db.achievment.createMany({
    data: ALL_ACHIEVEMENTS,
  });
  await db.dailyRewardConfig.createMany({
    data: DAILY_REWARDS,
  });
}

export async function promoteToAdmin(
  db: DatabaseService,
  userId: string,
): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { role: 'ADMIN' },
  });
}

export async function updateStatistics(
  db: DatabaseService,
  userId: string,
  data: Prisma.PlayerStatisticUncheckedUpdateInput,
): Promise<void> {
  await db.playerStatistic.update({
    where: { playerId: userId },
    data,
  });
}

export async function updatePet(
  db: DatabaseService,
  userId: string,
  data: Prisma.PetUncheckedUpdateInput,
): Promise<void> {
  await db.pet.update({
    where: { userId },
    data,
  });
}

export async function rewindWalkCooldown(
  db: DatabaseService,
  userId: string,
  seconds = 31,
): Promise<void> {
  await updatePet(db, userId, {
    lastWalkAt: new Date(Date.now() - seconds * 1000),
  });
}

export async function addFoodToInventory(
  db: DatabaseService,
  userId: string,
  foodId: string,
  quantity: number,
): Promise<void> {
  await db.foodInventory.create({
    data: { userId, foodId, quantity },
  });
}
