import { Password } from '../decorators/auth/password.decorator';
import { Unvalidated } from '../decorators/shared/unvalidated.decorator';

import type { ChangePasswordInput } from '@org/types';

export class ChangePasswordDto implements ChangePasswordInput {
  @Unvalidated({ required: true, description: 'Текущий пароль' })
  oldPassword: string;

  @Password()
  newPassword: string;

  @Unvalidated({ required: true, description: 'Подтверждение пароля' })
  newPasswordConfirmation: string;
}
