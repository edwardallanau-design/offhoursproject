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
  uploaded_by: string;
  uploaded_at: string;
  signed_url?: string;
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

// Express request augmentation
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        app_metadata: { role?: UserRole };
      };
      role?: UserRole;
      contractorId?: string;
      unitOwnerId?: string;
      strataManagerId?: string;
    }
  }
}
