import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function usePets() {
  return useQuery({
    queryKey: ['pets'],
    queryFn: () => api.get('/pets'),
  });
}

export function usePetsMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (petData) => api.post('/pets', petData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });

  const update = useMutation({
    mutationFn: ({ petId, data }) => api.patch(`/pets/${petId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });

  const remove = useMutation({
    mutationFn: (petId) => api.del(`/pets/${petId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });

  return { create, update, remove };
}
