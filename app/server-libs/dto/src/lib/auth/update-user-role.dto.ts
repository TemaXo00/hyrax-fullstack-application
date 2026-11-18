import { Role } from '../decorators/auth/role.decorator';

import type { UpdateUserRoleInput, UserRole } from '@org/types';

export class UpdateUserRoleDto implements UpdateUserRoleInput {
  @Role()
  role: UserRole;
}
