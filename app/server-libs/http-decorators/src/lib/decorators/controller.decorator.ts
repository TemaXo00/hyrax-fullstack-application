import { applyDecorators, Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

interface IControllerOptions {
  path: string;
  tag: string;
}

export function HTTPController(options: IControllerOptions): ClassDecorator {
  return applyDecorators(ApiTags(options.tag), Controller(options.path));
}
