import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

export const redis = new Redis({
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password,
  tls: env.redis.host !== 'localhost' ? {} : undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
});

redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('error', (err) => {
  logger.error('❌ Redis connection error:', err);
});

// Separate connection for BullMQ (recommended by BullMQ docs)
export const createRedisConnection = () => {
  return new Redis({
    host: env.redis.host,
    port: env.redis.port,
    password: env.redis.password,
    tls: env.redis.host !== 'localhost' ? {} : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
};
