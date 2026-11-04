import { BlockReason } from '../decorators/auth/block-reason.decorator';
import { BlockedUntil } from '../decorators/auth/blocked-until.decorator';

import type { BlockUserInput } from '@org/types';

export class BlockUserDto implements BlockUserInput {
  @BlockReason()
  blockReason: string;

  @BlockedUntil()
  blockedUntil: Date;
}
