import Redis from 'ioredis';
import { ENV } from '@seamless/config';

export const redis = new Redis(ENV.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await redis.quit();
});

// Cache helper functions
export async function cacheGet<T>(key: string): Promise<T | null> {
  const value = await redis.get(key);
  return value ? JSON.parse(value) : null;
}

export async function cacheSet(key: string, value: any, ttl: number = 3600): Promise<void> {
  await redis.set(key, JSON.stringify(value), 'EX', ttl);
}

export async function cacheDelete(key: string): Promise<void> {
  await redis.del(key);
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
