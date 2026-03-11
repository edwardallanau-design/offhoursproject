# Edit Invoice / Completion Details

**Date:** 2026-03-08

## Context
Once a job is marked `completed` and the invoice is submitted, there is currently no way to correct mistakes in the scope of work, materials list, or labour cost. Admins and contractors both need to be able to update those details after submission.

## Approach

### Server — new PATCH endpoint
Add `PATCH /api/jobs/:id/completion` that updates an existing `job_completions` row **without** re-running the status transition (job is already `completed` or `billed`).

- Reuses `completeJobSchema` for validation (same shape: `work_description`, `labor_cost`, `materials?`, `photo_paths?`)
- Requires the completion record to already exist (returns 404 otherwise)
- Recomputes `materials_cost` and `total_amount` from the incoming data
- If `photo_paths` are provided, inserts additional rows into `job_photos` (add-only — no deletion)
- Auth: `requireRole('admin', 'contractor')`; contractor must be assigned to the job (same guard as `completeJob`)
- Route added to `server/src/routes/index.ts` before the generic `PATCH /jobs/:id`

### Client — edit mode in JobCompletionPanel
`JobCompletionPanel` gains an optional `mode: 'create' | 'edit'` prop (default `'create'`) and `initialData` prop.

When `mode === 'edit'`:
- Form is pre-filled from `initialData` (`work_description`, `labor_cost`, `materials`)
- Header title: "Edit Invoice"
- Submit calls `useUpdateCompletion(jobId)` (`PATCH /jobs/:id/completion`) instead of `useCompleteJob`
- Photos section shows a note "N photo(s) already attached" (read-only count) + allows adding more new photos
- Submit button label: "Save Changes"

### Client — edit trigger in JobDetailPanel
- Add a pencil icon button beside the "Invoice" heading in the completion info card, visible to `admin` and `contractor` (contractor only if they are the assigned contractor)
- Clicking it sets `showCompletionPanel(true)` with `editMode = true`
- Pass `initialData={job.completion}` to `JobCompletionPanel`

## Files to Modify

### 1. `server/src/controllers/jobs.controller.ts`
Add `updateCompletion` controller:
```ts
export const updateCompletion = async (req, res) => {
  const body = completeJobSchema.parse(req.body);  // reuse existing schema
  const jobId = param(req, 'id');
  const job = await getJobById(jobId);
  if (!job) return sendError(res, 404, ...);
  if (!job.completion) return sendError(res, 404, 'No completion record found', 'NOT_FOUND');

  // Contractor guard — same as completeJob
  if (req.role === 'contractor') {
    const assignment = ...;
    if (!assignment || assignment.contractor?.id !== req.contractorId)
      return sendError(res, 403, ...);
  }

  const materials_cost = (body.materials ?? []).reduce((s, m) => s + m.cost, 0);
  const total_amount = body.labor_cost + materials_cost;

  await supabase.from('job_completions').update({
    work_description: body.work_description,
    labor_cost: body.labor_cost,
    materials_cost,
    materials: body.materials ?? [],
    total_amount,
  }).eq('job_id', jobId);

  if (body.photo_paths?.length) {
    await supabase.from('job_photos').insert(
      body.photo_paths.map(path => ({ job_id: jobId, storage_path: path, uploaded_by: req.user!.id }))
    );
  }

  sendSuccess(res, await getJobById(jobId));
};
```

### 2. `server/src/routes/index.ts`
Add before the generic `PATCH /jobs/:id` route:
```ts
router.patch('/jobs/:id/completion', authenticate, requireRole('admin', 'contractor'), asyncHandler(jobs.updateCompletion));
```

### 3. `client/src/hooks/useJobs.ts`
Add `useUpdateCompletion(jobId)`:
```ts
export const useUpdateCompletion = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { work_description: string; labor_cost: number; materials?: ...; photo_paths?: string[] }) =>
      api.patch(`/jobs/${jobId}/completion`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
};
```

### 4. `client/src/components/jobs/JobCompletionPanel.tsx`
- Add props: `mode?: 'create' | 'edit'` (default `'create'`) and `initialData?: { work_description: string; labor_cost: number; materials?: Array<{name: string; cost: number}> }`
- Change `defaultValues` to use `initialData` when provided
- Use `useUpdateCompletion` when `mode === 'edit'`, `useCompleteJob` otherwise
- Header title: `mode === 'edit' ? 'Edit Invoice' : 'Submit Completion & Invoice'`
- Submit button: `mode === 'edit' ? 'Save Changes' : 'Submit Completion'`
- Photos section: when `mode === 'edit'`, show `{existingPhotoCount} photo(s) already attached` note above the file picker (existingPhotoCount passed as a prop)

### 5. `client/src/components/jobs/JobDetailPanel.tsx`
- Add `editMode` boolean state (default `false`)
- Change `showCompletionPanel` open handler to also set `editMode`
- When completion info card is shown (`job.completion` exists):
  - Add `<button>` with `<Pencil>` icon beside the "Invoice" heading
  - Visible if `role === 'admin'` OR (`role === 'contractor'` AND the user is the assigned contractor)
  - `onClick`: `setEditMode(true); setShowCompletionPanel(true)`
- Pass `mode={editMode ? 'edit' : 'create'}` and `initialData={job.completion}` to `JobCompletionPanel`
- Pass `existingPhotoCount={photosWithUrls.length}` to `JobCompletionPanel`
- On close/cancel: reset `editMode` to `false`

## Verification
1. Submit a completion on an `in_progress` job — works as before
2. Once `completed`, click the pencil icon on the Invoice card → panel slides in pre-filled with existing data
3. Change the scope of work, add a material, update labour — save → card updates immediately
4. Add a new photo in edit mode → appears in the Photos section after save
5. As a contractor (assigned), pencil icon is also visible and editable
6. As an unrelated contractor (not assigned), pencil icon is NOT shown
