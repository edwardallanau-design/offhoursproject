# Admin — Edit Job Details

**Date:** 2026-03-08

## Context
Admins have no way to edit job details after creation. Mistakes in client name, address, phone, service type, description, or notes require direct DB access. A `PATCH /jobs/:id` endpoint and an inline edit form in the job detail panel are needed.

## Editable Fields
- `homeowner_name`, `homeowner_phone`, `homeowner_address`, `unit_number`
- `service_type`
- `description` (markdown, with toolbar)
- `notes` (plain internal text)

## Server Changes

### `server/src/controllers/jobs.controller.ts`
Add an `updateJobSchema` (all fields optional) and `updateJob` handler, following the same pattern as `updateContractor` in `contractors.controller.ts`:

```ts
const updateJobSchema = z.object({
  homeowner_name: z.string().min(1).optional(),
  homeowner_phone: z.string().min(1).optional(),
  homeowner_address: z.string().min(1).optional(),
  unit_number: z.string().optional(),
  service_type: z.enum([...]).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export const updateJob = async (req, res) => {
  const body = updateJobSchema.parse(req.body);
  const id = param(req, 'id');
  const { data, error } = await supabase.from('jobs').update(body).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  if (!data) return sendError(res, 404, 'Job not found', 'NOT_FOUND');
  sendSuccess(res, data);
};
```

### `server/src/routes/index.ts`
```ts
router.patch('/jobs/:id', authenticate, requireAdmin, asyncHandler(jobs.updateJob));
```

## Client Changes

### `client/src/hooks/useJobs.ts`
Add `useUpdateJob`:
```ts
export const useUpdateJob = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch(`/jobs/${jobId}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
};
```

### `client/src/components/jobs/JobDetailPanel.tsx`
- Admin only: add an "Edit Details" button (pencil icon) in the header area
- Toggle `showEditForm` state
- When editing: show an inline form replacing the contact info + description + notes sections
  - Same fields as CreateJobForm (name, phone, address, unit, service type, description with toolbar, notes)
  - Description textarea uses the same `ref` + `setValue` toolbar pattern from `CreateJobForm.tsx`
  - Save / Cancel buttons
- When not editing: show the existing read-only view

## Files Modified
1. `server/src/controllers/jobs.controller.ts`
2. `server/src/routes/index.ts`
3. `client/src/hooks/useJobs.ts`
4. `client/src/components/jobs/JobDetailPanel.tsx`

## Verification
- Create a job, open it in the detail panel, click Edit Details (admin only)
- Modify name, address, service type, description, notes — save
- Panel should update immediately (realtime + invalidation)
- Non-admin users should not see the Edit Details button
