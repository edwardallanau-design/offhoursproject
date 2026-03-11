import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Bold, Italic, List, Heading2 } from 'lucide-react';
import { type Job, type ServiceType } from '../../types';
import { useUpdateJob } from '../../hooks/useJobs';
import { useStrataManagers } from '../../hooks/useStrataManagers';

const editJobSchema = z.object({
  homeowner_name: z.string().min(1, 'Required'),
  homeowner_phone: z.string().min(1, 'Required'),
  homeowner_address: z.string().min(1, 'Required').regex(/^[a-zA-Z0-9\s,\-./]+$/, 'Only letters, numbers, and common punctuation'),
  suburb: z.string().min(1, 'Required').regex(/^[a-zA-Z0-9\s]+$/, 'Only letters, numbers, and spaces'),
  unit_number: z.string().regex(/^[a-zA-Z0-9]+$/, 'Only letters and numbers').optional().or(z.literal('')),
  service_type: z.enum(['plumbing', 'electrical', 'hvac', 'locksmith', 'appliance_repair', 'structural', 'other']),
  description: z.string().optional(),
  notes: z.string().optional(),
  strata_manager_id: z.string().optional(),
});

type EditJobData = z.infer<typeof editJobSchema>;

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'locksmith', label: 'Locksmith' },
  { value: 'appliance_repair', label: 'Appliance Repair' },
  { value: 'structural', label: 'Structural' },
  { value: 'other', label: 'Other' },
];

const applyFormat = (
  textarea: HTMLTextAreaElement,
  setValue: (name: 'description', value: string) => void,
  prefix: string,
  suffix: string,
  placeholder: string,
) => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const selected = value.substring(start, end) || placeholder;
  const newValue = value.substring(0, start) + prefix + selected + suffix + value.substring(end);
  setValue('description', newValue);
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
  }, 0);
};

interface Props {
  job: Job;
  onClose: () => void;
}

export const JobEditPanel = ({ job, onClose }: Props) => {
  const [visible, setVisible] = useState(false);
  const updateJobMutation = useUpdateJob(job.id);
  const { data: strataManagers } = useStrataManagers();
  const descRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const form = useForm<EditJobData>({
    resolver: zodResolver(editJobSchema),
    defaultValues: {
      homeowner_name: job.homeowner_name,
      homeowner_phone: job.homeowner_phone,
      homeowner_address: job.homeowner_address,
      suburb: job.suburb ?? '',
      unit_number: job.unit_number ?? '',
      service_type: job.service_type,
      description: job.description ?? '',
      notes: job.notes ?? '',
      strata_manager_id: job.strata_manager_id ?? '',
    },
  });

  const { ref: descRegRef, ...descRest } = form.register('description');

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      const payload = {
        ...data,
        unit_number: data.unit_number || undefined,
        strata_manager_id: data.strata_manager_id || null,
      };
      await updateJobMutation.mutateAsync(payload);
      toast.success('Job updated');
      handleClose();
    } catch {
      toast.error('Failed to update job');
    }
  });

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div
      className={`absolute inset-0 bg-white overflow-y-auto z-10 transition-transform duration-300 ease-in-out ${visible ? 'translate-x-0' : 'translate-x-full'
        }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3 sticky top-0 bg-white z-10">
        <button
          type="button"
          onClick={handleClose}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h3 className="font-semibold text-gray-900 text-sm">Edit Job Details</h3>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Client Name & Phone */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Client Name *</label>
            <input {...form.register('homeowner_name')} className={inputClass} />
            {form.formState.errors.homeowner_name && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.homeowner_name.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Client Phone *</label>
            <input {...form.register('homeowner_phone')} type="tel" className={inputClass} />
            {form.formState.errors.homeowner_phone && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.homeowner_phone.message}</p>
            )}
          </div>
        </div>

        {/* Address & Suburb */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Street Address *</label>
            <input {...form.register('homeowner_address')} className={inputClass} placeholder="123 Main St" />
            {form.formState.errors.homeowner_address && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.homeowner_address.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Suburb *</label>
            <input {...form.register('suburb')} className={inputClass} placeholder="South Yarra" />
            {form.formState.errors.suburb && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.suburb.message}</p>
            )}
          </div>
        </div>

        {/* Unit & Service Type */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Unit</label>
            <input {...form.register('unit_number')} className={inputClass} placeholder="e.g. 4B (optional)" />
            {form.formState.errors.unit_number && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.unit_number.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Service Type</label>
            <select {...form.register('service_type')} className={inputClass}>
              {SERVICE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description with markdown toolbar */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Description</label>
          <div className="rounded-lg border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
            <div className="flex items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
              {([
                { icon: <Bold size={12} />, prefix: '**', suffix: '**', placeholder: 'bold text' },
                { icon: <Italic size={12} />, prefix: '*', suffix: '*', placeholder: 'italic text' },
                { icon: <Heading2 size={12} />, prefix: '## ', suffix: '', placeholder: 'Heading' },
                { icon: <List size={12} />, prefix: '\n- ', suffix: '', placeholder: 'list item' },
              ] as const).map((btn, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => descRef.current && applyFormat(descRef.current, form.setValue, btn.prefix, btn.suffix, btn.placeholder)}
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                >
                  {btn.icon}
                </button>
              ))}
            </div>
            <textarea
              {...descRest}
              ref={(e) => { descRegRef(e); descRef.current = e; }}
              rows={4}
              className="w-full px-3 py-2 text-sm focus:outline-none resize-none bg-white"
              placeholder="Describe the issue..."
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Notes <span className="text-xs font-normal text-gray-400">(internal)</span>
          </label>
          <textarea {...form.register('notes')} rows={2} className={inputClass} placeholder="Internal notes..." />
        </div>

        {/* Strata Manager */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Strata Manager</label>
          <select {...form.register('strata_manager_id')} className={inputClass}>
            <option value="">None</option>
            {(strataManagers ?? []).map((sm) => (
              <option key={sm.id} value={sm.id}>{sm.name} — {sm.company ?? sm.email}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={updateJobMutation.isPending}
            className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {updateJobMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
