import { monolith } from '@org/nest-launcher';

import { AppModule } from './app.module';

void monolith<AppModule>({
  name: 'Server',
  scope: 'Hyrax',
  module: AppModule,
  logs: true,
  prefix: true,
  validation: true,
  responseMap: true,
  errorMap: true,
  compression: true,
  swagger: true,
  cookie: true,
  cors: true,
});
