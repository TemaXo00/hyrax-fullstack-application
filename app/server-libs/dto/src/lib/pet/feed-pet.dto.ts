import { EntityId } from '../decorators/shop/entity-id.decorator';

import type { FeedPetInput } from '@org/types';

export class FeedPetDto implements FeedPetInput {
  @EntityId('Идентификатор еды из инвентаря')
  foodId: string;
}
