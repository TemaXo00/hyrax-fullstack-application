import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AUTH_MESSAGES } from '@org/validation-messages';
import * as argon2 from 'argon2';

@Injectable()
export class AuthPasswordService {
  async hash(password: string): Promise<string> {
    return await argon2.hash(password, {
      timeCost: 3,
      memoryCost: 65536,
      parallelism: 4,
      type: argon2.argon2id,
    });
  }

  async verify(passwordHash: string, password: string): Promise<boolean> {
    return await argon2.verify(passwordHash, password);
  }

  async verifyOrThrow(passwordHash: string, password: string): Promise<void> {
    const isValid = await this.verify(passwordHash, password);

    if (!isValid) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }
  }

  validateConfirmation(password: string, passwordConfirmation: string): void {
    if (password !== passwordConfirmation) {
      throw new BadRequestException(AUTH_MESSAGES.PASSWORDS_NOT_SIMILAR);
    }
  }

  validateNewPassword(oldPassword: string, newPassword: string): void {
    if (oldPassword === newPassword) {
      throw new BadRequestException(AUTH_MESSAGES.SAME_PASSWORD);
    }
  }
}
