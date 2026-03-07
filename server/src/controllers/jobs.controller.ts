import { Request, Response } from 'express';
import { z } from 'zod';

// Express v5 types params as string | string[] — helper to extract
const param = (req: Request, key: string): string => req.params[key] as string;
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { getJobsForRole, getJobById, updateJobStatus, canTransition } from '../services/jobs.service';
import {
  notifyContractorAssigned,
  notifyAdminContractorResponse,
  notifyAdminJobCompleted,
  notifyStrataManager,
  notifyUnitOwner,
} from '../services/notification.service';
import { JobStatus } from '../types';

const createJobSchema = z.object({
  homeowner_name: z.string().min(1),
  homeowner_phone: z.string().min(1),
  homeowner_address: z.string().min(1),
  unit_number: z.string().optional(),
  service_type: z.enum(['plumbing', 'electrical', 'hvac', 'locksmith', 'appliance_repair', 'structural', 'other']),
  description: z.string().optional(),
  strata_manager_id: z.string().uuid().optional(),
});

const completeJobSchema = z.object({
  work_description: z.string().min(1),
  labor_cost: z.number().min(0),
  materials_cost: z.number().min(0),
  photo_paths: z.array(z.string()).optional(),
});

const billSchema = z.object({
  strata_manager_id: z.string().uuid(),
  amount: z.number().min(0),
  notes: z.string().optional(),
});

// GET /api/jobs
export const listJobs = async (req: Request, res: Response) => {
  const { status } = req.query;
  const jobs = await getJobsForRole(
    req.role!,
    req.contractorId ?? req.unitOwnerId ?? req.strataManagerId,
    status as string | undefined,
  );
  sendSuccess(res, jobs);
};

// POST /api/jobs
export const createJob = async (req: Request, res: Response) => {
  const body = createJobSchema.parse(req.body);

  // If unit owner is creating via portal, attach their profile
  const unitOwnerId = req.role === 'unit_owner' ? req.unitOwnerId : undefined;

  const { data, error } = await supabase
    .from('jobs')
    .insert({ ...body, unit_owner_id: unitOwnerId ?? null, status: 'new' })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Notify admin
  const { data: adminUsers } = await supabase.auth.admin.listUsers();
  const admins = adminUsers?.users?.filter((u) => u.app_metadata?.role === 'admin') ?? [];
  for (const admin of admins) {
    await supabase.from('push_subscriptions').select('user_id').eq('user_id', admin.id);
    // Push notification to admin
    const { sendWebPush } = await import('../services/webpush.service');
    await sendWebPush(
      admin.id,
      'New Service Request',
      `${data.homeowner_name} — ${data.service_type.replace('_', ' ')}`,
      { jobId: data.id, path: `/admin/jobs/${data.id}` },
    ).catch(() => {});
  }

  sendSuccess(res, data, 201);
};

// GET /api/jobs/:id
export const getJob = async (req: Request, res: Response) => {
  const job = await getJobById(param(req, 'id'));
  if (!job) return sendError(res, 404, 'Job not found', 'NOT_FOUND');
  sendSuccess(res, job);
};

// POST /api/jobs/:id/assign
export const assignContractor = async (req: Request, res: Response) => {
  const { contractor_id } = z.object({ contractor_id: z.string().uuid() }).parse(req.body);
  const jobId = param(req, 'id');

  const job = await getJobById(jobId);
  if (!job) return sendError(res, 404, 'Job not found', 'NOT_FOUND');

  if (!canTransition(job.status, 'assigned')) {
    return sendError(res, 400, `Cannot assign a job with status "${job.status}"`, 'INVALID_TRANSITION');
  }

  const { data: contractor, error: cErr } = await supabase
    .from('contractors')
    .select('*, user_id')
    .eq('id', contractor_id)
    .single();

  if (cErr || !contractor) return sendError(res, 404, 'Contractor not found', 'NOT_FOUND');

  // Remove old assignment if any
  await supabase.from('job_assignments').delete().eq('job_id', jobId);

  // Insert new assignment + update status
  const [{ data: assignment, error: aErr }] = await Promise.all([
    supabase.from('job_assignments').insert({ job_id: jobId, contractor_id }).select().single(),
    updateJobStatus(jobId, 'assigned'),
  ]);

  if (aErr) throw new Error(aErr.message);

  // Get updated job
  const updatedJob = await getJobById(jobId);

  // Notify contractor
  const notifications = await notifyContractorAssigned(contractor, contractor.user_id, updatedJob);

  // Notify strata manager if linked
  if (updatedJob.strata_manager_id) {
    const { data: sm } = await supabase
      .from('strata_managers')
      .select('*, user_id')
      .eq('id', updatedJob.strata_manager_id)
      .single();
    if (sm) {
      await notifyStrataManager(
        sm,
        sm.user_id,
        'Work Order Lodged',
        `A service request has been lodged for ${updatedJob.homeowner_address}.\nService: ${updatedJob.service_type}\nA contractor has been assigned and will be in contact shortly.`,
        jobId,
      ).catch(() => {});
    }
  }

  sendSuccess(res, { assignment, job: updatedJob, notifications });
};

