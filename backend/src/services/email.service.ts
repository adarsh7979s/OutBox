import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/db';
import { addEmailJob } from './queue.service';
import { indexEmail } from './search.service';
import { ScheduleEmailRequest, ScheduleEmailResponse, PaginatedResponse, EmailListItem } from '../types';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
// Re-define EmailStatus to avoid @prisma/client export issues in some IDEs
export type EmailStatus = 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED' | 'RATE_LIMITED' | 'CANCELLED';
/**
 * Schedule a batch of emails.
 *
 * Flow:
 * 1. Validate sender belongs to user
 * 2. For each recipient, create DB record + ES index + BullMQ delayed job
 * 3. Apply inter-email delay to stagger sends
 */
export async function scheduleEmails(
  userId: string,
  request: ScheduleEmailRequest
): Promise<ScheduleEmailResponse> {
  // Verify sender belongs to this user
  const sender = await prisma.sender.findFirst({
    where: { id: request.senderId, userId },
  });

  if (!sender) {
    throw new AppError(404, 'Sender not found or does not belong to you');
  }

  // Update hourly limit if provided
  if (request.hourlyLimit && request.hourlyLimit !== sender.maxEmailsPerHour) {
    await prisma.sender.update({
      where: { id: sender.id },
      data: { maxEmailsPerHour: request.hourlyLimit },
    });
  }

  const batchId = uuidv4();
  const baseScheduledAt = new Date(request.scheduledAt);
  const delayBetweenMs = (request.delayBetweenEmails || 0) * 1000;

  const results: ScheduleEmailResponse['emails'] = [];

  for (let i = 0; i < request.recipients.length; i++) {
    const recipientEmail = request.recipients[i].trim().toLowerCase();

    // Calculate staggered scheduled time
    const scheduledAt = new Date(baseScheduledAt.getTime() + i * delayBetweenMs);
    const delayMs = scheduledAt.getTime() - Date.now();

    // Generate unique idempotency key
    const idempotencyKey = `${batchId}:${recipientEmail}:${scheduledAt.getTime()}`;

    // Create DB record
    const email = await prisma.email.create({
      data: {
        userId,
        senderId: sender.id,
        recipientEmail,
        subject: request.subject,
        body: request.body,
        status: 'SCHEDULED',
        scheduledAt,
        idempotencyKey,
        batchId,
      },
    });

    // Index in Elasticsearch
    await indexEmail({
      id: email.id,
      userId,
      senderId: sender.id,
      senderEmail: sender.email,
      recipientEmail,
      subject: request.subject,
      body: request.body,
      status: 'SCHEDULED',
      scheduledAt: scheduledAt.toISOString(),
      batchId,
      createdAt: email.createdAt.toISOString(),
    });

    // Add BullMQ delayed job
    const bullJobId = await addEmailJob(
      {
        emailId: email.id,
        senderId: sender.id,
        recipientEmail,
        subject: request.subject,
        body: request.body,
      },
      idempotencyKey,
      Math.max(0, delayMs)
    );

    // Store bullJobId reference
    await prisma.email.update({
      where: { id: email.id },
      data: { bullJobId },
    });

    results.push({
      id: email.id,
      recipientEmail,
      scheduledAt: scheduledAt.toISOString(),
      bullJobId,
    });
  }

  logger.info(`Batch ${batchId}: scheduled ${results.length} emails for sender ${sender.email}`);

  return {
    batchId,
    totalScheduled: results.length,
    emails: results,
  };
}

/**
 * Get paginated emails filtered by status.
 */
export async function getEmails(
  userId: string,
  status: EmailStatus | EmailStatus[],
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<EmailListItem>> {
  const statusFilter = Array.isArray(status) ? { in: status } : status;

  const [emails, total] = await Promise.all([
    prisma.email.findMany({
      where: { userId, status: statusFilter },
      include: { sender: { select: { email: true, name: true } } },
      orderBy: { scheduledAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.email.count({
      where: { userId, status: statusFilter },
    }),
  ]);

  const data: EmailListItem[] = emails.map((e: any) => ({
    id: e.id,
    recipientEmail: e.recipientEmail,
    subject: e.subject,
    body: e.body,
    status: e.status,
    scheduledAt: e.scheduledAt.toISOString(),
    sentAt: e.sentAt?.toISOString() || null,
    senderEmail: e.sender.email,
    senderName: e.sender.name,
    batchId: e.batchId,
  }));

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get counts for scheduled and sent emails.
 */
export async function getEmailCounts(userId: string) {
  const [scheduled, sent] = await Promise.all([
    prisma.email.count({
      where: { userId, status: { in: ['SCHEDULED', 'RATE_LIMITED'] } },
    }),
    prisma.email.count({
      where: { userId, status: 'SENT' },
    }),
  ]);

  return { scheduled, sent };
}

/**
 * Cancel a scheduled email.
 */
export async function cancelEmail(
  userId: string,
  emailId: string
): Promise<void> {
  const email = await prisma.email.findFirst({
    where: { id: emailId, userId },
  });

  if (!email) {
    throw new AppError(404, 'Email not found');
  }

  if (email.status !== 'SCHEDULED' && email.status !== 'RATE_LIMITED') {
    throw new AppError(400, `Cannot cancel email with status "${email.status}"`);
  }

  // Remove from BullMQ
  const { emailQueue } = await import('./queue.service');
  if (email.idempotencyKey) {
    const job = await emailQueue.getJob(email.idempotencyKey);
    if (job) {
      await job.remove();
    }
  }

  // Update DB
  await prisma.email.update({
    where: { id: emailId },
    data: { status: 'CANCELLED' },
  });

  logger.info(`Email ${emailId} cancelled`);
}
