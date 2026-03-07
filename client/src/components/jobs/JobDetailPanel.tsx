import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Job, SERVICE_TYPE_LABELS } from '../../types';
import { StatusBadge } from '../shared/StatusBadge';
import { useAuth } from '../../auth/AuthContext';
import {
  useAssignContractor, useMarkAccepted, useMarkRejected,
  useStartJob, useCompleteJob, useBillStrata, useCancelJob, useRespondToJob,
} from '../../hooks/useJobs';
import { useContractors } from '../../hooks/useContractors';
import { useStrataManagers } from '../../hooks/useStrataManagers';
import { Phone, MapPin, User, Briefcase } from 'lucide-react';

const completeSchema = z.object({
  work_description: z.string().min(1, 'Required'),
  labor_cost: z.coerce.number().min(0),
  materials_cost: z.coerce.number().min(0),
});

const billSchema = z.object({
  strata_manager_id: z.string().uuid('Select a strata manager'),
  amount: z.coerce.number().min(0.01, 'Amount required'),
  notes: z.string().optional(),
});

interface Props {
  job: Job;
}

export const JobDetailPanel = ({ job }: Props) => {
  const { user } = useAuth();
  const role = user?.role;
  const assignment = Array.isArray(job.assignment) ? job.assignment[0] : job.assignment;
  const contractor = assignment?.contractor;

  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [showBillForm, setShowBillForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);

  const { data: contractors } = useContractors(true);
  const { data: strataManagers } = useStrataManagers();

  const assignMutation = useAssignContractor(job.id);
  const markAcceptedMutation = useMarkAccepted(job.id);
  const markRejectedMutation = useMarkRejected(job.id);
  const startMutation = useStartJob(job.id);
  const completeMutation = useCompleteJob(job.id);
  const billMutation = useBillStrata(job.id);
  const cancelMutation = useCancelJob(job.id);
  const respondMutation = useRespondToJob(job.id);

  const completeForm = useForm({ resolver: zodResolver(completeSchema), defaultValues: { labor_cost: 0, materials_cost: 0 } });
  const billForm = useForm({ resolver: zodResolver(billSchema) });
  const [selectedContractor, setSelectedContractor] = useState('');

  const run = async (mutFn: () => Promise<unknown>, successMsg: string) => {
    try {
      await mutFn();
      toast.success(successMsg);
    } catch {
      toast.error('Action failed');
    }
  };

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{job.homeowner_name}</h2>
          <p className="text-sm text-blue-600 font-medium">{SERVICE_TYPE_LABELS[job.service_type]}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {/* Contact info */}
      <div className="rounded-xl border bg-gray-50 p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <User size={15} className="text-gray-400 shrink-0" />
          <span>{job.homeowner_name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Phone size={15} className="text-gray-400 shrink-0" />
          <a href={`tel:${job.homeowner_phone}`} className="text-blue-600 hover:underline">{job.homeowner_phone}</a>
        </div>
        <div className="flex items-start gap-2 text-sm text-gray-700">
          <MapPin size={15} className="mt-0.5 text-gray-400 shrink-0" />
          <span>{job.homeowner_address}{job.unit_number ? ` — Unit ${job.unit_number}` : ''}</span>
        </div>
        {job.description && (
          <div className="mt-2 text-sm text-gray-600">
            <span className="font-medium">Notes:</span> {job.description}
          </div>
        )}
      </div>

      {/* Assignment info */}
      {contractor && (
        <div className="rounded-xl border bg-blue-50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase text-blue-500">Assigned Contractor</p>
          <div className="flex items-center gap-2 text-sm text-gray-800">
            <Briefcase size={14} />
            <span className="font-medium">{contractor.name}</span>
            {contractor.trade && <span className="text-gray-500">— {contractor.trade}</span>}
          </div>
          <a href={`tel:${contractor.phone}`} className="text-sm text-blue-600 hover:underline">{contractor.phone}</a>
        </div>
      )}

      {/* Completion info */}
      {job.completion && (
        <div className="rounded-xl border bg-green-50 p-4 space-y-1">
          <p className="text-xs font-semibold uppercase text-green-600">Invoice</p>
          <p className="text-sm text-gray-700">{job.completion.work_description}</p>
          <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
            <div><p className="text-gray-500 text-xs">Labour</p><p className="font-medium">${job.completion.labor_cost.toFixed(2)}</p></div>
            <div><p className="text-gray-500 text-xs">Materials</p><p className="font-medium">${job.completion.materials_cost.toFixed(2)}</p></div>
            <div><p className="text-gray-500 text-xs">Total</p><p className="font-bold text-green-700">${job.completion.total_amount.toFixed(2)}</p></div>
          </div>
        </div>
      )}

      {/* Billing info */}
      {job.billing && (
        <div className="rounded-xl border bg-purple-50 p-4 space-y-1">
          <p className="text-xs font-semibold uppercase text-purple-600">Billed to Strata</p>
          <p className="text-sm font-medium text-gray-800">${(job.billing as { amount: number }).amount.toFixed(2)}</p>
          <p className="text-xs text-gray-500">
            {format(new Date((job.billing as { billed_at: string }).billed_at), 'dd MMM yyyy, h:mm a')}
          </p>
          {(job.billing as { notes?: string }).notes && (
            <p className="text-sm text-gray-600">{(job.billing as { notes: string }).notes}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">

        {/* ADMIN actions */}
        {role === 'admin' && (
          <>
            {['new', 'assigned', 'rejected'].includes(job.status) && (
              <div>
                {!showAssignForm ? (
                  <button onClick={() => setShowAssignForm(true)} className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                    {job.status === 'assigned' ? 'Reassign Contractor' : 'Assign Contractor'}
                  </button>
                ) : (
                  <div className="space-y-3 rounded-xl border p-4">
                    <p className="font-medium text-gray-700 text-sm">Select Contractor</p>
                    <select value={selectedContractor} onChange={(e) => setSelectedContractor(e.target.value)} className={inputClass}>
                      <option value="">Choose…</option>
                      {(contractors ?? []).map((c) => (
                        <option key={c.id} value={c.id}>{c.name} — {c.trade ?? c.email}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => run(() => assignMutation.mutateAsync(selectedContractor).then(() => setShowAssignForm(false)), 'Contractor assigned and notified')}
                        disabled={!selectedContractor || assignMutation.isPending}
                        className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {assignMutation.isPending ? 'Assigning…' : 'Confirm'}
                      </button>
                      <button onClick={() => setShowAssignForm(false)} className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {job.status === 'assigned' && (
              <div className="flex gap-2">
                <button onClick={() => run(() => markAcceptedMutation.mutateAsync(), 'Marked as accepted')} disabled={markAcceptedMutation.isPending} className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                  Mark Accepted
                </button>
                <button onClick={() => run(() => markRejectedMutation.mutateAsync(), 'Marked as rejected')} disabled={markRejectedMutation.isPending} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                  Mark Rejected
                </button>
              </div>
            )}

            {job.status === 'accepted' && (
              <button onClick={() => run(() => startMutation.mutateAsync(), 'Job marked in progress')} disabled={startMutation.isPending} className="w-full rounded-lg bg-yellow-500 py-2 text-sm font-semibold text-white hover:bg-yellow-600 disabled:opacity-60">
                Mark In Progress
              </button>
            )}

            {job.status === 'in_progress' && !showCompleteForm && (
              <button onClick={() => setShowCompleteForm(true)} className="w-full rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700">
                Submit Completion & Invoice
              </button>
            )}

            {job.status === 'completed' && !job.billing && !showBillForm && (
              <button onClick={() => setShowBillForm(true)} className="w-full rounded-lg bg-purple-600 py-2 text-sm font-semibold text-white hover:bg-purple-700">
                Bill Strata Manager
              </button>
            )}

            {!['billed', 'cancelled', 'completed'].includes(job.status) && (
              <button onClick={() => run(() => cancelMutation.mutateAsync(), 'Job cancelled')} disabled={cancelMutation.isPending} className="w-full rounded-lg border border-red-300 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">
                Cancel Job
              </button>
            )}
          </>
        )}

        {/* CONTRACTOR actions */}
        {role === 'contractor' && (
          <>
            {job.status === 'assigned' && (
              <div className="flex gap-2">
                <button onClick={() => run(() => respondMutation.mutateAsync('accept'), 'Job accepted')} disabled={respondMutation.isPending} className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                  Accept Job
                </button>
                <button onClick={() => run(() => respondMutation.mutateAsync('reject'), 'Job rejected')} disabled={respondMutation.isPending} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                  Reject Job
                </button>
              </div>
            )}
            {job.status === 'accepted' && (
              <button onClick={() => run(() => startMutation.mutateAsync(), 'Job started')} disabled={startMutation.isPending} className="w-full rounded-lg bg-yellow-500 py-2 text-sm font-semibold text-white hover:bg-yellow-600 disabled:opacity-60">
                Start Job
              </button>
            )}
            {job.status === 'in_progress' && !showCompleteForm && (
              <button onClick={() => setShowCompleteForm(true)} className="w-full rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700">
                Submit Completion & Invoice
              </button>
            )}
          </>
        )}

        {/* Completion form */}
        {showCompleteForm && (
          <form
            onSubmit={completeForm.handleSubmit(async (d) => {
              await run(() => completeMutation.mutateAsync(d), 'Job completed and invoice submitted');
              setShowCompleteForm(false);
            })}
            className="space-y-3 rounded-xl border p-4"
          >
            <p className="font-medium text-gray-700 text-sm">Completion Details</p>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Work Description *</label>
              <textarea {...completeForm.register('work_description')} rows={3} className={inputClass} placeholder="Describe work performed..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Labour Cost ($)</label>
                <input type="number" step="0.01" {...completeForm.register('labor_cost')} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Materials Cost ($)</label>
                <input type="number" step="0.01" {...completeForm.register('materials_cost')} className={inputClass} />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={completeMutation.isPending} className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                {completeMutation.isPending ? 'Submitting…' : 'Submit'}
              </button>
              <button type="button" onClick={() => setShowCompleteForm(false)} className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        )}

        {/* Bill strata form */}
        {showBillForm && (
          <form
            onSubmit={billForm.handleSubmit(async (d) => {
              await run(() => billMutation.mutateAsync(d), 'Strata manager billed successfully');
              setShowBillForm(false);
            })}
            className="space-y-3 rounded-xl border p-4"
          >
            <p className="font-medium text-gray-700 text-sm">Bill Strata Manager</p>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Strata Manager *</label>
              <select {...billForm.register('strata_manager_id')} className={inputClass}>
                <option value="">Select…</option>
                {(strataManagers ?? []).map((sm) => (
                  <option key={sm.id} value={sm.id}>{sm.name} — {sm.company ?? sm.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Amount ($) *</label>
              <input type="number" step="0.01" {...billForm.register('amount')} className={inputClass}
                defaultValue={job.completion?.total_amount ?? ''} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Notes</label>
              <textarea rows={2} {...billForm.register('notes')} className={inputClass} />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={billMutation.isPending} className="flex-1 rounded-lg bg-purple-600 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60">
                {billMutation.isPending ? 'Sending…' : 'Send Invoice'}
              </button>
              <button type="button" onClick={() => setShowBillForm(false)} className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Created {format(new Date(job.created_at), 'dd MMM yyyy, h:mm a')}
      </p>
    </div>
  );
};
