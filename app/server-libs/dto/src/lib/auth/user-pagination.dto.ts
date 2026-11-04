import { IsBlocked } from '../decorators/auth/is-blocked.decorator';
import { Role } from '../decorators/auth/role.decorator';
import { PaginationDto } from '../shared/pagination.dto';

import type { UserPaginationInput, UserRole } from '@org/types';

export class UserPaginationDto
  extends PaginationDto
  implements UserPaginationInput
{
  @Role(false)
  role?: UserRole;

  @IsBlocked()
  isBlocked?: boolean;
}
