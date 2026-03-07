import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Contractor } from '../types';

export const useContractors = (activeOnly = true) =>
  useQuery<Contractor[]>({
    queryKey: ['contractors', activeOnly],
    queryFn: async () => {
      const { data } = await api.get('/contractors', {
        params: activeOnly ? { is_active: true } : {},
      });
      return data.data;
    },
  });

export const useCreateContractor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/contractors', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contractors'] }),
  });
};

export const useUpdateContractor = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch(`/contractors/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contractors'] }),
  });
};
