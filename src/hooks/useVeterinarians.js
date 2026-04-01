import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useVeterinarians() {
  return useQuery({
    queryKey: ['veterinarians'],
    queryFn: () => api.get('/veterinarians').then(r => r.data),
  });
}

export function useAddVeterinarian() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/veterinarians', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['veterinarians'] }),
  });
}

export function useUpdateVeterinarian() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/veterinarians/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['veterinarians'] }),
  });
}

export function useDeleteVeterinarian() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.del(`/veterinarians/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['veterinarians'] }),
  });
}
