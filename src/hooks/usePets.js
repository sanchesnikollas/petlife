import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function usePets() {
  return useQuery({
    queryKey: ['pets'],
    queryFn: () => api.get('/pets').then(r => r.data),
  });
}

export function usePetsMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (petData) => api.post('/pets', petData).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });

  const update = useMutation({
    mutationFn: ({ petId, data }) => api.patch(`/pets/${petId}`, data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });

  const remove = useMutation({
    mutationFn: (petId) => api.del(`/pets/${petId}`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });

  return { create, update, remove };
}
