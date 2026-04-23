import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useDewormings(petId) {
  return useQuery({
    queryKey: ['dewormings', petId],
    queryFn: () => api.get(`/pets/${petId}/dewormings`).then(r => r.data),
    enabled: !!petId,
  });
}

export function useAddDeworming(petId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(`/pets/${petId}/dewormings`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dewormings', petId] });
      qc.invalidateQueries({ queryKey: ['records', petId] });
    },
  });
}

export function useUpdateDeworming(petId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/pets/${petId}/dewormings/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dewormings', petId] });
    },
  });
}

export function useDeleteDeworming(petId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.del(`/pets/${petId}/dewormings/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dewormings', petId] });
      qc.invalidateQueries({ queryKey: ['records', petId] });
    },
  });
}
