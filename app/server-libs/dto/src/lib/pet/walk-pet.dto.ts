import { WalkClicks } from '../decorators/pet/walk-clicks.decorator';

import type { WalkPetInput } from '@org/types';

export class WalkPetDto implements WalkPetInput {
  @WalkClicks()
  clicks: number;
}