// PATCH /api/jobs/:id/respond  (contractor accepts or rejects)
export const respondToJob = async (req: Request, res: Response) => {
  const { action } = z.object({ action: z.enum(['accept', 'reject']) }).parse(req.body);
  const jobId = param(req, 'id');

  const job = await getJobById(jobId);
  if (!job) return sendError(res, 404, 'Job not found', 'NOT_FOUND');

  // Verify contractor is assigned to this job
  const assignment = Array.isArray(job.assignment) ? job.assignment[0] : job.assignment;
  if (!assignment || assignment.contractor?.id !== req.contractorId) {
    return sendError(res, 403, 'You are not assigned to this job', 'FORBIDDEN');
  }

  const newStatus: JobStatus = action === 'accept' ? 'accepted' : 'rejected';
  if (!canTransition(job.status, newStatus)) {
    return sendError(res, 400, `Cannot ${action} a job with status "${job.status}"`, 'INVALID_TRANSITION');
  }

  const updatedJob = await updateJobStatus(jobId, newStatus);

  // Notify admin of response
  const { data: adminUsers } = await supabase.auth.admin.listUsers();
  const admins = adminUsers?.users?.filter((u) => u.app_metadata?.role === 'admin') ?? [];
  for (const admin of admins) {
    await notifyAdminContractorResponse(
      admin.phone ?? '',
      admin.email ?? '',
      admin.id,
      assignment.contractor,
      job,
      action === 'accept' ? 'accepted' : 'rejected',
    ).catch(() => {});
  }

  // If accepted, notify unit owner
  if (action === 'accept' && job.unit_owner_id) {
    const { data: owner } = await supabase
      .from('unit_owners')
      .select('*, user_id')
      .eq('id', job.unit_owner_id)
      .single();
    if (owner) {
      await notifyUnitOwner(
        owner,
        owner.user_id,
        'Contractor Assigned',
        `A contractor has accepted your service request and will be in touch shortly.`,
        jobId,
      ).catch(() => {});
    }
  }

  sendSuccess(res, updatedJob);
};

// PATCH /api/jobs/:id/mark-accepted  (admin proxy)
export const markAccepted = async (req: Request, res: Response) => {
  const jobId = param(req, 'id');
  const job = await getJobById(jobId);
  if (!job) return sendError(res, 404, 'Job not found', 'NOT_FOUND');
  if (!canTransition(job.status, 'accepted')) {
    return sendError(res, 400, `Cannot mark accepted from status "${job.status}"`, 'INVALID_TRANSITION');
  }
  const updated = await updateJobStatus(jobId, 'accepted');
  sendSuccess(res, updated);
};

// PATCH /api/jobs/:id/mark-rejected  (admin proxy)
export const markRejected = async (req: Request, res: Response) => {
  const jobId = param(req, 'id');
  const job = await getJobById(jobId);
  if (!job) return sendError(res, 404, 'Job not found', 'NOT_FOUND');
  if (!canTransition(job.status, 'rejected')) {
    return sendError(res, 400, `Cannot mark rejected from status "${job.status}"`, 'INVALID_TRANSITION');
  }
  const updated = await updateJobStatus(jobId, 'rejected');
  sendSuccess(res, updated);
};

// PATCH /api/jobs/:id/start
export const startJob = async (req: Request, res: Response) => {
  const jobId = param(req, 'id');
  const job = await getJobById(jobId);
  if (!job) return sendError(res, 404, 'Job not found', 'NOT_FOUND');

  if (req.role === 'contractor') {
    const assignment = Array.isArray(job.assignment) ? job.assignment[0] : job.assignment;
    if (!assignment || assignment.contractor?.id !== req.contractorId) {
      return sendError(res, 403, 'You are not assigned to this job', 'FORBIDDEN');
    }
  }

  if (!canTransition(job.status, 'in_progress')) {
    return sendError(res, 400, `Cannot start job with status "${job.status}"`, 'INVALID_TRANSITION');
  }

  const updated = await updateJobStatus(jobId, 'in_progress');

  if (job.unit_owner_id) {
    const { data: owner } = await supabase
      .from('unit_owners')
      .select('*, user_id')
      .eq('id', job.unit_owner_id)
      .single();
    if (owner) {
      await notifyUnitOwner(owner, owner.user_id, 'Work Started', 'The contractor is now on-site and work has begun.', jobId).catch(() => {});
    }
  }

  sendSuccess(res, updated);
};

