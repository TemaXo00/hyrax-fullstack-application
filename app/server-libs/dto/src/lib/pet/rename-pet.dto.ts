import { PetName } from '../decorators/pet/pet-name.decorator';

import type { RenamePetInput } from '@org/types';

export class RenamePetDto implements RenamePetInput {
  @PetName()
  name: string;
}
