import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useWeight(petId) {
  return useQuery({
    queryKey: ['weight', petId],
    queryFn: () => api.get(`/pets/${petId}/weight`).then(r => r.data),
    enabled: !!petId,
  });
}

export function useAddWeight(petId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(`/pets/${petId}/weight`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weight', petId] });
      qc.invalidateQueries({ queryKey: ['pets'] });
    },
  });
}
