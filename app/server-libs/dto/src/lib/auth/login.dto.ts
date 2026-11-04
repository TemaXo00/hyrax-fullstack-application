import { Nickname } from '../decorators/auth/nickname.decorator';
import { Unvalidated } from '../decorators/shared/unvalidated.decorator';

import type { LoginInput } from '@org/types';

export class LoginDto implements LoginInput {
  @Nickname()
  nickname: string;

  @Unvalidated({ required: true, description: 'Пароль' })
  password: string;
}
