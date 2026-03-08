import { Router } from 'express';
import { authenticate, requireAdmin, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { getSession } from '../controllers/auth.controller';
import * as jobs from '../controllers/jobs.controller';
import * as contractors from '../controllers/contractors.controller';
import * as strata from '../controllers/strata.controller';
import * as notifications from '../controllers/notifications.controller';

const router = Router();

// ─── Auth ────────────────────────────────────────────────────
router.get('/auth/session', authenticate, asyncHandler(getSession));

// ─── Jobs ────────────────────────────────────────────────────
router.get('/jobs', authenticate, asyncHandler(jobs.listJobs));
router.post('/jobs', authenticate, requireRole('admin', 'unit_owner'), asyncHandler(jobs.createJob));
router.get('/jobs/:id', authenticate, asyncHandler(jobs.getJob));
router.get('/jobs/:id/photos', authenticate, asyncHandler(jobs.getJobPhotos));

router.post('/jobs/:id/assign', authenticate, requireAdmin, asyncHandler(jobs.assignContractor));
router.patch('/jobs/:id/respond', authenticate, requireRole('contractor'), asyncHandler(jobs.respondToJob));
router.patch('/jobs/:id/mark-accepted', authenticate, requireAdmin, asyncHandler(jobs.markAccepted));
router.patch('/jobs/:id/mark-rejected', authenticate, requireAdmin, asyncHandler(jobs.markRejected));
router.patch('/jobs/:id/start', authenticate, requireRole('admin', 'contractor'), asyncHandler(jobs.startJob));
router.post('/jobs/:id/complete', authenticate, requireRole('admin', 'contractor'), asyncHandler(jobs.completeJob));
router.post('/jobs/:id/bill', authenticate, requireAdmin, asyncHandler(jobs.billStrataManager));
router.patch('/jobs/:id/completion', authenticate, requireRole('admin', 'contractor'), asyncHandler(jobs.updateCompletion));
router.patch('/jobs/:id/cancel', authenticate, requireAdmin, asyncHandler(jobs.cancelJob));
router.patch('/jobs/:id', authenticate, requireAdmin, asyncHandler(jobs.updateJob));

// ─── Billing ─────────────────────────────────────────────────
router.patch('/billing/:id/payment-status', authenticate, requireAdmin, asyncHandler(jobs.updateBillingPaymentStatus));

// ─── Contractors ─────────────────────────────────────────────
router.get('/contractors', authenticate, requireAdmin, asyncHandler(contractors.listContractors));
router.post('/contractors', authenticate, requireAdmin, asyncHandler(contractors.createContractor));
router.patch('/contractors/:id', authenticate, requireAdmin, asyncHandler(contractors.updateContractor));

// ─── Strata Managers ─────────────────────────────────────────
router.get('/strata-managers', authenticate, requireAdmin, asyncHandler(strata.listStrataManagers));
router.post('/strata-managers', authenticate, requireAdmin, asyncHandler(strata.createStrataManager));
router.patch('/strata-managers/:id', authenticate, requireAdmin, asyncHandler(strata.updateStrataManager));

// ─── Notifications ───────────────────────────────────────────
router.get('/notifications/vapid-public-key', authenticate, asyncHandler(notifications.getVapidPublicKey));
router.post('/notifications/push-subscription', authenticate, asyncHandler(notifications.savePushSubscription));
router.delete('/notifications/push-subscription', authenticate, asyncHandler(notifications.deletePushSubscription));

export default router;
