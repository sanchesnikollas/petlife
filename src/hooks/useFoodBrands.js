import { useQuery } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useFoodBrands({ species, q, type, ageRange, sizeRange } = {}) {
  return useQuery({
    queryKey: ['food-brands', { species, q, type, ageRange, sizeRange }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (species) params.set('species', species);
      if (q) params.set('q', q);
      if (type) params.set('type', type);
      if (ageRange) params.set('ageRange', ageRange);
      if (sizeRange) params.set('sizeRange', sizeRange);
      const qs = params.toString();
      return api.get(`/food-brands${qs ? '?' + qs : ''}`).then((r) => r.data);
    },
    staleTime: 5 * 60 * 1000,
  });
}
