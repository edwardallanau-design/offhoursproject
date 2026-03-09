import { useState } from 'react';
import { useJobs, useUpdateBillingPaymentStatus } from '../../hooks/useJobs';
import { AppLayout } from '../../components/layout/AppLayout';
import { Modal } from '../../components/shared/Modal';
import { SERVICE_TYPE_LABELS, type BillingRecord, type Job } from '../../types';
import { format } from 'date-fns';
import { DollarSign, MapPin, Wrench, User, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { MarkdownContent } from '../../components/shared/MarkdownContent';

type PaymentStatus = 'billed' | 'paid' | 'reconciliation';

const TABS: { status: PaymentStatus; label: string; dot: string; totalBg: string }[] = [
  { status: 'billed', label: 'Accounts Receivable', dot: 'bg-amber-400', totalBg: 'bg-amber-50 text-amber-700' },
  { status: 'paid', label: 'Payment Received', dot: 'bg-green-500', totalBg: 'bg-green-50 text-green-700' },
  { status: 'reconciliation', label: 'For Reconciliation', dot: 'bg-red-500', totalBg: 'bg-red-50 text-red-700' },
];

const STATUS_OPTIONS: { status: PaymentStatus; label: string; active: string; inactive: string }[] = [
  {
    status: 'billed',
    label: 'Accounts Receivable',
    active: 'bg-amber-500 text-white border-amber-500',
    inactive: 'border border-amber-300 text-amber-700 hover:bg-amber-50',
  },
  {
    status: 'paid',
    label: 'Paid',
    active: 'bg-green-600 text-white border-green-600',
    inactive: 'border border-green-300 text-green-700 hover:bg-green-50',
  },
  {
    status: 'reconciliation',
    label: 'For Reconciliation',
    active: 'bg-red-600 text-white border-red-600',
    inactive: 'border border-red-300 text-red-700 hover:bg-red-50',
  },
];

const BillingDetailModal = ({ job, onClose }: { job: Job; onClose: () => void }) => {
  const billing = job.billing as BillingRecord | null;
  const updateStatus = useUpdateBillingPaymentStatus(billing?.id ?? '');
  const [pendingStatus, setPendingStatus] = useState<PaymentStatus>(billing?.payment_status ?? 'billed');
  const [pendingNotes, setPendingNotes] = useState(billing?.notes ?? '');

  if (!billing) return null;

  const invoiceTotal = job.completion?.total_amount ?? 0;
  const adminFee = billing.amount;
  const grandTotal = invoiceTotal + adminFee;

  const handleSave = async () => {
    try {
      await updateStatus.mutateAsync({ payment_status: pendingStatus, notes: pendingNotes || undefined });
      toast.success('Record updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <Modal title="Billing Details" onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Job info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Wrench size={14} className="text-gray-400 shrink-0" />
            {SERVICE_TYPE_LABELS[job.service_type]}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin size={12} className="shrink-0" />
            {job.homeowner_address}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <User size={12} className="shrink-0" />
            {job.homeowner_name}
          </div>
          {billing.strata_manager && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Building2 size={12} className="shrink-0" />
              Billed to:{' '}
              <span className="font-medium text-gray-700">{billing.strata_manager.name}</span>
              {billing.strata_manager.company && ` — ${billing.strata_manager.company}`}
            </div>
          )}
          <p className="text-xs text-gray-400">{format(new Date(billing.billed_at), 'dd MMM yyyy, h:mm a')}</p>
        </div>

        {/* Invoice breakdown */}
        <div className="rounded-xl bg-gray-50 border p-3 space-y-1.5 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Invoice Breakdown</p>
          {job.completion && (
            <>
              <div className="flex justify-between text-gray-600">
                <span>Labour</span>
                <span>${job.completion.labor_cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Materials</span>
                <span>${job.completion.materials_cost.toFixed(2)}</span>
              </div>
              <div className="border-t pt-1.5 flex justify-between font-medium text-gray-700">
                <span>Contractor Total</span>
                <span>${invoiceTotal.toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-gray-600 pt-0.5">
            <span>Admin Fee</span>
            <span>${adminFee.toFixed(2)}</span>
          </div>
          <div className="border-t pt-1.5 flex justify-between font-bold text-gray-900">
            <span>Grand Total</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Scope of work */}
        {job.completion?.work_description && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Scope of Work</p>
            <MarkdownContent content={job.completion.work_description} />
          </div>
        )}

        {/* Status update */}
        <div className="space-y-3 border-t pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Update Payment Status</p>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map(({ status, label, active, inactive }) => (
              <button
                key={status}
                type="button"
                onClick={() => setPendingStatus(status)}
                className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                  pendingStatus === status ? active : inactive
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <textarea
            value={pendingNotes}
            onChange={(e) => setPendingNotes(e.target.value)}
            placeholder="Add a note (optional)"
            rows={2}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={updateStatus.isPending}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {updateStatus.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const AdminBillingPage = () => {
  const { data: jobs = [], isLoading } = useJobs('billed');
  const billedJobs = jobs.filter((j) => j.billing);
  const [activeTab, setActiveTab] = useState<PaymentStatus>('billed');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const activeTabDef = TABS.find((t) => t.status === activeTab)!;
  const filteredJobs = billedJobs.filter(
    (j) => (j.billing as BillingRecord | null)?.payment_status === activeTab,
  );
  const tabTotal = filteredJobs.reduce((sum, j) => {
    const billing = j.billing as BillingRecord | null;
    return sum + (billing?.amount ?? 0) + (j.completion?.total_amount ?? 0);
  }, 0);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing Records</h1>
        {filteredJobs.length > 0 && (
          <div className={`flex items-center gap-1 rounded-xl px-4 py-2 text-lg font-bold ${activeTabDef.totalBg}`}>
            <DollarSign size={18} />
            {tabTotal.toFixed(2)}
          </div>
        )}
      </div>

      <div className="flex items-end gap-1 border-b border-gray-200 mb-5">
        {TABS.map(({ status, label, dot }) => {
          const count = billedJobs.filter(
            (j) => (j.billing as BillingRecord | null)?.payment_status === status,
          ).length;
          const isActive = activeTab === status;
          return (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border border-b-0 transition-colors ${isActive
                ? 'bg-white border-gray-200 text-gray-900 -mb-px z-10'
                : 'bg-gray-100 border-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                }`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
              {label}
              {count > 0 && (
                <span className="ml-0.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600 leading-none">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border bg-white text-gray-400">
          No {activeTabDef.label.toLowerCase()} records
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => {
            const billing = job.billing as BillingRecord | null;
            const grandTotal = (billing?.amount ?? 0) + (job.completion?.total_amount ?? 0);
            const assignment = Array.isArray(job.assignment) ? job.assignment[0] : job.assignment;
            return (
              <button
                key={job.id}
                type="button"
                onClick={() => setSelectedJob(job)}
                className="w-full text-left rounded-xl border bg-white p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Wrench size={14} className="text-gray-400 shrink-0" />
                      {SERVICE_TYPE_LABELS[job.service_type]}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin size={12} className="shrink-0" />
                      {job.homeowner_address}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <User size={12} className="shrink-0" />
                      {job.homeowner_name}
                    </div>
                    {assignment?.contractor && (
                      <div className="text-xs text-gray-500">
                        Contractor:{' '}
                        <span className="font-medium text-gray-700">{assignment.contractor.name}</span>
                      </div>
                    )}
                    {billing?.strata_manager && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Building2 size={12} className="shrink-0" />
                        {billing.strata_manager.name}
                        {billing.strata_manager.company && ` — ${billing.strata_manager.company}`}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1 text-xl font-bold text-gray-900">
                      <DollarSign size={16} />
                      {grandTotal.toFixed(2)}
                    </div>
                    <p className="text-xs text-gray-400">
                      {billing?.billed_at ? format(new Date(billing.billed_at), 'dd MMM yyyy') : ''}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedJob && (
        <BillingDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </AppLayout>
  );
};
