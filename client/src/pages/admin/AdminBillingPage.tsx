import { useState } from 'react';
import { useJobs, useUpdateBillingPaymentStatus } from '../../hooks/useJobs';
import { AppLayout } from '../../components/layout/AppLayout';
import { SERVICE_TYPE_LABELS, type BillingRecord, type Job } from '../../types';
import { format } from 'date-fns';
import { DollarSign, MapPin, Wrench, User, Building2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

type PaymentStatus = 'billed' | 'paid' | 'reconciliation';

const TABS: { status: PaymentStatus; label: string; dot: string; totalBg: string }[] = [
  {
    status: 'billed',
    label: 'Accounts Receivable',
    dot: 'bg-amber-400',
    totalBg: 'bg-amber-50 text-amber-700',
  },
  {
    status: 'paid',
    label: 'Payment Received',
    dot: 'bg-green-500',
    totalBg: 'bg-green-50 text-green-700',
  },
  {
    status: 'reconciliation',
    label: 'For Reconciliation',
    dot: 'bg-red-500',
    totalBg: 'bg-red-50 text-red-700',
  },
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

const BillingCard = ({ job }: { job: Job }) => {
  const billing = job.billing as BillingRecord | null;
  const updateStatus = useUpdateBillingPaymentStatus(billing?.id ?? '');
  const assignment = Array.isArray(job.assignment) ? job.assignment[0] : job.assignment;
  const [editing, setEditing] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<PaymentStatus>(billing?.payment_status ?? 'billed');
  const [pendingNotes, setPendingNotes] = useState(billing?.notes ?? '');

  const handleSave = async () => {
    if (!billing) return;
    try {
      await updateStatus.mutateAsync({ payment_status: pendingStatus, notes: pendingNotes || undefined });
      toast.success('Record updated');
      setEditing(false);
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleCancel = () => {
    setPendingStatus(billing?.payment_status ?? 'billed');
    setPendingNotes(billing?.notes ?? '');
    setEditing(false);
  };

  if (!billing) return null;

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
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
              {assignment.contractor.trade && ` — ${assignment.contractor.trade}`}
            </div>
          )}
          {billing.strata_manager && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Building2 size={12} className="shrink-0" />
              Billed to:{' '}
              <span className="font-medium text-gray-700">{billing.strata_manager.name}</span>
              {billing.strata_manager.company && ` — ${billing.strata_manager.company}`}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-1 text-xl font-bold text-gray-900">
            <DollarSign size={16} />
            {billing.amount.toFixed(2)}
          </div>
          <p className="text-xs text-gray-400">
            {format(new Date(billing.billed_at), 'dd MMM yyyy')}
          </p>
          <button
            onClick={() => setEditing((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Pencil size={11} />
            Update status
          </button>
        </div>
      </div>

      {!editing && billing.notes && (
        <p className="mt-3 border-t pt-3 text-sm text-gray-500">{billing.notes}</p>
      )}

      {editing && (
        <div className="mt-3 border-t pt-3 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map(({ status, label, active, inactive }) => (
              <button
                key={status}
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
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={updateStatus.isPending}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminBillingPage = () => {
  const { data: jobs = [], isLoading } = useJobs('billed');
  const billedJobs = jobs.filter((j) => j.billing);
  const [activeTab, setActiveTab] = useState<PaymentStatus>('billed');

  const activeTabDef = TABS.find((t) => t.status === activeTab)!;
  const filteredJobs = billedJobs.filter(
    (j) => (j.billing as BillingRecord | null)?.payment_status === activeTab,
  );
  const tabTotal = filteredJobs.reduce(
    (sum, j) => sum + ((j.billing as BillingRecord | null)?.amount ?? 0),
    0,
  );

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
          {filteredJobs.map((job) => (
            <BillingCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </AppLayout>
  );
};
