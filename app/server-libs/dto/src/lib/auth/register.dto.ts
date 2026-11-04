import { Nickname } from '../decorators/auth/nickname.decorator';
import { Password } from '../decorators/auth/password.decorator';
import { Unvalidated } from '../decorators/shared/unvalidated.decorator';

import type { RegisterInput } from '@org/types';

export class RegisterDto implements RegisterInput {
  @Nickname()
  nickname: string;

  @Password()
  password: string;

  @Unvalidated({ required: true, description: 'Подтверждение пароля' })
  passwordConfirmation: string;
}
