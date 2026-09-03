import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSenders, createSender, deleteSender } from '../api/senders';
import toast from 'react-hot-toast';

export function useSenders() {
  return useQuery({
    queryKey: ['senders'],
    queryFn: getSenders,
    staleTime: 60_000,
  });
}

export function useCreateSender() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body?: { email?: string; name?: string; maxEmailsPerHour?: number }) =>
      createSender(body),
    onSuccess: (sender) => {
      toast.success(`Sender created: ${sender.email}`);
      queryClient.invalidateQueries({ queryKey: ['senders'] });
    },
    onError: (err: Error & { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error ?? 'Failed to create sender');
    },
  });
}

export function useDeleteSender() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSender(id),
    onSuccess: () => {
      toast.success('Sender removed');
      queryClient.invalidateQueries({ queryKey: ['senders'] });
    },
    onError: () => {
      toast.error('Failed to remove sender');
    },
  });
}
