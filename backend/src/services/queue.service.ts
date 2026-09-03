import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { EmailJobData } from '../types';
import { logger } from '../utils/logger';

const connection = createRedisConnection();

export const emailQueue = new Queue<EmailJobData>('email-sending', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 1000,  // Keep last 1000 completed jobs
    },
    removeOnFail: {
      count: 5000,  // Keep last 5000 failed jobs
    },
  },
});

emailQueue.on('error', (err) => {
  logger.error('Email queue error:', err);
});

/**
 * Add a delayed email job to the queue.
 * Uses idempotencyKey as the jobId to prevent duplicate jobs.
 */
export async function addEmailJob(
  data: EmailJobData,
  idempotencyKey: string,
  delayMs: number
): Promise<string> {
  const job = await emailQueue.add('send-email', data, {
    jobId: idempotencyKey,
    delay: Math.max(0, delayMs),
  });

  logger.debug(`Job added: ${job.id} with delay ${delayMs}ms`);
  return job.id!;
}

/**
 * Get the current job counts by state
 */
export async function getQueueCounts() {
  return emailQueue.getJobCounts(
    'active',
    'completed',
    'delayed',
    'failed',
    'paused',
    'waiting'
  );
}
