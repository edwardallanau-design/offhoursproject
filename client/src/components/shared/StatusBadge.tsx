import { type JobStatus, JOB_STATUS_LABELS, JOB_STATUS_COLORS } from '../../types';

export const StatusBadge = ({ status }: { status: JobStatus }) => (
  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${JOB_STATUS_COLORS[status]}`}>
    {JOB_STATUS_LABELS[status]}
  </span>
);
