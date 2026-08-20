import Redis from 'ioredis';

let redis = null;

export const getRedis = () => {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        if (times > 10) {
          console.error('❌ Redis: Max retry attempts reached');
          return null;
        }
        return Math.min(times * 200, 5000);
      },
    });

    redis.on('connect', () => console.log('🔴 Redis connected'));
    redis.on('error', (err) => console.error('❌ Redis error:', err.message));
  }
  return redis;
};

export default getRedis;
