import { useMutation } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useCalculateNutrition(petId) {
  return useMutation({
    mutationFn: ({ activityLevel, foodBrandId } = {}) =>
      api.post(`/pets/${petId}/nutrition`, { activityLevel, foodBrandId }).then((r) => r.data),
  });
}
