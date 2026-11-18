import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@org/database';
import { mapDailyReward } from '@org/pet-mappers';
import { DAILY_REWARD_CONFIG } from '@org/validation-config';
import { DAILY_REWARD_MESSAGES } from '@org/validation-messages';

import type { Prisma } from '@org/database';
import type {
  DailyRewardAdminServiceContract,
  DailyRewardEntity,
  UpdateDailyRewardAdminInput,
} from '@org/types';

@Injectable()
export class DailyRewardAdminService implements DailyRewardAdminServiceContract {
  constructor(private readonly db: DatabaseService) {}

  async getRewards(): Promise<DailyRewardEntity[]> {
    const rewards = await this.db.dailyRewardConfig.findMany({
      include: { rewardItem: true },
      orderBy: { dayNumber: 'asc' },
    });

    return rewards.map(mapDailyReward);
  }

  async updateReward(
    dayNumber: number,
    input: UpdateDailyRewardAdminInput,
  ): Promise<DailyRewardEntity> {
    this.validateDayNumber(dayNumber);

    const reward = await this.db.dailyRewardConfig.findUnique({
      where: { dayNumber },
      select: { id: true },
    });

    if (!reward) {
      throw new NotFoundException(DAILY_REWARD_MESSAGES.CONFIG_NOT_FOUND);
    }

    if (input.rewardItemId) {
      const item = await this.db.cosmetic.findUnique({
        where: { id: input.rewardItemId },
        select: { id: true },
      });

      if (!item) {
        throw new NotFoundException(
          DAILY_REWARD_MESSAGES.REWARD_ITEM_NOT_FOUND,
        );
      }
    }

    const data: Prisma.DailyRewardConfigUncheckedUpdateInput = {};

    if (input.rewardCoins !== undefined) {
      data.rewardCoins = input.rewardCoins;
    }

    if (input.rewardItemId !== undefined) {
      data.rewardItemId = input.rewardItemId;
    }

    const updated = await this.db.dailyRewardConfig.update({
      where: { dayNumber },
      data,
      include: { rewardItem: true },
    });

    return mapDailyReward(updated);
  }

  private validateDayNumber(dayNumber: number): void {
    if (
      !Number.isInteger(dayNumber) ||
      dayNumber < DAILY_REWARD_CONFIG.DAY_MIN ||
      dayNumber > DAILY_REWARD_CONFIG.DAY_MAX
    ) {
      throw new BadRequestException(
        `${DAILY_REWARD_MESSAGES.DAY_VALIDATION.MIN}. ${DAILY_REWARD_MESSAGES.DAY_VALIDATION.MAX}`,
      );
    }
  }
}
