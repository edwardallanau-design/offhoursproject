import { useState } from 'react';
import { useJobs } from '../../hooks/useJobs';
import { JobCard } from '../../components/jobs/JobCard';
import { JobDetailPanel } from '../../components/jobs/JobDetailPanel';
import { Modal } from '../../components/shared/Modal';
import { AppLayout } from '../../components/layout/AppLayout';
import type { Job, JobStatus } from '../../types';

const TABS: { status: JobStatus | 'all'; label: string }[] = [
  { status: 'all', label: 'All' },
  { status: 'assigned', label: 'New' },
  { status: 'accepted', label: 'Accepted' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'completed', label: 'Completed' },
];

export const ContractorDashboard = () => {
  const { data: jobs = [], isLoading } = useJobs();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState<JobStatus | 'all'>('all');

  const filtered = activeTab === 'all' ? jobs : jobs.filter((j) => j.status === activeTab);

  return (
    <AppLayout>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Jobs</h1>

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map(({ status, label }) => {
          const count = status === 'all' ? jobs.length : jobs.filter((j) => j.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`rounded-full px-3 py-1 text-sm font-medium ${activeTab === status ? 'bg-gray-900 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
            >
              {label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border bg-white text-gray-400">
          No jobs here
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} />
          ))}
        </div>
      )}

      {selectedJob && (
        <Modal title="Job Details" onClose={() => setSelectedJob(null)} maxWidth="max-w-xl">
          <JobDetailPanel job={jobs.find((j) => j.id === selectedJob.id) ?? selectedJob} />
        </Modal>
      )}
    </AppLayout>
  );
};
