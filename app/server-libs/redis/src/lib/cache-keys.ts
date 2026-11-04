export const CACHE_KEYS = {
  authSession: (userId: string, sessionId: string): string =>
    `hyrax:auth:session:${userId}:${sessionId}`,
  authSessionPrefix: (userId: string): string =>
    `hyrax:auth:session:${userId}:`,
  me: (userId: string): string => `hyrax:auth:me:${userId}`,
  adminUser: (userId: string): string => `hyrax:auth:admin:user:${userId}`,
  adminUsers: (query: unknown): string =>
    `hyrax:auth:admin:users:${Buffer.from(JSON.stringify(query)).toString('base64url')}`,
  adminUsersPrefix: (): string => 'hyrax:auth:admin:users:',
} as const;
