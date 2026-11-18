import { Body, Param } from '@nestjs/common';
import { DailyRewardResponseDto, UpdateDailyRewardAdminDto } from '@org/dto';
import {
  GETProtectedMethod,
  HTTPController,
  PATCHProtectedMethod,
} from '@org/http-decorators';
import { DAILY_REWARD_ADMIN_ROUTES } from '@org/types';
import { DAILY_REWARD_MESSAGES } from '@org/validation-messages';

import { DailyRewardAdminService } from './daily-reward-admin.service';

import type { DailyRewardEntity } from '@org/types';

@HTTPController({
  path: DAILY_REWARD_ADMIN_ROUTES.BASE,
  tag: 'Daily rewards / Admin',
})
export class DailyRewardAdminController {
  constructor(private readonly service: DailyRewardAdminService) {}

  @GETProtectedMethod({
    path: DAILY_REWARD_ADMIN_ROUTES.LIST,
    summary: 'Календарь ежедневных наград',
    operationDesc:
      'Возвращает все дни календаря ежедневных наград. Доступно только администраторам. Возвращаемый тип данных - DailyRewardEntity[].',
    responseDto: DailyRewardResponseDto,
    responseIsArray: true,
    roles: ['ADMIN'],
  })
  async getRewards(): Promise<DailyRewardEntity[]> {
    return await this.service.getRewards();
  }

  @PATCHProtectedMethod({
    path: DAILY_REWARD_ADMIN_ROUTES.ITEM,
    summary: 'Обновление ежедневной награды',
    operationDesc:
      'Меняет монеты и предмет награды за указанный день. Доступно только администраторам. Возвращаемый тип данных - DailyRewardEntity.',
    requestDto: UpdateDailyRewardAdminDto,
    responseDto: DailyRewardResponseDto,
    errors: [
      {
        status: 404,
        description: 'Конфигурация награды или предмет не найдены',
        message: DAILY_REWARD_MESSAGES.CONFIG_NOT_FOUND,
      },
    ],
    roles: ['ADMIN'],
  })
  async updateReward(
    @Param('dayNumber') dayNumber: string,
    @Body() dto: UpdateDailyRewardAdminDto,
  ): Promise<DailyRewardEntity> {
    return await this.service.updateReward(Number(dayNumber), dto);
  }
}
