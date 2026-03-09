import { useState } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { type Job, SERVICE_TYPE_LABELS } from '../../types';
import { StatusBadge } from '../shared/StatusBadge';
import { useAuth } from '../../auth/AuthContext';
import {
  useAssignContractor, useMarkAccepted, useMarkRejected,
  useStartJob, useCancelJob, useRespondToJob,
  useJobPhotos,
} from '../../hooks/useJobs';
import { useContractors } from '../../hooks/useContractors';
import { Phone, MapPin, User, Briefcase, StickyNote, Pencil, Image, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { MarkdownContent } from '../shared/MarkdownContent';
import { JobCompletionPanel } from './JobCompletionPanel';
import { JobEditPanel } from './JobEditPanel';
import { JobBillPanel } from './JobBillPanel';

interface Props {
  job: Job;
}

export const JobDetailPanel = ({ job }: Props) => {
  const { user } = useAuth();
  const role = user?.role;
  const assignment = Array.isArray(job.assignment) ? job.assignment[0] : job.assignment;
  const contractor = assignment?.contractor;

  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showCompletionPanel, setShowCompletionPanel] = useState(false);
  const [completionEditMode, setCompletionEditMode] = useState(false);
  const [showBillPanel, setShowBillPanel] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: contractors } = useContractors(true);
  const { data: photos } = useJobPhotos(job.id);

  const assignMutation = useAssignContractor(job.id);
  const markAcceptedMutation = useMarkAccepted(job.id);
  const markRejectedMutation = useMarkRejected(job.id);
  const startMutation = useStartJob(job.id);
  const cancelMutation = useCancelJob(job.id);
  const respondMutation = useRespondToJob(job.id);

  const [selectedContractor, setSelectedContractor] = useState('');

  const run = async (mutFn: () => Promise<unknown>, successMsg: string) => {
    try {
      await mutFn();
      toast.success(successMsg);
    } catch {
      toast.error('Action failed');
    }
  };

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  const photosWithUrls = (photos ?? []).filter((p) => p.signed_url);
  const imagePhotos = photosWithUrls.filter((p) => !p.storage_path.match(/\.pdf$/i));

  return (
    <div className="relative overflow-hidden">
      {/* Main job detail content */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{job.homeowner_name}</h2>
            <p className="text-sm text-blue-600 font-medium">{SERVICE_TYPE_LABELS[job.service_type]}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={job.status} />
            {role === 'admin' && (
              <button
                onClick={() => setShowEditPanel(true)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Pencil size={12} />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Contact info */}
        <div className="rounded-xl border bg-gray-50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <User size={15} className="text-gray-400 shrink-0" />
            <span>{job.homeowner_name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Phone size={15} className="text-gray-400 shrink-0" />
            <a href={`tel:${job.homeowner_phone}`} className="text-blue-600 hover:underline">{job.homeowner_phone}</a>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <MapPin size={15} className="mt-0.5 text-gray-400 shrink-0" />
            <span>
              {job.homeowner_address}{job.suburb ? `, ${job.suburb}` : ''}
              {job.unit_number ? ` — Unit ${job.unit_number}` : ''}
            </span>
          </div>
        </div>

        {job.description && (
          <div className="rounded-xl border bg-white p-4 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Description</p>
            <div className="space-y-1.5">
              <MarkdownContent content={job.description} />
            </div>
          </div>
        )}

        {job.notes && (
          <div className="rounded-xl border bg-amber-50 p-4 flex gap-2">
            <StickyNote size={14} className="mt-0.5 shrink-0 text-amber-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 mb-1">Internal Notes</p>
              <p className="text-sm text-amber-900">{job.notes}</p>
            </div>
          </div>
        )}

        {/* Assignment info */}
        {contractor && (
          <div className="rounded-xl border bg-blue-50 p-4">
            <p className="mb-1 text-xs font-semibold uppercase text-blue-500">Assigned Contractor</p>
            <div className="flex items-center gap-2 text-sm text-gray-800">
              <Briefcase size={14} />
              <span className="font-medium">{contractor.name}</span>
              {contractor.trade && <span className="text-gray-500">— {contractor.trade}</span>}
            </div>
            <a href={`tel:${contractor.phone}`} className="text-sm text-blue-600 hover:underline">{contractor.phone}</a>
          </div>
        )}

        {/* Completion info */}
        {job.completion && (
          <div className="rounded-xl border bg-green-50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-green-600">Invoice</p>
              {(role === 'admin' || (role === 'contractor' && contractor?.user_id === user?.id)) && (
                <button
                  onClick={() => { setCompletionEditMode(true); setShowCompletionPanel(true); }}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Pencil size={12} />
                  Edit
                </button>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Scope of Work</p>
              <MarkdownContent content={job.completion.work_description} />
            </div>
            {job.completion.materials && job.completion.materials.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Materials</p>
                <div className="space-y-0.5">
                  {job.completion.materials.map((m, i) => (
                    <div key={i} className="flex justify-between text-sm text-gray-700">
                      <span>{m.name}</span>
                      <span>${m.cost.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-green-200 text-sm">
              <div><p className="text-gray-500 text-xs">Labour</p><p className="font-medium">${job.completion.labor_cost.toFixed(2)}</p></div>
              <div><p className="text-gray-500 text-xs">Materials</p><p className="font-medium">${job.completion.materials_cost.toFixed(2)}</p></div>
              <div><p className="text-gray-500 text-xs">Total</p><p className="font-bold text-green-700">${job.completion.total_amount.toFixed(2)}</p></div>
            </div>
          </div>
        )}

        {/* Photos section */}
        {job.completion && photosWithUrls.length > 0 && (
          <div className="rounded-xl border bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <Image size={14} className="text-gray-400" />
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Photos &amp; Receipts</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {photosWithUrls.map((photo) => {
                const isPdf = photo.storage_path.match(/\.pdf$/i);
                return isPdf ? (
                  <a
                    key={photo.id}
                    href={photo.signed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center aspect-square rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors p-2 gap-1"
                  >
                    <Image size={20} className="text-gray-400" />
                    <span className="text-xs text-gray-500 text-center break-all line-clamp-2">PDF</span>
                  </a>
                ) : (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setLightboxIndex(imagePhotos.indexOf(photo))}
                    className="aspect-square rounded-lg overflow-hidden border hover:ring-2 hover:ring-blue-400 transition-all"
                  >
                    <img
                      src={photo.signed_url}
                      alt="Job photo"
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Billing info */}
        {job.billing && (
          <div className="rounded-xl border bg-purple-50 p-4 space-y-1.5">
            <p className="text-xs font-semibold uppercase text-purple-600">Billed to Strata</p>
            <div className="space-y-0.5 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Contractor Invoice</span>
                <span>${(job.completion?.total_amount ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Admin Fee</span>
                <span>${(job.billing as { amount: number }).amount.toFixed(2)}</span>
              </div>
              <div className="border-t border-purple-200 pt-1 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>${((job.completion?.total_amount ?? 0) + (job.billing as { amount: number }).amount).toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {format(new Date((job.billing as { billed_at: string }).billed_at), 'dd MMM yyyy, h:mm a')}
            </p>
            {(job.billing as { notes?: string }).notes && (
              <p className="text-sm text-gray-600">{(job.billing as { notes: string }).notes}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">

          {/* ADMIN actions */}
          {role === 'admin' && (
            <>
              {['new', 'assigned', 'rejected'].includes(job.status) && (
                <div>
                  {!showAssignForm ? (
                    <button onClick={() => setShowAssignForm(true)} className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                      {job.status === 'assigned' ? 'Reassign Contractor' : 'Assign Contractor'}
                    </button>
                  ) : (
                    <div className="space-y-3 rounded-xl border p-4">
                      <p className="font-medium text-gray-700 text-sm">Select Contractor</p>
                      <select value={selectedContractor} onChange={(e) => setSelectedContractor(e.target.value)} className={inputClass}>
                        <option value="">Choose…</option>
                        {(contractors ?? []).map((c) => (
                          <option key={c.id} value={c.id}>{c.name} — {c.trade ?? c.email}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => run(() => assignMutation.mutateAsync(selectedContractor).then(() => setShowAssignForm(false)), 'Contractor assigned and notified')}
                          disabled={!selectedContractor || assignMutation.isPending}
                          className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {assignMutation.isPending ? 'Assigning…' : 'Confirm'}
                        </button>
                        <button onClick={() => setShowAssignForm(false)} className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {job.status === 'assigned' && (
                <div className="flex gap-2">
                  <button onClick={() => run(() => markAcceptedMutation.mutateAsync(), 'Marked as accepted')} disabled={markAcceptedMutation.isPending} className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                    Mark Accepted
                  </button>
                  <button onClick={() => run(() => markRejectedMutation.mutateAsync(), 'Marked as rejected')} disabled={markRejectedMutation.isPending} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                    Mark Rejected
                  </button>
                </div>
              )}

              {job.status === 'accepted' && (
                <button onClick={() => run(() => startMutation.mutateAsync(), 'Job marked in progress')} disabled={startMutation.isPending} className="w-full rounded-lg bg-yellow-500 py-2 text-sm font-semibold text-white hover:bg-yellow-600 disabled:opacity-60">
                  Mark In Progress
                </button>
              )}

              {job.status === 'in_progress' && (
                <button onClick={() => { setCompletionEditMode(false); setShowCompletionPanel(true); }} className="w-full rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700">
                  Submit Completion &amp; Invoice
                </button>
              )}

              {job.status === 'completed' && !job.billing && (
                <button onClick={() => setShowBillPanel(true)} className="w-full rounded-lg bg-purple-600 py-2 text-sm font-semibold text-white hover:bg-purple-700">
                  Bill Strata Manager
                </button>
              )}

              {!['billed', 'cancelled', 'completed'].includes(job.status) && (
                <button onClick={() => run(() => cancelMutation.mutateAsync(), 'Job cancelled')} disabled={cancelMutation.isPending} className="w-full rounded-lg border border-red-300 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">
                  Cancel Job
                </button>
              )}
            </>
          )}

          {/* CONTRACTOR actions */}
          {role === 'contractor' && (
            <>
              {job.status === 'assigned' && (
                <div className="flex gap-2">
                  <button onClick={() => run(() => respondMutation.mutateAsync('accept'), 'Job accepted')} disabled={respondMutation.isPending} className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                    Accept Job
                  </button>
                  <button onClick={() => run(() => respondMutation.mutateAsync('reject'), 'Job rejected')} disabled={respondMutation.isPending} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                    Reject Job
                  </button>
                </div>
              )}
              {job.status === 'accepted' && (
                <button onClick={() => run(() => startMutation.mutateAsync(), 'Job started')} disabled={startMutation.isPending} className="w-full rounded-lg bg-yellow-500 py-2 text-sm font-semibold text-white hover:bg-yellow-600 disabled:opacity-60">
                  Start Job
                </button>
              )}
              {job.status === 'in_progress' && (
                <button onClick={() => { setCompletionEditMode(false); setShowCompletionPanel(true); }} className="w-full rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700">
                  Submit Completion &amp; Invoice
                </button>
              )}
            </>
          )}

        </div>

        <p className="text-xs text-gray-400">
          Created {format(new Date(job.created_at), 'dd MMM yyyy, h:mm a')}
        </p>
      </div>

      {/* Sliding edit panel */}
      {showEditPanel && (
        <JobEditPanel job={job} onClose={() => setShowEditPanel(false)} />
      )}

      {/* Sliding bill panel */}
      {showBillPanel && (
        <JobBillPanel job={job} onClose={() => setShowBillPanel(false)} />
      )}

      {/* Sliding completion panel */}
      {showCompletionPanel && (
        <JobCompletionPanel
          job={job}
          onClose={() => { setShowCompletionPanel(false); setCompletionEditMode(false); }}
          mode={completionEditMode ? 'edit' : 'create'}
          initialData={completionEditMode ? job.completion ?? undefined : undefined}
          existingPhotoCount={completionEditMode ? photosWithUrls.length : 0}
        />
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && imagePhotos.length > 0 && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setLightboxIndex(null)}
          >
            <X size={28} />
          </button>

          {imagePhotos.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black/30 rounded-full p-1"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => ((i ?? 0) - 1 + imagePhotos.length) % imagePhotos.length); }}
            >
              <ChevronLeft size={32} />
            </button>
          )}

          <img
            src={imagePhotos[lightboxIndex]?.signed_url}
            alt="Photo"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {imagePhotos.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black/30 rounded-full p-1"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => ((i ?? 0) + 1) % imagePhotos.length); }}
            >
              <ChevronRight size={32} />
            </button>
          )}

          {imagePhotos.length > 1 && (
            <p className="absolute bottom-6 text-white/70 text-sm">
              {(lightboxIndex ?? 0) + 1} / {imagePhotos.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
