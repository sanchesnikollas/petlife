import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useRecords(petId, { type, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['records', petId, { type, page, limit }],
    queryFn: () => api.get(`/pets/${petId}/records?${params}`).then(r => r),
    enabled: !!petId,
  });
}

export function useAddRecord(petId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(`/pets/${petId}/records`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['records', petId] });
    },
  });
}

export function useDeleteRecord(petId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.del(`/pets/${petId}/records/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['records', petId] });
    },
  });
}
