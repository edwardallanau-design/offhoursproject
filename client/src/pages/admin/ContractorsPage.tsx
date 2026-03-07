import { useState } from 'react';
import { useContractors, useCreateContractor, useUpdateContractor } from '../../hooks/useContractors';
import { Modal } from '../../components/shared/Modal';
import { AppLayout } from '../../components/layout/AppLayout';
import type { Contractor } from '../../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { UserPlus, Phone, Mail, Wrench, Check, X } from 'lucide-react';

const createSchema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Required'),
  trade: z.string().optional(),
  temporary_password: z.string().min(8, 'Min 8 characters'),
});

const TRADES = ['Plumber', 'Electrician', 'HVAC Technician', 'Locksmith', 'Appliance Repair', 'Structural', 'General Handyman'];

export const ContractorsPage = () => {
  const { data: contractors = [], isLoading } = useContractors(false);
  const createMutation = useCreateContractor();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Contractor | null>(null);

  const form = useForm({ resolver: zodResolver(createSchema) });
  const updateMutation = useUpdateContractor(editing?.id ?? '');

  const handleCreate = async (data: z.infer<typeof createSchema>) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Contractor created');
      setShowCreate(false);
      form.reset();
    } catch {
      toast.error('Failed to create contractor');
    }
  };

  const handleToggleActive = async (c: Contractor) => {
    try {
      await updateMutation.mutateAsync({ is_active: !c.is_active });
      toast.success(c.is_active ? 'Contractor deactivated' : 'Contractor activated');
      setEditing(null);
    } catch {
      toast.error('Failed to update');
    }
  };

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contractors</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <UserPlus size={16} />
          Add Contractor
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : contractors.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border bg-white text-gray-400">
          No contractors yet
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contractors.map((c) => (
            <div key={c.id} className={`rounded-xl border bg-white p-4 shadow-sm ${!c.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{c.name}</p>
                  {c.trade && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <Wrench size={11} />
                      <span>{c.trade}</span>
                    </div>
                  )}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-1 mt-3">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Phone size={12} /><span>{c.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Mail size={12} /><span className="truncate">{c.email}</span>
                </div>
              </div>
              <button
                onClick={() => { setEditing(c); handleToggleActive(c); }}
                className={`mt-3 w-full rounded-lg py-1.5 text-xs font-medium ${c.is_active ? 'border border-red-300 text-red-600 hover:bg-red-50' : 'border border-green-300 text-green-700 hover:bg-green-50'}`}
              >
                {c.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="Add Contractor" onClose={() => { setShowCreate(false); form.reset(); }}>
          <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Full Name *</label>
              <input {...form.register('name')} className={inputClass} />
              {form.formState.errors.name && <p className="mt-1 text-xs text-red-600">{form.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
              <input type="email" {...form.register('email')} className={inputClass} />
              {form.formState.errors.email && <p className="mt-1 text-xs text-red-600">{form.formState.errors.email.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone *</label>
              <input type="tel" {...form.register('phone')} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Trade</label>
              <select {...form.register('trade')} className={inputClass}>
                <option value="">Select trade…</option>
                {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Temporary Password *</label>
              <input type="password" {...form.register('temporary_password')} className={inputClass} />
              {form.formState.errors.temporary_password && <p className="mt-1 text-xs text-red-600">{form.formState.errors.temporary_password.message}</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={createMutation.isPending} className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                {createMutation.isPending ? 'Creating…' : 'Create Contractor'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
};
