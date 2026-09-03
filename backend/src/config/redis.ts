import Redis, { type RedisOptions } from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

/**
 * Options shared by every connection.
 * maxRetriesPerRequest: null and enableReadyCheck: false are required by BullMQ.
 */
const baseOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

/**
 * Build a Redis client.
 *
 * Production (Upstash and most managed providers) supplies a single
 * connection URL. `rediss://` implies TLS, which ioredis enables from the
 * scheme, so no extra tls option is needed.
 *
 * Local development falls back to discrete host/port/password, with TLS
 * only when talking to a non-local host.
 */
function buildRedis(): Redis {
  if (env.redis.url) {
    return new Redis(env.redis.url, baseOptions);
  }

  const isLocal = env.redis.host === 'localhost' || env.redis.host === '127.0.0.1';

  return new Redis({
    ...baseOptions,
    host: env.redis.host,
    port: env.redis.port,
    password: env.redis.password,
    tls: isLocal ? undefined : {},
  });
}

export const redis = buildRedis();

redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('error', (err) => {
  logger.error('❌ Redis connection error:', err);
});

// Separate connection for BullMQ (recommended by BullMQ docs)
export const createRedisConnection = (): Redis => buildRedis();
