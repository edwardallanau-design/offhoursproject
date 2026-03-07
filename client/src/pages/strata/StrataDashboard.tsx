import { useState } from 'react';
import { useJobs } from '../../hooks/useJobs';
import { AppLayout } from '../../components/layout/AppLayout';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Modal } from '../../components/shared/Modal';
import { type Job, SERVICE_TYPE_LABELS } from '../../types';
import { format } from 'date-fns';
import { MapPin, Clock, ChevronRight, DollarSign } from 'lucide-react';

export const StrataDashboard = () => {
  const { data: jobs = [], isLoading } = useJobs();
  const [selected, setSelected] = useState<Job | null>(null);

  return (
    <AppLayout>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Service Jobs</h1>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border bg-white text-gray-400">
          No jobs for your properties yet
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <button
              key={job.id}
              onClick={() => setSelected(job)}
              className="flex w-full items-center justify-between rounded-xl border bg-white p-4 shadow-sm hover:shadow-md text-left"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-gray-900">{SERVICE_TYPE_LABELS[job.service_type]}</span>
                  <StatusBadge status={job.status} />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin size={12} /><span>{job.homeowner_address}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock size={12} /><span>{format(new Date(job.created_at), 'dd MMM yyyy')}</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {selected && (
        <Modal title="Job Details" onClose={() => setSelected(null)} maxWidth="max-w-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">{SERVICE_TYPE_LABELS[selected.service_type]}</p>
              <StatusBadge status={selected.status} />
            </div>
            <div className="rounded-xl bg-gray-50 p-4 space-y-1 text-sm text-gray-700">
              <p><span className="font-medium">Address:</span> {selected.homeowner_address}</p>
              <p><span className="font-medium">Client:</span> {selected.homeowner_name}</p>
              {selected.description && <p><span className="font-medium">Notes:</span> {selected.description}</p>}
              <p className="text-gray-400 text-xs mt-2">Created {format(new Date(selected.created_at), 'dd MMM yyyy, h:mm a')}</p>
            </div>
            {selected.completion && (
              <div className="rounded-xl bg-green-50 p-4 space-y-1">
                <p className="text-xs font-semibold uppercase text-green-600">Completed Work</p>
                <p className="text-sm text-gray-700">{selected.completion.work_description}</p>
                <div className="flex items-center gap-2 text-sm font-bold text-green-700 mt-2">
                  <DollarSign size={14} />
                  <span>Total: ${selected.completion.total_amount.toFixed(2)}</span>
                </div>
              </div>
            )}
            {selected.billing && (
              <div className="rounded-xl bg-purple-50 p-4 space-y-1">
                <p className="text-xs font-semibold uppercase text-purple-600">Invoice to You</p>
                <p className="text-sm font-bold text-gray-800">${(selected.billing as { amount: number }).amount.toFixed(2)}</p>
                {(selected.billing as { notes?: string }).notes && (
                  <p className="text-xs text-gray-500">{(selected.billing as { notes: string }).notes}</p>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </AppLayout>
  );
};
