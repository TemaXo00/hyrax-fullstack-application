import { LocalName } from '../decorators/auth/local-name.decorator';

import type { ChangeSessionLocalNameInput } from '@org/types';

export class ChangeSessionLocalNameDto implements ChangeSessionLocalNameInput {
  @LocalName()
  localName: string;
}
