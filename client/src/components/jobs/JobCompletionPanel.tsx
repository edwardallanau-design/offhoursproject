import { useEffect, useState } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Paperclip, X, Loader2 } from 'lucide-react';
import { type Job } from '../../types';
import { useCompleteJob, useUpdateCompletion } from '../../hooks/useJobs';
import { supabase } from '../../lib/supabase';

const completionSchema = z.object({
  work_description: z.string().min(1, 'Scope of work is required'),
  labor_cost: z.coerce.number().min(0, 'Must be 0 or more'),
  materials: z.array(
    z.object({
      name: z.string().min(1, 'Name required'),
      cost: z.coerce.number().min(0, 'Must be 0 or more'),
    }),
  ),
});

type CompletionData = z.infer<typeof completionSchema>;

interface Props {
  job: Job;
  onClose: () => void;
  mode?: 'create' | 'edit';
  initialData?: {
    work_description: string;
    labor_cost: number;
    materials?: Array<{ name: string; cost: number }>;
  };
  existingPhotoCount?: number;
}

export const JobCompletionPanel = ({
  job,
  onClose,
  mode = 'create',
  initialData,
  existingPhotoCount = 0,
}: Props) => {
  const [visible, setVisible] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const completeMutation = useCompleteJob(job.id);
  const updateMutation = useUpdateCompletion(job.id);

  const isEdit = mode === 'edit';
  const activeMutation = isEdit ? updateMutation : completeMutation;

  // Slide in after mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const form = useForm<CompletionData>({
    resolver: zodResolver(completionSchema) as Resolver<CompletionData>,
    defaultValues: {
      work_description: initialData?.work_description ?? '',
      labor_cost: initialData?.labor_cost ?? 0,
      materials: initialData?.materials ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'materials' });

  const watchedMaterials = form.watch('materials');
  const watchedLabour = form.watch('labor_cost');
  const materialsSubtotal = (watchedMaterials ?? []).reduce((s, m) => s + (Number(m.cost) || 0), 0);
  const grandTotal = (Number(watchedLabour) || 0) + materialsSubtotal;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    if (selected.length) setFiles((prev) => [...prev, ...selected]);
    // Reset so the same file can be re-selected
    e.currentTarget.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    setUploading(true);
    const photo_paths: string[] = [];

    try {
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = `${job.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('job-photos').upload(path, file);
        if (error) throw new Error(`Upload failed: ${error.message}`);
        photo_paths.push(path);
      }
    } catch (err) {
      setUploading(false);
      toast.error(err instanceof Error ? err.message : 'File upload failed');
      return;
    }

    setUploading(false);

    try {
      await activeMutation.mutateAsync({
        work_description: data.work_description,
        labor_cost: data.labor_cost,
        materials: data.materials,
        photo_paths: photo_paths.length ? photo_paths : undefined,
      });
      toast.success(isEdit ? 'Invoice updated' : 'Job completed and invoice submitted');
      handleClose();
    } catch {
      toast.error(isEdit ? 'Failed to update invoice' : 'Failed to submit completion');
    }
  });

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  const isPending = uploading || activeMutation.isPending;

  return (
    <div
      className={`absolute inset-0 bg-white overflow-y-auto z-10 transition-transform duration-300 ease-in-out ${
        visible ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3 sticky top-0 bg-white z-10">
        <button
          onClick={handleClose}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h3 className="font-semibold text-gray-900 text-sm">
          {isEdit ? 'Edit Invoice' : 'Submit Completion & Invoice'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-5">
        {/* Scope of Work */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Scope of Work <span className="text-red-500">*</span>
          </label>
          <textarea
            {...form.register('work_description')}
            rows={4}
            className={inputClass}
            placeholder="Describe the work performed..."
          />
          {form.formState.errors.work_description && (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.work_description.message}</p>
          )}
        </div>

        {/* Materials Used */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-700">Materials Used</label>
            {materialsSubtotal > 0 && (
              <span className="text-xs text-gray-500">Subtotal: ${materialsSubtotal.toFixed(2)}</span>
            )}
          </div>

          {fields.length > 0 && (
            <div className="space-y-2 mb-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input
                      {...form.register(`materials.${index}.name`)}
                      className={inputClass}
                      placeholder="Material name"
                    />
                    {form.formState.errors.materials?.[index]?.name && (
                      <p className="mt-0.5 text-xs text-red-600">
                        {form.formState.errors.materials[index]?.name?.message}
                      </p>
                    )}
                  </div>
                  <div className="w-28">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register(`materials.${index}.cost`)}
                        className={`${inputClass} pl-6`}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="mt-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => append({ name: '', cost: 0 })}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus size={15} />
            Add Material
          </button>
        </div>

        {/* Labour Cost */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Labour Cost ($)</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              {...form.register('labor_cost')}
              className={`${inputClass} pl-6`}
            />
          </div>
        </div>

        {/* Cost Summary */}
        <div className="rounded-xl border bg-gray-50 p-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Materials</span>
            <span>${materialsSubtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Labour</span>
            <span>${(Number(watchedLabour) || 0).toFixed(2)}</span>
          </div>
          <div className="border-t pt-1.5 flex justify-between font-semibold text-gray-900">
            <span>Total</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Attachments */}
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-700">Photos &amp; Receipts</label>

          {isEdit && existingPhotoCount > 0 && (
            <p className="mb-2 text-xs text-gray-500">
              {existingPhotoCount} photo{existingPhotoCount !== 1 ? 's' : ''} already attached. Add more below.
            </p>
          )}

          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              {files.map((file, i) => (
                <div key={i} className="relative group">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full aspect-square object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-lg border bg-gray-100 flex flex-col items-center justify-center gap-1 p-2">
                      <Paperclip size={18} className="text-gray-400" />
                      <span className="text-xs text-gray-500 text-center break-all leading-tight line-clamp-2">
                        {file.name}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-1.5 -right-1.5 bg-white border rounded-full p-0.5 shadow text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors w-full justify-center cursor-pointer">
            <Paperclip size={15} />
            Attach photos or receipts
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          >
            {isPending && <Loader2 size={15} className="animate-spin" />}
            {uploading ? 'Uploading…' : isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Submit Completion'}
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
