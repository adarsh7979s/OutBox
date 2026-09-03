import { Worker, Job, DelayedError } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { EmailJobData } from '../types';
import { checkAndIncrementRateLimit } from './rateLimit.service';
import { sendEmail } from './smtp.service';
import { updateEmailDoc } from './search.service';
import { notifyRateLimitHit } from './slack.service';
import { logger } from '../utils/logger';

let worker: Worker<EmailJobData> | null = null;

/**
 * Start the BullMQ worker to process email sending jobs.
 *
 * Concurrency: Configurable via WORKER_CONCURRENCY env var (default 5).
 * Delay: MIN_SEND_DELAY_MS between sends (default 2000ms) enforced via
 *        BullMQ limiter option.
 */
export function startWorker(): Worker<EmailJobData> {
  const connection = createRedisConnection();

  worker = new Worker<EmailJobData>(
    'email-sending',
    async (job: Job<EmailJobData>) => {
      await processEmailJob(job);
    },
    {
      connection,
      concurrency: env.worker.concurrency,
      limiter: {
        max: 1,
        duration: env.worker.minSendDelayMs, // min delay between sends
      },
    }
  );

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed:`, err);
  });

  worker.on('error', (err) => {
    logger.error('Worker error:', err);
  });

  logger.info(
    `✅ BullMQ worker started (concurrency=${env.worker.concurrency}, delay=${env.worker.minSendDelayMs}ms)`
  );

  return worker;
}

/**
 * Process a single email job.
 *
 * Flow:
 * 1. Idempotency check — skip if already sent
 * 2. Mark as PROCESSING
 * 3. Check per-sender rate limit (Redis-backed)
 * 4. If rate limited → re-delay to next hour window + Slack notify
 * 5. Send via Ethereal SMTP
 * 6. Update DB + Elasticsearch
 */
async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { emailId, senderId, recipientEmail, subject, body } = job.data;

  // 1. Idempotency — check if email exists and hasn't been sent already
  const email = await prisma.email.findUnique({
    where: { id: emailId },
    include: { sender: true },
  });

  if (!email) {
    logger.warn(`Email ${emailId} not found in DB, skipping`);
    return;
  }

  if (email.status === 'SENT') {
    logger.info(`Email ${emailId} already sent, skipping (idempotent)`);
    return;
  }

  if (email.status === 'CANCELLED') {
    logger.info(`Email ${emailId} was cancelled, skipping`);
    return;
  }

  // 2. Mark as processing
  await prisma.email.update({
    where: { id: emailId },
    data: { status: 'PROCESSING' },
  });

  // 3. Check rate limit
  const rateCheck = await checkAndIncrementRateLimit(senderId);

  if (!rateCheck.allowed) {
    // 4. Rate limited — re-delay to next hour window
    const delayMs = rateCheck.resetAt.getTime() - Date.now() + 1000; // +1s buffer

    await prisma.email.update({
      where: { id: emailId },
      data: { status: 'RATE_LIMITED' },
    });

    await updateEmailDoc(emailId, { status: 'RATE_LIMITED' });

    // Notify via Slack
    await notifyRateLimitHit(
      email.userId,
      senderId,
      email.sender.email,
      rateCheck.current,
      rateCheck.limit,
      rateCheck.resetAt
    );

    logger.warn(
      `Rate limited: email ${emailId}, re-delaying ${delayMs}ms to ${rateCheck.resetAt.toISOString()}`
    );

    // Move job to delayed state
    await job.moveToDelayed(Date.now() + delayMs, job.token);
    throw new DelayedError();
  }

  // 5. Send via Ethereal SMTP
  try {
    const result = await sendEmail({
      senderId,
      etherealUser: email.sender.etherealUser,
      etherealPass: email.sender.etherealPass,
      senderName: email.sender.name || email.sender.email,
      senderEmail: email.sender.email,
      recipientEmail,
      subject,
      body,
    });

    // 6. Update DB → SENT
    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // Update Elasticsearch
    await updateEmailDoc(emailId, {
      status: 'SENT',
      sentAt: new Date().toISOString(),
    });

    logger.info(`✉️ Email sent: ${emailId} → ${recipientEmail} (${result.previewUrl})`);
  } catch (error) {
    // Mark as failed
    const failureReason = error instanceof Error ? error.message : 'Unknown error';

    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        failureReason,
        retryCount: { increment: 1 },
      },
    });

    await updateEmailDoc(emailId, { status: 'FAILED' });

    logger.error(`Failed to send email ${emailId}:`, error);
    throw error; // Let BullMQ handle retries
  }
}

/**
 * Gracefully shut down the worker.
 */
export async function stopWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    logger.info('Worker shut down gracefully');
  }
}

/**
 * Recovery: Re-enqueue any emails that were scheduled but missed
 * while the server was down.
 */
export async function recoverMissedJobs(): Promise<number> {
  const { emailQueue } = await import('./queue.service');

  const missedEmails = await prisma.email.findMany({
    where: {
      status: { in: ['SCHEDULED', 'RATE_LIMITED', 'PROCESSING'] },
      scheduledAt: { lte: new Date() },
    },
  });

  let recovered = 0;

  for (const email of missedEmails) {
    try {
      // Check if BullMQ already has this job
      const existingJob = await emailQueue.getJob(email.idempotencyKey);

      if (!existingJob) {
        // Re-enqueue with no delay (send ASAP)
        await emailQueue.add(
          'send-email',
          {
            emailId: email.id,
            senderId: email.senderId,
            recipientEmail: email.recipientEmail,
            subject: email.subject,
            body: email.body,
          },
          {
            jobId: email.idempotencyKey,
            delay: 0,
          }
        );
        recovered++;
        logger.info(`Recovered missed email: ${email.id}`);
      }
    } catch (error) {
      // Job ID might already exist in queue (duplicate key), which is fine
      logger.debug(`Recovery skip for ${email.id}: ${error}`);
    }
  }

  if (recovered > 0) {
    logger.info(`✅ Recovered ${recovered} missed email jobs after restart`);
  }

  return recovered;
}
