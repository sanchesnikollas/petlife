import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/me').then(r => r.data),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.patch('/me', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => api.del('/me').then(r => r.data),
  });
}
