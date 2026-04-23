import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useFood(petId) {
  return useQuery({
    queryKey: ['food', petId],
    queryFn: () => api.get(`/pets/${petId}/food`).then(r => r.data),
    enabled: !!petId,
  });
}

export function useUpdateFood(petId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.patch(`/pets/${petId}/food`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['food', petId] });
    },
  });
}
