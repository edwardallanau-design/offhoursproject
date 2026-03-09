import { useState } from 'react';
import { useJobs } from '../../hooks/useJobs';
import { AppLayout } from '../../components/layout/AppLayout';
import { Modal } from '../../components/shared/Modal';
import { SERVICE_TYPE_LABELS, type BillingRecord, type Job } from '../../types';
import { format } from 'date-fns';
import { DollarSign } from 'lucide-react';
import { MarkdownContent } from '../../components/shared/MarkdownContent';

const BillingDetailModal = ({ job, onClose }: { job: Job; onClose: () => void }) => {
  const billing = job.billing as BillingRecord | null;
  if (!billing) return null;

  const invoiceTotal = job.completion?.total_amount ?? 0;
  const adminFee = billing.amount;
  const grandTotal = invoiceTotal + adminFee;

  return (
    <Modal title="Invoice Details" onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Job info */}
        <div className="space-y-0.5">
          <p className="font-semibold text-gray-900">{job.homeowner_address}</p>
          <p className="text-sm text-gray-500">{SERVICE_TYPE_LABELS[job.service_type]}</p>
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
            <span>Total Due</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {job.completion?.work_description && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Scope of Work</p>
            <MarkdownContent content={job.completion.work_description} />
          </div>
        )}

        {billing.notes && (
          <p className="text-sm text-gray-500">{billing.notes}</p>
        )}
      </div>
    </Modal>
  );
};

export const BillingPage = () => {
  const { data: jobs = [] } = useJobs('billed');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const billedJobs = jobs.filter((j) => j.billing);

  const grandTotal = billedJobs.reduce((sum, j) => {
    const billing = j.billing as BillingRecord | null;
    return sum + (billing?.amount ?? 0) + (j.completion?.total_amount ?? 0);
  }, 0);

  return (
    <AppLayout>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Billing Records</h1>
      {billedJobs.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border bg-white text-gray-400">
          No billing records yet
        </div>
      ) : (
        <div className="space-y-3">
          {billedJobs.map((job) => {
            const billing = job.billing as BillingRecord | null;
            const total = (billing?.amount ?? 0) + (job.completion?.total_amount ?? 0);
            return (
              <button
                key={job.id}
                type="button"
                onClick={() => setSelectedJob(job)}
                className="w-full text-left rounded-xl border bg-white p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{job.homeowner_address}</p>
                    <p className="text-sm text-gray-500">{SERVICE_TYPE_LABELS[job.service_type]}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {billing?.billed_at ? format(new Date(billing.billed_at), 'dd MMM yyyy') : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-lg font-bold text-gray-900 shrink-0">
                    <DollarSign size={16} />
                    {total.toFixed(2)}
                  </div>
                </div>
              </button>
            );
          })}
          <div className="flex items-center justify-end rounded-xl border bg-gray-50 px-4 py-3">
            <span className="font-medium text-gray-700">Total:</span>
            <span className="ml-3 text-lg font-bold text-gray-900">${grandTotal.toFixed(2)}</span>
          </div>
        </div>
      )}

      {selectedJob && (
        <BillingDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </AppLayout>
  );
};
