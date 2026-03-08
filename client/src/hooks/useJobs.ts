import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Job } from '../types';

export const useJobsRealtime = () => {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel('jobs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        qc.invalidateQueries({ queryKey: ['jobs'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'billing_records' }, () => {
        qc.invalidateQueries({ queryKey: ['jobs'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);
};

export const useJobs = (status?: string) =>
  useQuery<Job[]>({
    queryKey: ['jobs', status],
    queryFn: async () => {
      const { data } = await api.get('/jobs', { params: status ? { status } : {} });
      return data.data;
    },
  });

export const useUpdateJob = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch(`/jobs/${jobId}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
};

export const useJob = (id: string) =>
  useQuery<Job>({
    queryKey: ['jobs', id],
    queryFn: async () => {
      const { data } = await api.get(`/jobs/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

export const useCreateJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/jobs', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
};

export const useAssignContractor = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contractorId: string) =>
      api.post(`/jobs/${jobId}/assign`, { contractor_id: contractorId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
};

export const useRespondToJob = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (action: 'accept' | 'reject') =>
      api.patch(`/jobs/${jobId}/respond`, { action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
};

export const useMarkAccepted = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch(`/jobs/${jobId}/mark-accepted`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
};

export const useMarkRejected = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch(`/jobs/${jobId}/mark-rejected`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
};

export const useStartJob = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch(`/jobs/${jobId}/start`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
};

export const useCompleteJob = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      work_description: string;
      labor_cost: number;
      materials?: Array<{ name: string; cost: number }>;
      photo_paths?: string[];
    }) => api.post(`/jobs/${jobId}/complete`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
};

export const useUpdateCompletion = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      work_description: string;
      labor_cost: number;
      materials?: Array<{ name: string; cost: number }>;
      photo_paths?: string[];
    }) => api.patch(`/jobs/${jobId}/completion`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
};

export const useJobPhotos = (jobId: string) =>
  useQuery({
    queryKey: ['jobs', jobId, 'photos'],
    queryFn: async () => {
      const { data } = await api.get(`/jobs/${jobId}/photos`);
      return data.data as Array<{ id: string; storage_path: string; signed_url?: string; uploaded_at: string }>;
    },
    enabled: !!jobId,
  });

export const useBillStrata = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { strata_manager_id: string; amount: number; notes?: string }) =>
      api.post(`/jobs/${jobId}/bill`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
};

export const useCancelJob = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch(`/jobs/${jobId}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
};

export const useUpdateBillingPaymentStatus = (billingId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { payment_status: 'billed' | 'paid' | 'reconciliation'; notes?: string }) =>
      api.patch(`/billing/${billingId}/payment-status`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
};
