export const CONSTANTS = {
  JWT_EXPIRES_IN: '7d',
  BCRYPT_ROUNDS: 10,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
} as const;

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/seamless_solutions',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  API_URL: process.env.API_URL || 'http://localhost:4000',
  WEB_URL: process.env.WEB_URL || 'http://localhost:3000',
} as const;

export const isProd = ENV.NODE_ENV === 'production';
export const isDev = ENV.NODE_ENV === 'development';
export const isTest = ENV.NODE_ENV === 'test';
