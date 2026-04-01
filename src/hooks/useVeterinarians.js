import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useVeterinarians() {
  return useQuery({
    queryKey: ['veterinarians'],
    queryFn: () => api.get('/veterinarians'),
  });
}

export function useAddVeterinarian() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/veterinarians', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['veterinarians'] }),
  });
}

export function useUpdateVeterinarian() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/veterinarians/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['veterinarians'] }),
  });
}

export function useDeleteVeterinarian() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.del(`/veterinarians/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['veterinarians'] }),
  });
}
