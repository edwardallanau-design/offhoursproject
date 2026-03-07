import { Job, SERVICE_TYPE_LABELS } from '../../types';
import { StatusBadge } from '../shared/StatusBadge';
import { Phone, MapPin, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  job: Job;
  onClick: () => void;
}

export const JobCard = ({ job, onClick }: Props) => {
  const assignment = Array.isArray(job.assignment) ? job.assignment[0] : job.assignment;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="font-semibold text-gray-900">{job.homeowner_name}</span>
        <StatusBadge status={job.status} />
      </div>

      <p className="mb-3 text-sm font-medium text-blue-600">
        {SERVICE_TYPE_LABELS[job.service_type]}
      </p>

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <MapPin size={12} />
          <span className="truncate">{job.homeowner_address}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Phone size={12} />
          <span>{job.homeowner_phone}</span>
        </div>
        {assignment?.contractor && (
          <div className="text-xs text-gray-500">
            Assigned to: <span className="font-medium text-gray-700">{assignment.contractor.name}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock size={12} />
          <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
        </div>
      </div>
    </button>
  );
};
