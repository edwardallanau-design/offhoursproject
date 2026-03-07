import { supabase } from '../config/supabase';
import { Job, JobStatus, UserRole } from '../types';

// Valid transitions: from → to[]
const ALLOWED_TRANSITIONS: Partial<Record<JobStatus, JobStatus[]>> = {
  new: ['assigned', 'cancelled'],
  assigned: ['accepted', 'rejected', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  rejected: ['assigned', 'cancelled'], // admin can reassign
  in_progress: ['completed'],
  completed: ['billed'],
  billed: [],
  cancelled: [],
};

export const canTransition = (from: JobStatus, to: JobStatus): boolean => {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
};

export const getJobsForRole = async (
  role: UserRole,
  profileId?: string,
  status?: string,
): Promise<Job[]> => {
  let query = supabase
    .from('jobs')
    .select(`
      *,
      assignment:job_assignments(
        id, assigned_at,
        contractor:contractors(id, name, phone, email, trade)
      ),
      completion:job_completions(*),
      billing:billing_records(*, strata_manager:strata_managers(name, email))
    `)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  if (role === 'contractor' && profileId) {
    // Get job IDs assigned to this contractor
    const { data: assignments } = await supabase
      .from('job_assignments')
      .select('job_id')
      .eq('contractor_id', profileId);
    const jobIds = (assignments ?? []).map((a) => a.job_id);
    if (jobIds.length === 0) return [];
    query = query.in('id', jobIds);
  } else if (role === 'unit_owner' && profileId) {
    query = query.eq('unit_owner_id', profileId);
  } else if (role === 'strata_manager' && profileId) {
    query = query.eq('strata_manager_id', profileId);
  }
  // admin gets everything

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const getJobById = async (id: string) => {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      assignment:job_assignments(
        id, assigned_at,
        contractor:contractors(id, name, phone, email, trade)
      ),
      completion:job_completions(*),
      photos:job_photos(*),
      billing:billing_records(*, strata_manager:strata_managers(name, email, phone, company))
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const updateJobStatus = async (id: string, status: JobStatus): Promise<Job> => {
  const { data, error } = await supabase
    .from('jobs')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};
