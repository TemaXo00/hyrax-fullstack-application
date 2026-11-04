import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

interface UnvalidatedOptions {
  description: string;
  required: boolean;
}

export function Unvalidated(options: UnvalidatedOptions): PropertyDecorator {
  const requiredDecorator = options.required ? IsNotEmpty() : IsOptional();

  return applyDecorators(
    ApiProperty({
      description: options.description,
      required: options.required,
    }),
    requiredDecorator,
  );
}
