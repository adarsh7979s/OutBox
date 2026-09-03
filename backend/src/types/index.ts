import { EmailStatus } from '@prisma/client';

// ---- API Request Types ----

export interface ScheduleEmailRequest {
  senderId: string;
  recipients: string[];
  subject: string;
  body: string;
  scheduledAt: string; // ISO 8601
  delayBetweenEmails: number; // seconds
  hourlyLimit?: number;
}

export interface CreateSenderRequest {
  email: string;
  name?: string;
  maxEmailsPerHour?: number;
}

// ---- API Response Types ----

export interface ScheduleEmailResponse {
  batchId: string;
  totalScheduled: number;
  emails: {
    id: string;
    recipientEmail: string;
    scheduledAt: string;
    bullJobId: string;
  }[];
}

export interface EmailListItem {
  id: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduledAt: string;
  sentAt: string | null;
  senderEmail: string;
  senderName: string | null;
  batchId: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---- BullMQ Job Types ----

export interface EmailJobData {
  emailId: string;
  senderId: string;
  recipientEmail: string;
  subject: string;
  body: string;
}

// ---- Auth Types ----

export interface JwtPayload {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface User extends JwtPayload {}
  }
}

export interface GoogleProfile {
  id: string;
  displayName: string;
  emails: { value: string; verified: boolean }[];
  photos: { value: string }[];
}

// ---- Rate Limit Types ----

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  hourKey: string;
}
