import client from './client';
import type { User } from './types';

export async function getMe(): Promise<User> {
  const { data } = await client.get<User>('/auth/me');
  return data;
}

export async function logout(): Promise<void> {
  await client.post('/auth/logout');
  localStorage.removeItem('outbox_token');
}
