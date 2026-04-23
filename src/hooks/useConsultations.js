import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useConsultations(petId) {
  return useQuery({
    queryKey: ['consultations', petId],
    queryFn: () => api.get(`/pets/${petId}/consultations`).then(r => r.data),
    enabled: !!petId,
  });
}

export function useAddConsultation(petId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(`/pets/${petId}/consultations`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultations', petId] });
      qc.invalidateQueries({ queryKey: ['records', petId] });
    },
  });
}

export function useUpdateConsultation(petId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/pets/${petId}/consultations/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultations', petId] });
    },
  });
}

export function useDeleteConsultation(petId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.del(`/pets/${petId}/consultations/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultations', petId] });
      qc.invalidateQueries({ queryKey: ['records', petId] });
    },
  });
}
