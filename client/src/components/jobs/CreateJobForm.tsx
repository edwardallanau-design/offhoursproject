import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateJob } from '../../hooks/useJobs';
import { useStrataManagers } from '../../hooks/useStrataManagers';
import toast from 'react-hot-toast';
import { Bold, Italic, List, Heading2 } from 'lucide-react';

const schema = z.object({
  homeowner_name: z.string().min(1, 'Required'),
  homeowner_phone: z.string().min(1, 'Required'),
  homeowner_address: z.string().min(1, 'Required').regex(/^[a-zA-Z0-9\s,\-.\/]+$/, 'Only letters, numbers, and common punctuation'),
  suburb: z.string().min(1, 'Required').regex(/^[a-zA-Z0-9\s]+$/, 'Only letters, numbers, and spaces'),
  unit_number: z.string().regex(/^[a-zA-Z0-9]+$/, 'Only letters and numbers').optional().or(z.literal('')),
  service_type: z.enum(['plumbing', 'electrical', 'hvac', 'locksmith', 'appliance_repair', 'structural', 'other']),
  description: z.string().optional(),
  notes: z.string().optional(),
  strata_manager_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSuccess: () => void;
}

const SERVICE_TYPES = [
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

export const CreateJobForm = ({ onSuccess }: Props) => {
  const { mutateAsync, isPending } = useCreateJob();
  const { data: strataManagers } = useStrataManagers();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { service_type: 'plumbing' },
  });

  const { ref: descRegRef, ...descRest } = register('description');

  const onSubmit = async (data: FormData) => {
    try {
      await mutateAsync(data);
      toast.success('Job created successfully');
      onSuccess();
    } catch {
      toast.error('Failed to create job');
    }
  };

  const handleFormat = (prefix: string, suffix: string, placeholder: string) => {
    if (textareaRef.current) {
      applyFormat(textareaRef.current, setValue, prefix, suffix, placeholder);
    }
  };

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700';
  const errorClass = 'mt-1 text-xs text-red-600';
  const toolbarBtnClass = 'rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Client Name *</label>
          <input {...register('homeowner_name')} className={inputClass} />
          {errors.homeowner_name && <p className={errorClass}>{errors.homeowner_name.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Client Phone *</label>
          <input {...register('homeowner_phone')} type="tel" className={inputClass} />
          {errors.homeowner_phone && <p className={errorClass}>{errors.homeowner_phone.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Street Address *</label>
          <input {...register('homeowner_address')} className={inputClass} placeholder="123 Main St" />
          {errors.homeowner_address && <p className={errorClass}>{errors.homeowner_address.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Suburb *</label>
          <input {...register('suburb')} className={inputClass} placeholder="South Yarra" />
          {errors.suburb && <p className={errorClass}>{errors.suburb.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Unit Number</label>
          <input {...register('unit_number')} className={inputClass} placeholder="e.g. 4B (optional)" />
          {errors.unit_number && <p className={errorClass}>{errors.unit_number.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Service Type *</label>
          <select {...register('service_type')} className={inputClass}>
            {SERVICE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <div className="rounded-lg border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
          <div className="flex items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
            <button type="button" onClick={() => handleFormat('**', '**', 'bold text')} className={toolbarBtnClass} title="Bold">
              <Bold size={13} />
            </button>
            <button type="button" onClick={() => handleFormat('*', '*', 'italic text')} className={toolbarBtnClass} title="Italic">
              <Italic size={13} />
            </button>
            <div className="mx-1 h-4 w-px bg-gray-300" />
            <button type="button" onClick={() => handleFormat('## ', '', 'Heading')} className={toolbarBtnClass} title="Heading">
              <Heading2 size={13} />
            </button>
            <button type="button" onClick={() => handleFormat('\n- ', '', 'list item')} className={toolbarBtnClass} title="Bullet list">
              <List size={13} />
            </button>
          </div>
          <textarea
            {...descRest}
            ref={(e) => {
              descRegRef(e);
              textareaRef.current = e;
            }}
            rows={4}
            className="w-full px-3 py-2 text-sm focus:outline-none resize-none bg-white"
            placeholder="Describe the issue... (supports **bold**, *italic*, ## headings, - lists)"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>
          Notes <span className="text-xs font-normal text-gray-400">(internal, not shown to contractors)</span>
        </label>
        <textarea {...register('notes')} rows={2} className={inputClass} placeholder="Internal notes..." />
      </div>

      {strataManagers && strataManagers.length > 0 && (
        <div>
          <label className={labelClass}>Strata Manager (optional)</label>
          <select {...register('strata_manager_id')} className={inputClass}>
            <option value="">None</option>
            {strataManagers.map((sm) => (
              <option key={sm.id} value={sm.id}>{sm.name} — {sm.company ?? sm.email}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isPending ? 'Creating…' : 'Create Job'}
        </button>
      </div>
    </form>
  );
};
