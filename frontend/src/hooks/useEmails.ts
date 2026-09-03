import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getScheduledEmails,
  getSentEmails,
  getEmailCounts,
  searchEmails,
  scheduleEmails,
  cancelEmail,
} from '../api/emails';
import type { ScheduleEmailRequest } from '../api/types';
import toast from 'react-hot-toast';

export function useScheduledEmails(page = 1) {
  return useQuery({
    queryKey: ['emails', 'scheduled', page],
    queryFn: () => getScheduledEmails(page),
    staleTime: 10_000,
  });
}

export function useSentEmails(page = 1) {
  return useQuery({
    queryKey: ['emails', 'sent', page],
    queryFn: () => getSentEmails(page),
    staleTime: 10_000,
  });
}

export function useEmailCounts() {
  return useQuery({
    queryKey: ['emails', 'counts'],
    queryFn: getEmailCounts,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useSearchEmails(query: string, status?: string, page = 1) {
  return useQuery({
    queryKey: ['emails', 'search', query, status, page],
    queryFn: () => searchEmails(query, status, page),
    enabled: query.length > 0,
    staleTime: 10_000,
  });
}

export function useScheduleEmails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ScheduleEmailRequest) => scheduleEmails(request),
    onSuccess: (data) => {
      toast.success(`${data.totalScheduled} emails scheduled!`);
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
    onError: (err: Error & { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error ?? 'Failed to schedule emails');
    },
  });
}

export function useCancelEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelEmail(id),
    onSuccess: () => {
      toast.success('Email cancelled');
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
    onError: (err: Error & { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error ?? 'Failed to cancel email');
    },
  });
}
