export interface MonolithEnvVariablesResponse {
  IS_DEV: boolean;
  APP_PORT: number;
  WINDOW_MS: number;
  REQUEST_LIMIT: number;
  CORS_ORIGINS: string[];
}
