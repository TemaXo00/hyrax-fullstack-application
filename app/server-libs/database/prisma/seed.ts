import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env.HYRAX_DB_URL;

if (!connectionString) {
  throw new Error('Не задана переменная окружения HYRAX_DB_URL');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const FOODS = [
  {
    id: '0194f3f7-6a0a-7c4e-9f1e-7f22f1f5c001',
    name: 'Морковка',
    description: 'Хрустящая морковка для повседневного перекуса',
    price: 10,
    hungerRestore: 15,
    moodBonus: 2,
  },
  {
    id: '0194f3f7-6a0a-7c4e-9f1e-7f22f1f5c002',
    name: 'Яблоко',
    description: 'Сочное яблоко, полезное для настроения',
    price: 25,
    hungerRestore: 30,
    moodBonus: 5,
  },
  {
    id: '0194f3f7-6a0a-7c4e-9f1e-7f22f1f5c003',
    name: 'Рыбка',
    description: 'Любимое лакомство сытого питомца',
    price: 60,
    hungerRestore: 45,
    moodBonus: 10,
  },
  {
    id: '0194f3f7-6a0a-7c4e-9f1e-7f22f1f5c004',
    name: 'Праздничный корм',
    description: 'Особое угощение для особого случая',
    price: 150,
    hungerRestore: 60,
    moodBonus: 25,
  },
] as const;

const COSMETICS = [
  {
    id: '0194f3f7-6a0a-7c4e-9f1e-7f22f1f5d001',
    name: 'Кепка',
    description: 'Простая кепка для прогулок',
    price: 100,
    slot: 'HAT',
    rarity: 'COMMON',
  },
  {
    id: '0194f3f7-6a0a-7c4e-9f1e-7f22f1f5d002',
    name: 'Цилиндр',
    description: 'Элегантный цилиндр для важных выходов',
    price: 250,
    slot: 'HAT',
    rarity: 'RARE',
  },
  {
    id: '0194f3f7-6a0a-7c4e-9f1e-7f22f1f5d003',
    name: 'Солнечные очки',
    description: 'Стильный аксессуар для солнечных дней',
    price: 150,
    slot: 'ACCESSORY',
    rarity: 'COMMON',
  },
  {
    id: '0194f3f7-6a0a-7c4e-9f1e-7f22f1f5d004',
    name: 'Золотая цепь',
    description: 'Заметный аксессуар для уверенных в себе',
    price: 550,
    slot: 'ACCESSORY',
    rarity: 'EPIC',
  },
  {
    id: '0194f3f7-6a0a-7c4e-9f1e-7f22f1f5d005',
    name: 'Закатный фон',
    description: 'Тёплый закат на фоне профиля',
    price: 350,
    slot: 'BACKGROUND',
    rarity: 'RARE',
  },
  {
    id: '0194f3f7-6a0a-7c4e-9f1e-7f22f1f5d006',
    name: 'Космический фон',
    description: 'Звёздное небо для космического питомца',
    price: 600,
    slot: 'BACKGROUND',
    rarity: 'EPIC',
  },
] as const;

const UPGRADES = [
  {
    id: '0194f3f7-6a0a-7c4e-9f1e-7f22f1f5e001',
    name: 'Крепкая лапа',
    description: 'Увеличивает силу клика на 1 за уровень',
    effectType: 'CLICK_POWER',
    effectValue: 1,
    basePrice: 100,
    priceMultiplier: 1.5,
    maxLevel: 20,
  },
  {
    id: '0194f3f7-6a0a-7c4e-9f1e-7f22f1f5e002',
    name: 'Энергичный хвост',
    description: 'Увеличивает силу клика на 2 за уровень',
    effectType: 'CLICK_POWER',
    effectValue: 2,
    basePrice: 500,
    priceMultiplier: 1.55,
    maxLevel: 15,
  },
  {
    id: '0194f3f7-6a0a-7c4e-9f1e-7f22f1f5e003',
    name: 'Автокормушка',
    description: 'Приносит 1 монету в минуту за уровень',
    effectType: 'AUTO_INCOME',
    effectValue: 1,
    basePrice: 250,
    priceMultiplier: 1.6,
    maxLevel: 20,
  },
  {
    id: '0194f3f7-6a0a-7c4e-9f1e-7f22f1f5e004',
    name: 'Уютный дом',
    description: 'Приносит 2 монеты в минуту за уровень',
    effectType: 'AUTO_INCOME',
    effectValue: 2,
    basePrice: 900,
    priceMultiplier: 1.65,
    maxLevel: 15,
  },
] as const;

const DAILY_REWARDS = [
  { dayNumber: 1, rewardCoins: 50 },
  { dayNumber: 2, rewardCoins: 75 },
  {
    dayNumber: 3,
    rewardCoins: 100,
    rewardItemId: '0194f3f7-6a0a-7c4e-9f1e-7f22f1f5d001',
  },
  { dayNumber: 4, rewardCoins: 150 },
  {
    dayNumber: 5,
    rewardCoins: 200,
    rewardItemId: '0194f3f7-6a0a-7c4e-9f1e-7f22f1f5d003',
  },
  { dayNumber: 6, rewardCoins: 250 },
  {
    dayNumber: 7,
    rewardCoins: 500,
    rewardItemId: '0194f3f7-6a0a-7c4e-9f1e-7f22f1f5d002',
  },
] as const;

async function main(): Promise<void> {
  for (const food of FOODS) {
    await prisma.food.upsert({
      where: { id: food.id },
      create: { ...food, isActive: true },
      update: { ...food, isActive: true },
    });
  }

  for (const cosmetic of COSMETICS) {
    await prisma.cosmetic.upsert({
      where: { id: cosmetic.id },
      create: { ...cosmetic, isActive: true },
      update: { ...cosmetic, isActive: true },
    });
  }

  for (const upgrade of UPGRADES) {
    await prisma.upgrade.upsert({
      where: { id: upgrade.id },
      create: upgrade,
      update: upgrade,
    });
  }

  for (const reward of DAILY_REWARDS) {
    await prisma.dailyRewardConfig.upsert({
      where: { dayNumber: reward.dayNumber },
      create: reward,
      update: reward,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    process.stderr.write(`${String(error)}\n`);
    await prisma.$disconnect();
    process.exit(1);
  });
