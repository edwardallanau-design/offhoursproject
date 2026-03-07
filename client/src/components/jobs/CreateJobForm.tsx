import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateJob } from '../../hooks/useJobs';
import { useStrataManagers } from '../../hooks/useStrataManagers';
import toast from 'react-hot-toast';

const schema = z.object({
  homeowner_name: z.string().min(1, 'Required'),
  homeowner_phone: z.string().min(1, 'Required'),
  homeowner_address: z.string().min(1, 'Required'),
  unit_number: z.string().optional(),
  service_type: z.enum(['plumbing', 'electrical', 'hvac', 'locksmith', 'appliance_repair', 'structural', 'other']),
  description: z.string().optional(),
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

export const CreateJobForm = ({ onSuccess }: Props) => {
  const { mutateAsync, isPending } = useCreateJob();
  const { data: strataManagers } = useStrataManagers();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { service_type: 'plumbing' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await mutateAsync(data);
      toast.success('Job created successfully');
      onSuccess();
    } catch {
      toast.error('Failed to create job');
    }
  };

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700';
  const errorClass = 'mt-1 text-xs text-red-600';

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

      <div>
        <label className={labelClass}>Address *</label>
        <input {...register('homeowner_address')} className={inputClass} />
        {errors.homeowner_address && <p className={errorClass}>{errors.homeowner_address.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Unit Number</label>
          <input {...register('unit_number')} className={inputClass} placeholder="Optional" />
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
        <textarea {...register('description')} rows={3} className={inputClass} placeholder="Details about the issue..." />
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
