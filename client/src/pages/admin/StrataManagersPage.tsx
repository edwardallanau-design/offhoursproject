import { useState } from 'react';
import { useStrataManagers, useCreateStrataManager } from '../../hooks/useStrataManagers';
import { Modal } from '../../components/shared/Modal';
import { AppLayout } from '../../components/layout/AppLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { UserPlus, Phone, Mail, Building2 } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Required'),
  company: z.string().optional(),
  temporary_password: z.string().min(8, 'Min 8 characters'),
});

export const StrataManagersPage = () => {
  const { data: managers = [], isLoading } = useStrataManagers();
  const createMutation = useCreateStrataManager();
  const [showCreate, setShowCreate] = useState(false);
  const form = useForm({ resolver: zodResolver(schema) });

  const handleCreate = async (data: z.infer<typeof schema>) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Strata manager created');
      setShowCreate(false);
      form.reset();
    } catch {
      toast.error('Failed to create strata manager');
    }
  };

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Strata Managers</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          <UserPlus size={16} />
          Add Manager
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : managers.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border bg-white text-gray-400">No strata managers yet</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {managers.map((m) => (
            <div key={m.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="font-semibold text-gray-900">{m.name}</p>
              {m.company && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                  <Building2 size={11} /><span>{m.company}</span>
                </div>
              )}
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-600"><Phone size={12} /><span>{m.phone}</span></div>
                <div className="flex items-center gap-2 text-xs text-gray-600"><Mail size={12} /><span className="truncate">{m.email}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="Add Strata Manager" onClose={() => { setShowCreate(false); form.reset(); }}>
          <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Full Name *</label>
              <input {...form.register('name')} className={inputClass} />
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
              <label className="mb-1 block text-sm font-medium text-gray-700">Company</label>
              <input {...form.register('company')} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Temporary Password *</label>
              <input type="password" {...form.register('temporary_password')} className={inputClass} />
              {form.formState.errors.temporary_password && <p className="mt-1 text-xs text-red-600">{form.formState.errors.temporary_password.message}</p>}
            </div>
            <button type="submit" disabled={createMutation.isPending} className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {createMutation.isPending ? 'Creating…' : 'Create Strata Manager'}
            </button>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
};
