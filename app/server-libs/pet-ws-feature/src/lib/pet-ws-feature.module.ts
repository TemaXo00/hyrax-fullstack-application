import { Module } from '@nestjs/common';
import { AuthCoreModule } from '@org/auth-core';
import { PetFeatureModule } from '@org/pet-feature';

import { PetGateway } from './pet.gateway';

@Module({
  imports: [AuthCoreModule, PetFeatureModule],
  providers: [PetGateway],
})
export class PetWsFeatureModule {}
