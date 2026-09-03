import { redis } from '../config/redis';
import { prisma } from '../config/db';
import { RateLimitResult } from '../types';
import { logger } from '../utils/logger';
import { env } from '../config/env';

/**
 * Redis-backed per-sender hourly rate limiting.
 *
 * Strategy:
 * - Key: `ratelimit:sender:{senderId}:hour:{YYYY-MM-DD-HH}`
 * - Uses Redis INCR (atomic) + EXPIRE (TTL = 3600s)
 * - When limit hit: job is re-delayed to next hour window, NOT dropped
 *
 * This is safe across multiple workers/instances because Redis INCR is atomic.
 */

function getHourKey(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hour = String(now.getUTCHours()).padStart(2, '0');
  return `${year}-${month}-${day}-${hour}`;
}

function getNextHourStart(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(next.getUTCHours() + 1, 0, 0, 0);
  return next;
}

/**
 * Check and increment the rate limit counter for a sender.
 * Returns whether the send is allowed and remaining quota.
 */
export async function checkAndIncrementRateLimit(
  senderId: string
): Promise<RateLimitResult> {
  // Get sender's configured hourly limit
  const sender = await prisma.sender.findUnique({
    where: { id: senderId },
    select: { maxEmailsPerHour: true },
  });

  const limit = sender?.maxEmailsPerHour ?? env.rateLimit.maxPerHourPerSender;
  const hourKey = getHourKey();
  const redisKey = `ratelimit:sender:${senderId}:hour:${hourKey}`;

  // Atomic increment
  const current = await redis.incr(redisKey);

  // Set TTL on first increment
  if (current === 1) {
    await redis.expire(redisKey, 3600);
  }

  const allowed = current <= limit;
  const remaining = Math.max(0, limit - current);

  if (!allowed) {
    // Decrement back since we're not actually sending
    await redis.decr(redisKey);
    logger.warn(
      `Rate limit hit for sender ${senderId}: ${current}/${limit} in hour ${hourKey}`
    );
  }

  return {
    allowed,
    current: allowed ? current : current - 1,
    limit,
    remaining: allowed ? remaining : 0,
    resetAt: getNextHourStart(),
    hourKey,
  };
}

/**
 * Get current rate limit status for a sender (read-only, no increment).
 */
export async function getRateLimitStatus(senderId: string): Promise<{
  current: number;
  limit: number;
  remaining: number;
  resetAt: Date;
}> {
  const sender = await prisma.sender.findUnique({
    where: { id: senderId },
    select: { maxEmailsPerHour: true },
  });

  const limit = sender?.maxEmailsPerHour ?? env.rateLimit.maxPerHourPerSender;
  const hourKey = getHourKey();
  const redisKey = `ratelimit:sender:${senderId}:hour:${hourKey}`;

  const currentStr = await redis.get(redisKey);
  const current = currentStr ? parseInt(currentStr, 10) : 0;

  return {
    current,
    limit,
    remaining: Math.max(0, limit - current),
    resetAt: getNextHourStart(),
  };
}
