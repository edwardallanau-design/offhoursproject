import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { StrataManager } from '../types';

export const useStrataManagers = () =>
  useQuery<StrataManager[]>({
    queryKey: ['strata-managers'],
    queryFn: async () => {
      const { data } = await api.get('/strata-managers');
      return data.data;
    },
  });

export const useCreateStrataManager = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/strata-managers', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['strata-managers'] }),
  });
};
