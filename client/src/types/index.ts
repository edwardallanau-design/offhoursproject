export type UserRole = 'admin' | 'contractor' | 'unit_owner' | 'strata_manager';

export type JobStatus =
  | 'new'
  | 'assigned'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'billed'
  | 'cancelled';

export type ServiceType =
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'locksmith'
  | 'appliance_repair'
  | 'structural'
  | 'other';

export interface Contractor {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string;
  trade: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UnitOwner {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string;
  unit_number: string;
  building: string | null;
  created_at: string;
}

export interface StrataManager {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string;
  company: string | null;
  created_at: string;
}

export interface JobAssignment {
  id: string;
  job_id: string;
  contractor_id: string;
  assigned_at: string;
  contractor?: Contractor;
}

export interface JobCompletion {
  id: string;
  job_id: string;
  work_description: string;
  labor_cost: number;
  materials_cost: number;
  total_amount: number;
  submitted_at: string;
}

export interface JobPhoto {
  id: string;
  job_id: string;
  storage_path: string;
  signed_url?: string;
  uploaded_at: string;
}

export interface BillingRecord {
  id: string;
  job_id: string;
  strata_manager_id: string;
  amount: number;
  notes: string | null;
  billed_at: string;
  strata_manager?: StrataManager;
}

export interface Job {
  id: string;
  unit_owner_id: string | null;
  strata_manager_id: string | null;
  homeowner_name: string;
  homeowner_phone: string;
  homeowner_address: string;
  unit_number: string | null;
  service_type: ServiceType;
  description: string | null;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  // Joined fields
  assignment?: JobAssignment | JobAssignment[] | null;
  completion?: JobCompletion | null;
  billing?: BillingRecord | null;
  photos?: JobPhoto[];
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface SessionResponse {
  user: AuthUser;
  profile: Contractor | UnitOwner | StrataManager | null;
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  hvac: 'HVAC',
  locksmith: 'Locksmith',
  appliance_repair: 'Appliance Repair',
  structural: 'Structural',
  other: 'Other',
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  new: 'New',
  assigned: 'Assigned',
  accepted: 'Accepted',
  rejected: 'Rejected',
  in_progress: 'In Progress',
  completed: 'Completed',
  billed: 'Billed',
  cancelled: 'Cancelled',
};

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  new: 'bg-gray-100 text-gray-700',
  assigned: 'bg-blue-100 text-blue-700',
  accepted: 'bg-indigo-100 text-indigo-700',
  rejected: 'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  billed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-gray-100 text-gray-500',
};
