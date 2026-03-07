import { useJobs } from '../../hooks/useJobs';
import { AppLayout } from '../../components/layout/AppLayout';
import { format } from 'date-fns';
import { DollarSign } from 'lucide-react';

export const BillingPage = () => {
  const { data: jobs = [] } = useJobs('billed');
  const billedJobs = jobs.filter((j) => j.billing);

  return (
    <AppLayout>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Billing Records</h1>
      {billedJobs.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border bg-white text-gray-400">
          No billing records yet
        </div>
      ) : (
        <div className="space-y-3">
          {billedJobs.map((job) => (
            <div key={job.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{job.homeowner_address}</p>
                  <p className="text-sm text-gray-500 capitalize">{job.service_type.replace('_', ' ')}</p>
                </div>
                <div className="flex items-center gap-1 text-lg font-bold text-gray-900">
                  <DollarSign size={16} />
                  {(job.billing as { amount: number } | null)?.amount.toFixed(2)}
                </div>
              </div>
              {(job.billing as { notes?: string } | null)?.notes && (
                <p className="mt-2 text-sm text-gray-500">{(job.billing as { notes: string }).notes}</p>
              )}
              <p className="mt-2 text-xs text-gray-400">
                {(job.billing as { billed_at: string } | null)?.billed_at
                  ? format(new Date((job.billing as { billed_at: string }).billed_at), 'dd MMM yyyy')
                  : ''}
              </p>
            </div>
          ))}
          <div className="flex items-center justify-end rounded-xl border bg-gray-50 px-4 py-3">
            <span className="font-medium text-gray-700">Total:</span>
            <span className="ml-3 text-lg font-bold text-gray-900">
              ${billedJobs.reduce((sum, j) => sum + ((j.billing as { amount: number } | null)?.amount ?? 0), 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
