import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useRoutine(petId) {
  return useQuery({
    queryKey: ['routine', petId],
    queryFn: () => api.get(`/pets/${petId}/routine`).then(r => r.data),
    enabled: !!petId,
  });
}

export function useUpdateRoutine(petId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.patch(`/pets/${petId}/routine`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routine', petId] }),
  });
}
