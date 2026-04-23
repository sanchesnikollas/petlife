import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useMedications(petId) {
  return useQuery({
    queryKey: ['medications', petId],
    queryFn: () => api.get(`/pets/${petId}/medications`).then(r => r.data),
    enabled: !!petId,
  });
}

export function useAddMedication(petId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(`/pets/${petId}/medications`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medications', petId] });
      qc.invalidateQueries({ queryKey: ['records', petId] });
    },
  });
}

export function useUpdateMedication(petId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/pets/${petId}/medications/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medications', petId] });
    },
  });
}

export function useDeleteMedication(petId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.del(`/pets/${petId}/medications/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medications', petId] });
      qc.invalidateQueries({ queryKey: ['records', petId] });
    },
  });
}
