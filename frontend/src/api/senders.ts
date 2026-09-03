import client from './client';
import type { Sender } from './types';

export async function getSenders(): Promise<Sender[]> {
  const { data } = await client.get<Sender[]>('/senders');
  return data;
}

export async function createSender(body?: {
  email?: string;
  name?: string;
  maxEmailsPerHour?: number;
}): Promise<Sender> {
  const { data } = await client.post<Sender>('/senders', body ?? {});
  return data;
}

export async function deleteSender(id: string): Promise<void> {
  await client.delete(`/senders/${id}`);
}
