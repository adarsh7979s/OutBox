/* ── Types shared between API layer and components ── */

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  slackConnected: boolean;
  slackTeamName: string | null;
  createdAt: string;
}

export type EmailStatus = 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED' | 'RATE_LIMITED' | 'CANCELLED';

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

export interface ScheduleEmailRequest {
  senderId: string;
  recipients: string[];
  subject: string;
  body: string;
  scheduledAt: string;
  delayBetweenEmails: number;
  hourlyLimit?: number;
}

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

export interface Sender {
  id: string;
  email: string;
  name: string | null;
  maxEmailsPerHour: number;
  createdAt: string;
}

export interface EmailCounts {
  scheduled: number;
  sent: number;
}

export interface SearchResult {
  results: EmailListItem[];
  total: number;
}

export interface HealthCheck {
  status: string;
  timestamp: string;
  checks: Record<string, { status: string; message?: string }>;
}
