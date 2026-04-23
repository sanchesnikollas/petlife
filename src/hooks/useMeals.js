import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useMeals(petId, date) {
  return useQuery({
    queryKey: ['meals', petId, date],
    queryFn: () => api.get(`/pets/${petId}/meals?date=${date}`).then(r => r.data),
    enabled: !!petId && !!date,
  });
}

export function useLogMeal(petId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(`/pets/${petId}/meals`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meals', petId] });
    },
  });
}
