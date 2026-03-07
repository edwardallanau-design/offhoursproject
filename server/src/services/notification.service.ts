import { Job, Contractor, StrataManager, UnitOwner } from '../types';
import { sendJobAssignmentSMS, sendAdminSMS } from './sms.service';
import { sendJobAssignmentEmail, sendStrataNotificationEmail, sendGenericEmail } from './email.service';
import { sendWebPush } from './webpush.service';

type NotificationResult = {
  sms: boolean;
  email: boolean;
  webPush: boolean;
};

/**
 * Notify contractor when a job is assigned to them.
 */
export const notifyContractorAssigned = async (
  contractor: Contractor,
  contractorUserId: string,
  job: Job,
): Promise<NotificationResult> => {
  const [smsResult, emailResult, pushResult] = await Promise.allSettled([
    sendJobAssignmentSMS(contractor, job),
    sendJobAssignmentEmail(contractor, job),
    sendWebPush(
      contractorUserId,
      `New Job: ${job.service_type.replace('_', ' ')}`,
      `${job.homeowner_name} at ${job.homeowner_address}`,
      { jobId: job.id, path: `/contractor/jobs/${job.id}` },
    ),
  ]);

  return {
    sms: smsResult.status === 'fulfilled',
    email: emailResult.status === 'fulfilled',
    webPush: pushResult.status === 'fulfilled',
  };
};

/**
 * Notify admin about contractor response (accept/reject).
 */
export const notifyAdminContractorResponse = async (
  adminPhone: string,
  adminEmail: string,
  adminUserId: string,
  contractor: Contractor,
  job: Job,
  action: 'accepted' | 'rejected',
): Promise<void> => {
  const msg = `Job ${action} by ${contractor.name}.\nService: ${job.service_type}\nClient: ${job.homeowner_name}\nAddress: ${job.homeowner_address}`;

  await Promise.allSettled([
    sendAdminSMS(adminPhone, msg),
    sendGenericEmail(adminEmail, `Job ${action} by ${contractor.name}`, msg),
    sendWebPush(adminUserId, `Job ${action}`, `${contractor.name} ${action} the job for ${job.homeowner_name}`, { jobId: job.id, path: `/admin/jobs/${job.id}` }),
  ]);
};

/**
 * Notify unit owner of status updates.
 */
export const notifyUnitOwner = async (
  owner: UnitOwner,
  ownerUserId: string,
  title: string,
  message: string,
  jobId: string,
): Promise<void> => {
  await Promise.allSettled([
    sendGenericEmail(owner.email, title, message),
    sendWebPush(ownerUserId, title, message, { jobId, path: `/owner/jobs/${jobId}` }),
  ]);
};

/**
 * Notify strata manager (email + push). No SMS for strata unless specified.
 */
export const notifyStrataManager = async (
  manager: StrataManager,
  managerUserId: string,
  subject: string,
  body: string,
  jobId?: string,
): Promise<void> => {
  await Promise.allSettled([
    sendStrataNotificationEmail(manager, subject, body),
    sendWebPush(managerUserId, subject, body, jobId ? { jobId, path: `/strata/jobs/${jobId}` } : undefined),
  ]);
};

/**
 * Notify admin when a job is completed and invoice submitted.
 */
export const notifyAdminJobCompleted = async (
  adminPhone: string,
  adminEmail: string,
  adminUserId: string,
  contractor: Contractor,
  job: Job,
  totalAmount: number,
): Promise<void> => {
  const msg = `Job completed by ${contractor.name}.\nService: ${job.service_type}\nClient: ${job.homeowner_name}\nInvoice Total: $${totalAmount.toFixed(2)}`;

  await Promise.allSettled([
    sendAdminSMS(adminPhone, msg),
    sendGenericEmail(adminEmail, `Job Completed — Invoice $${totalAmount.toFixed(2)}`, msg),
    sendWebPush(adminUserId, 'Job Completed', `${contractor.name} completed the job. Invoice: $${totalAmount.toFixed(2)}`, { jobId: job.id, path: `/admin/jobs/${job.id}` }),
  ]);
};
