import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { type Job } from '../../types';
import { useBillStrata } from '../../hooks/useJobs';
import { useStrataManagers } from '../../hooks/useStrataManagers';

const billSchema = z.object({
  strata_manager_id: z.string().uuid('Select a strata manager'),
  amount: z.coerce.number().min(0.01, 'Amount required'),
  notes: z.string().optional(),
});

type BillData = z.infer<typeof billSchema>;

interface Props {
  job: Job;
  onClose: () => void;
}

export const JobBillPanel = ({ job, onClose }: Props) => {
  const [visible, setVisible] = useState(false);
  const billMutation = useBillStrata(job.id);
  const { data: strataManagers } = useStrataManagers();

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const form = useForm<BillData>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      strata_manager_id: job.strata_manager_id ?? '',
      amount: 0,
      notes: '',
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await billMutation.mutateAsync(data);
      toast.success('Strata manager billed successfully');
      handleClose();
    } catch {
      toast.error('Failed to send invoice');
    }
  });

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div
      className={`absolute inset-0 bg-white overflow-y-auto z-10 transition-transform duration-300 ease-in-out ${
        visible ? 'translate-x-0' : 'translate-x-full'
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
        <h3 className="font-semibold text-gray-900 text-sm">Bill Strata Manager</h3>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Strata Manager */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Strata Manager *</label>
          <select {...form.register('strata_manager_id')} className={inputClass}>
            <option value="">Select…</option>
            {(strataManagers ?? []).map((sm) => (
              <option key={sm.id} value={sm.id}>
                {sm.name} — {sm.company ?? sm.email}
              </option>
            ))}
          </select>
          {form.formState.errors.strata_manager_id && (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.strata_manager_id.message}</p>
          )}
        </div>

        {/* Contractor Invoice (read-only reference) */}
        {job.completion && (
          <div className="rounded-xl border bg-gray-50 p-3 space-y-1 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Contractor Invoice</p>
            <div className="flex justify-between text-gray-600">
              <span>Labour</span>
              <span>${job.completion.labor_cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Materials</span>
              <span>${job.completion.materials_cost.toFixed(2)}</span>
            </div>
            <div className="border-t pt-1 flex justify-between font-semibold text-gray-800">
              <span>Total</span>
              <span>${job.completion.total_amount.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Admin Fee */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Admin Fee ($) *</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              {...form.register('amount')}
              className={`${inputClass} pl-6`}
              placeholder="0.00"
            />
          </div>
          {form.formState.errors.amount && (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.amount.message}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Notes</label>
          <textarea rows={2} {...form.register('notes')} className={inputClass} placeholder="Optional notes…" />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={billMutation.isPending}
            className="flex-1 rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {billMutation.isPending ? 'Sending…' : 'Send Invoice'}
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
