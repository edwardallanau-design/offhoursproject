import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateJob } from '../../hooks/useJobs';
import { AppLayout } from '../../components/layout/AppLayout';
import toast from 'react-hot-toast';

const schema = z.object({
  homeowner_name: z.string().min(1, 'Required'),
  homeowner_phone: z.string().min(1, 'Required'),
  homeowner_address: z.string().min(1, 'Required'),
  unit_number: z.string().optional(),
  service_type: z.enum(['plumbing', 'electrical', 'hvac', 'locksmith', 'appliance_repair', 'structural', 'other']),
  description: z.string().optional(),
});

const SERVICE_TYPES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'locksmith', label: 'Locksmith' },
  { value: 'appliance_repair', label: 'Appliance Repair' },
  { value: 'structural', label: 'Structural' },
  { value: 'other', label: 'Other' },
];

export const NewRequest = () => {
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useCreateJob();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { service_type: 'plumbing' as const },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      await mutateAsync(data);
      toast.success('Service request submitted');
      navigate('/owner');
    } catch {
      toast.error('Failed to submit request');
    }
  };

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <AppLayout>
      <div className="max-w-lg">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">New Service Request</h1>
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Your Name *</label>
              <input {...register('homeowner_name')} className={inputClass} />
              {errors.homeowner_name && <p className="mt-1 text-xs text-red-600">{errors.homeowner_name.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone *</label>
              <input type="tel" {...register('homeowner_phone')} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Address *</label>
              <input {...register('homeowner_address')} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Unit Number</label>
              <input {...register('unit_number')} className={inputClass} placeholder="Optional" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Service Type *</label>
              <select {...register('service_type')} className={inputClass}>
                {SERVICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Description of Issue</label>
              <textarea rows={4} {...register('description')} className={inputClass} placeholder="Describe the problem in detail..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate('/owner')} className="flex-1 rounded-lg border py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={isPending} className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                {isPending ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};