// POST /api/jobs/:id/complete
export const completeJob = async (req: Request, res: Response) => {
  const body = completeJobSchema.parse(req.body);
  const jobId = param(req, 'id');

  const job = await getJobById(jobId);
  if (!job) return sendError(res, 404, 'Job not found', 'NOT_FOUND');

  if (req.role === 'contractor') {
    const assignment = Array.isArray(job.assignment) ? job.assignment[0] : job.assignment;
    if (!assignment || assignment.contractor?.id !== req.contractorId) {
      return sendError(res, 403, 'You are not assigned to this job', 'FORBIDDEN');
    }
  }

  if (!canTransition(job.status, 'completed')) {
    return sendError(res, 400, `Cannot complete job with status "${job.status}"`, 'INVALID_TRANSITION');
  }

  const totalAmount = body.labor_cost + body.materials_cost;

  // Insert completion record
  const { error: cErr } = await supabase.from('job_completions').upsert({
    job_id: jobId,
    work_description: body.work_description,
    labor_cost: body.labor_cost,
    materials_cost: body.materials_cost,
    total_amount: totalAmount,
  });
  if (cErr) throw new Error(cErr.message);

  // Record photo paths
  if (body.photo_paths?.length) {
    await supabase.from('job_photos').insert(
      body.photo_paths.map((path) => ({
        job_id: jobId,
        storage_path: path,
        uploaded_by: req.user!.id,
      })),
    );
  }

  const updated = await updateJobStatus(jobId, 'completed');

  // Notify admin + unit owner
  const assignment = Array.isArray(job.assignment) ? job.assignment[0] : job.assignment;
  const contractor = assignment?.contractor;

  const { data: adminUsers } = await supabase.auth.admin.listUsers();
  const admins = adminUsers?.users?.filter((u) => u.app_metadata?.role === 'admin') ?? [];
  for (const admin of admins) {
    if (contractor) {
      await notifyAdminJobCompleted(
        admin.phone ?? '',
        admin.email ?? '',
        admin.id,
        contractor,
        job,
        totalAmount,
      ).catch(() => {});
    }
  }

  if (job.unit_owner_id) {
    const { data: owner } = await supabase
      .from('unit_owners')
      .select('*, user_id')
      .eq('id', job.unit_owner_id)
      .single();
    if (owner) {
      await notifyUnitOwner(
        owner,
        owner.user_id,
        'Work Completed',
        `The work on your property has been completed. Invoice amount: $${totalAmount.toFixed(2)}`,
        jobId,
      ).catch(() => {});
    }
  }

  sendSuccess(res, updated);
};

// POST /api/jobs/:id/bill
export const billStrataManager = async (req: Request, res: Response) => {
  const body = billSchema.parse(req.body);
  const jobId = param(req, 'id');

  const job = await getJobById(jobId);
  if (!job) return sendError(res, 404, 'Job not found', 'NOT_FOUND');
  if (!canTransition(job.status, 'billed')) {
    return sendError(res, 400, `Cannot bill from status "${job.status}"`, 'INVALID_TRANSITION');
  }

  const { data: sm } = await supabase
    .from('strata_managers')
    .select('*, user_id')
    .eq('id', body.strata_manager_id)
    .single();
  if (!sm) return sendError(res, 404, 'Strata manager not found', 'NOT_FOUND');

  const { error: bErr } = await supabase.from('billing_records').insert({
    job_id: jobId,
    strata_manager_id: body.strata_manager_id,
    amount: body.amount,
    notes: body.notes ?? null,
  });
  if (bErr) throw new Error(bErr.message);

  await updateJobStatus(jobId, 'billed');

  await notifyStrataManager(
    sm,
    sm.user_id,
    'Service Invoice',
    `A service has been completed at ${job.homeowner_address}.\nService: ${job.service_type}\nAmount Due: $${body.amount.toFixed(2)}\n${body.notes ? `Notes: ${body.notes}` : ''}`,
    jobId,
  ).catch(() => {});

  sendSuccess(res, { message: 'Strata manager billed successfully' });
};

// PATCH /api/jobs/:id/cancel
export const cancelJob = async (req: Request, res: Response) => {
  const jobId = param(req, 'id');
  const job = await getJobById(jobId);
  if (!job) return sendError(res, 404, 'Job not found', 'NOT_FOUND');
  if (!canTransition(job.status, 'cancelled')) {
    return sendError(res, 400, `Cannot cancel job with status "${job.status}"`, 'INVALID_TRANSITION');
  }
  const updated = await updateJobStatus(jobId, 'cancelled');
  sendSuccess(res, updated);
};

// PATCH /api/billing/:id/payment-status
export const updateBillingPaymentStatus = async (req: Request, res: Response) => {
  const { payment_status } = z.object({
    payment_status: z.enum(['billed', 'paid', 'reconciliation']),
  }).parse(req.body);

  const id = param(req, 'id');
  const { data, error } = await supabase
    .from('billing_records')
    .update({ payment_status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) return sendError(res, 404, 'Billing record not found', 'NOT_FOUND');
  sendSuccess(res, data);
};

// GET /api/jobs/:id/photos
export const getJobPhotos = async (req: Request, res: Response) => {
  const jobId = param(req, 'id');
  const { data: photos } = await supabase
    .from('job_photos')
    .select('*')
    .eq('job_id', jobId)
    .order('uploaded_at');

  const withUrls = await Promise.all(
    (photos ?? []).map(async (photo) => {
      const { data } = await supabase.storage
        .from('job-photos')
        .createSignedUrl(photo.storage_path, 3600);
      return { ...photo, signed_url: data?.signedUrl };
    }),
  );

  sendSuccess(res, withUrls);
};
