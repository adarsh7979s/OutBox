import client from './client';
import type {
  PaginatedResponse,
  EmailListItem,
  ScheduleEmailRequest,
  ScheduleEmailResponse,
  EmailCounts,
  SearchResult,
} from './types';

export async function getScheduledEmails(page = 1, limit = 20): Promise<PaginatedResponse<EmailListItem>> {
  const { data } = await client.get<PaginatedResponse<EmailListItem>>('/emails/scheduled', {
    params: { page, limit },
  });
  return data;
}

export async function getSentEmails(page = 1, limit = 20): Promise<PaginatedResponse<EmailListItem>> {
  const { data } = await client.get<PaginatedResponse<EmailListItem>>('/emails/sent', {
    params: { page, limit },
  });
  return data;
}

export async function getEmailCounts(): Promise<EmailCounts> {
  const { data } = await client.get<EmailCounts>('/emails/counts');
  return data;
}

export async function searchEmails(
  q: string,
  status?: string,
  page = 1,
  limit = 20
): Promise<SearchResult> {
  const { data } = await client.get<SearchResult>('/emails/search', {
    params: { q, status, page, limit },
  });
  return data;
}

export async function scheduleEmails(request: ScheduleEmailRequest): Promise<ScheduleEmailResponse> {
  const { data } = await client.post<ScheduleEmailResponse>('/emails/schedule', request);
  return data;
}

export async function cancelEmail(id: string): Promise<void> {
  await client.delete(`/emails/${id}`);
}
