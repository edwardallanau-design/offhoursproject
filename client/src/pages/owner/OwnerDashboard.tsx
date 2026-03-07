import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useJobs } from '../../hooks/useJobs';
import { AppLayout } from '../../components/layout/AppLayout';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { type Job, SERVICE_TYPE_LABELS, JOB_STATUS_LABELS } from '../../types';
import { format } from 'date-fns';
import { Modal } from '../../components/shared/Modal';
import { MapPin, Phone, Clock, ChevronRight } from 'lucide-react';

const STATUS_STEPS = ['new', 'assigned', 'accepted', 'in_progress', 'completed', 'billed'];

const StatusTimeline = ({ job }: { job: Job }) => {
  const currentIdx = STATUS_STEPS.indexOf(job.status);
  if (currentIdx === -1) return null;

  return (
    <div className="mt-4">
      <p className="mb-3 text-xs font-semibold uppercase text-gray-500">Progress</p>
      <div className="space-y-2">
        {STATUS_STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full shrink-0 ${i <= currentIdx ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <span className={`text-sm ${i === currentIdx ? 'font-semibold text-gray-900' : i < currentIdx ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
              {JOB_STATUS_LABELS[s as keyof typeof JOB_STATUS_LABELS]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const OwnerDashboard = () => {
  const { data: jobs = [], isLoading } = useJobs();
  const [selected, setSelected] = useState<Job | null>(null);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Service Requests</h1>
        <Link to="/owner/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          + New Request
        </Link>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-xl border bg-white text-gray-400">
          <p>No service requests yet</p>
          <Link to="/owner/new" className="text-sm text-blue-600 hover:underline">Submit your first request</Link>
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
                <div className="flex items-center gap-3">
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
        <Modal title="Request Details" onClose={() => setSelected(null)} maxWidth="max-w-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">{SERVICE_TYPE_LABELS[selected.service_type]}</p>
              <StatusBadge status={selected.status} />
            </div>
            <div className="rounded-xl bg-gray-50 p-4 space-y-2 text-sm text-gray-700">
              <div className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" /><span>{selected.homeowner_address}</span></div>
              <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /><span>{selected.homeowner_phone}</span></div>
            </div>
            {selected.description && <p className="text-sm text-gray-600"><span className="font-medium">Notes:</span> {selected.description}</p>}
            <StatusTimeline job={jobs.find((j) => j.id === selected.id) ?? selected} />
          </div>
        </Modal>
      )}
    </AppLayout>
  );
};
