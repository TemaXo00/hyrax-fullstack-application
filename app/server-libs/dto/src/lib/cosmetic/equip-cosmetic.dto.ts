import { Equipped } from '../decorators/shop/equipped.decorator';

import type { EquipCosmeticInput } from '@org/types';

export class EquipCosmeticDto implements EquipCosmeticInput {
  @Equipped()
  equipped: boolean;
}
