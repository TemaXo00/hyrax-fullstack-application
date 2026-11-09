import { BadRequestException, UnauthorizedException } from '@nestjs/common';

import { AuthPasswordService } from './password.service';

describe('AuthPasswordService', () => {
  const service = new AuthPasswordService();

  it('hashes and verifies a password', async () => {
    const hash = await service.hash('Password1!');

    await expect(service.verify(hash, 'Password1!')).resolves.toBe(true);
    await expect(service.verify(hash, 'wrong')).resolves.toBe(false);
  });

  it('throws for an invalid password when verification is required', async () => {
    const hash = await service.hash('Password1!');

    await expect(
      service.verifyOrThrow(hash, 'Password1!'),
    ).resolves.toBeUndefined();
    await expect(service.verifyOrThrow(hash, 'wrong')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a mismatched confirmation', () => {
    expect(() =>
      service.validateConfirmation('Password1!', 'Password2!'),
    ).toThrow(BadRequestException);
  });

  it('rejects reusing the old password', () => {
    expect(() =>
      service.validateNewPassword('Password1!', 'Password1!'),
    ).toThrow(BadRequestException);
  });
});
