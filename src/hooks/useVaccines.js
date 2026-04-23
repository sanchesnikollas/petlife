import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useVaccines(petId) {
  return useQuery({
    queryKey: ['vaccines', petId],
    queryFn: () => api.get(`/pets/${petId}/vaccines`).then(r => r.data),
    enabled: !!petId,
  });
}

export function useAddVaccine(petId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(`/pets/${petId}/vaccines`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vaccines', petId] });
      qc.invalidateQueries({ queryKey: ['records', petId] });
    },
  });
}

export function useUpdateVaccine(petId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/pets/${petId}/vaccines/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vaccines', petId] });
    },
  });
}

export function useDeleteVaccine(petId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.del(`/pets/${petId}/vaccines/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vaccines', petId] });
      qc.invalidateQueries({ queryKey: ['records', petId] });
    },
  });
}
