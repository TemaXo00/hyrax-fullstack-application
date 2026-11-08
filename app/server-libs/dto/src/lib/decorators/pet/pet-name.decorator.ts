import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { GAME_CONFIG } from '@org/validation-config';
import { PET_MESSAGES } from '@org/validation-messages';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export function PetName(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      description: 'Имя питомца',
      example: 'Барсик',
      type: 'string',
      minLength: GAME_CONFIG.PET.NAME_MIN_LENGTH,
      maxLength: GAME_CONFIG.PET.NAME_MAX_LENGTH,
    }),
    IsNotEmpty({ message: PET_MESSAGES.NAME_VALIDATION.NOT_EMPTY }),
    IsString({ message: PET_MESSAGES.NAME_VALIDATION.TYPE }),
    Length(GAME_CONFIG.PET.NAME_MIN_LENGTH, GAME_CONFIG.PET.NAME_MAX_LENGTH, {
      message: PET_MESSAGES.NAME_VALIDATION.LENGTH,
    }),
  );
}
