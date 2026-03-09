# Plan: Fix Strata Manager "None" Not Reflecting After Save

## Context
When editing a job and changing the strata manager to "None" then saving, the edit panel still shows the old strata manager when reopened — a full page refresh is required to see the correct value. The opposite direction (None → a value) appears to update immediately. There are two distinct bugs causing this.

## Root Causes

### Bug 1 — Server strips `strata_manager_id` (primary bug)
`updateJobSchema` in `server/src/controllers/jobs.controller.ts` (line 22–31) does **not** include `strata_manager_id`. Zod's default `.parse()` strips unknown keys, so `strata_manager_id: null` sent from the client is never passed to the Supabase update. The DB column is therefore never changed.

The fact that a hard page refresh shows the correct value is likely because the Realtime subscription or some other mechanism eventually causes a refetch that coincidentally shows the unchanged DB state — or the user may be seeing inconsistent behavior between browser sessions.

### Bug 2 — Cache not immediately updated (secondary bug)
`useUpdateJob.onSuccess` calls `qc.invalidateQueries({ queryKey: ['jobs'] })`, which marks the query stale and triggers a **background** refetch. If the user closes and reopens the edit panel before the refetch completes, the `job` prop passed to `JobEditPanel` still contains the stale cached data, so `defaultValues` are set from the old value. This explains the asymmetry: non-null values might appear to update because the Realtime subscription fires and races the re-open.

## Fix

### 1. Server — add `strata_manager_id` to `updateJobSchema`
**File:** `server/src/controllers/jobs.controller.ts`

Add to `updateJobSchema`:
```ts
strata_manager_id: z.string().uuid().nullable().optional(),
```

### 2. Client — immediately set cache data from mutation response
**File:** `client/src/hooks/useJobs.ts`

Update `useUpdateJob.onSuccess` to update the cached jobs list immediately using the returned job data before invalidating, so the edit panel always opens with fresh data:

```ts
export const useUpdateJob = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.patch(`/jobs/${jobId}`, body),
    onSuccess: (response) => {
      const updatedJob = response.data?.data;
      if (updatedJob) {
        // Immediately update every cached jobs list that contains this job
        qc.setQueriesData<Job[]>({ queryKey: ['jobs'] }, (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((j) => (j.id === jobId ? { ...j, ...updatedJob } : j));
        });
      }
      // Also invalidate to trigger a background refetch for joined data
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};
```

Note: The mutation response (`data.data`) is the updated job row from `supabase.select().single()`. It contains scalar fields like `strata_manager_id` but not joined relations. Using spread (`{ ...j, ...updatedJob }`) preserves existing joined data (assignment, billing, etc.) while updating the scalar fields — sufficient for the edit panel's `defaultValues`.

## Files to Modify
- `server/src/controllers/jobs.controller.ts` — add `strata_manager_id` to `updateJobSchema`
- `client/src/hooks/useJobs.ts` — update `useUpdateJob.onSuccess`

## Verification
1. Open a job that has a strata manager set.
2. Open edit panel → change strata manager to "None" → Save.
3. Immediately reopen edit panel (without page refresh) → should show "None".
4. Change strata manager from "None" to a value → Save → reopen edit → should show the new value.
5. Confirm no console errors related to cache or network.
