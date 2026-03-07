import { useState } from 'react';
import { useJobs } from '../../hooks/useJobs';
import { JobCard } from '../../components/jobs/JobCard';
import { JobDetailPanel } from '../../components/jobs/JobDetailPanel';
import { Modal } from '../../components/shared/Modal';
import { CreateJobForm } from '../../components/jobs/CreateJobForm';
import type { Job, JobStatus } from '../../types';
import { Plus } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';

const STATUS_GROUPS: { status: JobStatus; label: string }[] = [
  { status: 'new', label: 'New' },
  { status: 'assigned', label: 'Assigned' },
  { status: 'accepted', label: 'Accepted' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'completed', label: 'Completed' },
  { status: 'billed', label: 'Billed' },
];

export const AdminDashboard = () => {
  const { data: jobs = [], isLoading } = useJobs();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState<JobStatus | 'all'>('all');

  const filteredJobs = activeTab === 'all'
    ? jobs.filter((j) => j.status !== 'cancelled')
    : jobs.filter((j) => j.status === activeTab);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          New Job
        </button>
      </div>

      {/* Status tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-gray-900 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
        >
          All ({jobs.filter((j) => j.status !== 'cancelled').length})
        </button>
        {STATUS_GROUPS.map(({ status, label }) => {
          const count = jobs.filter((j) => j.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${activeTab === status ? 'bg-gray-900 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
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
      ) : filteredJobs.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border bg-white text-gray-400">
          No jobs in this category
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} />
          ))}
        </div>
      )}

      {selectedJob && (
        <Modal title="Job Details" onClose={() => setSelectedJob(null)} maxWidth="max-w-xl">
          <JobDetailPanel job={jobs.find((j) => j.id === selectedJob.id) ?? selectedJob} />
        </Modal>
      )}

      {showCreate && (
        <Modal title="Create New Job" onClose={() => setShowCreate(false)} maxWidth="max-w-xl">
          <CreateJobForm onSuccess={() => setShowCreate(false)} />
        </Modal>
      )}
    </AppLayout>
  );
};
