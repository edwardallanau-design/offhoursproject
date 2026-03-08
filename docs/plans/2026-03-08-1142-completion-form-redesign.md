# Completion Form Redesign — Sliding Panel + Materials List + Photo Attachments

**Date:** 2026-03-08

## Context
The current completion form is a small inline section within the job detail panel. The user wants:
- "Scope of Work" instead of "Work Description"
- A dynamic materials list (name + cost per item, Add/Remove buttons) instead of a single `materials_cost` number
- The form to appear as a separate sliding panel (CSS transition) overlaying the job detail
- Ability to attach images and receipts (photos) for documentation
- Materials and photos visible in the completion info card after submission

## DB Migration Required
```sql
ALTER TABLE job_completions ADD COLUMN materials JSONB;
```
Add migration comment to `supabase-schema.sql`.

## Architecture Decisions
- **Materials storage**: `materials JSONB` column stores `[{name, cost}]`; server computes `materials_cost` as sum; `total_amount = labor_cost + materials_cost` (unchanged).
- **Photo upload**: Client uploads directly to Supabase Storage bucket `job-photos` using the authenticated `supabase` client. Path pattern: `{jobId}/{Date.now()}-{filename}`. Storage paths are included in `photo_paths[]` on the completion payload. Server already handles `photo_paths` in `completeJob`.
- **Storage RLS**: Supabase dashboard → Storage → job-photos bucket → add INSERT policy for `authenticated` role. Required before photo upload works.
- **Sliding panel**: `JobDetailPanel` root gets `relative overflow-hidden`. `JobCompletionPanel` renders as `absolute inset-0 bg-white overflow-y-auto z-10` with `translate-x-full → translate-x-0` CSS transition.

## Files to Modify

### 1. `supabase-schema.sql`
- Add `materials JSONB` column to `job_completions` table definition
- Add migration comment: `ALTER TABLE job_completions ADD COLUMN materials JSONB;`

### 2. `client/src/types/index.ts`
- Add `materials?: Array<{ name: string; cost: number }>` to `JobCompletion` interface

### 3. `server/src/controllers/jobs.controller.ts`
- Update `completeJobSchema`: replace `materials_cost: z.number()` with `materials: z.array(z.object({ name: z.string().min(1), cost: z.number().min(0) })).optional()`
- Update `completeJob` controller: `const materials_cost = body.materials?.reduce((s, m) => s + m.cost, 0) ?? 0;` then pass `materials: body.materials ?? []` to upsert

### 4. `client/src/hooks/useJobs.ts`
- Update `useCompleteJob` mutation type: remove `materials_cost`, add `materials?: Array<{ name: string; cost: number }>`
- Add `useJobPhotos(jobId)` hook: `GET /jobs/:jobId/photos` (endpoint already exists at `getJobPhotos`)

### 5. `client/src/components/jobs/JobCompletionPanel.tsx` (NEW FILE)
Self-contained sliding panel component. Props: `{ job: Job; onClose: () => void }`.

**Form schema**:
```ts
z.object({
  work_description: z.string().min(1, 'Required'),
  labor_cost: z.coerce.number().min(0),
  materials: z.array(z.object({
    name: z.string().min(1, 'Name required'),
    cost: z.coerce.number().min(0),
  })),
})
```

**Key implementation details**:
- `useFieldArray` for `materials` array; each row: `[Name input] [$Cost input] [Remove button]`; `[+ Add Material]` button at bottom of list
- Computed totals: materials subtotal (sum of costs), labour, grand total — displayed before submit button
- File state: `useState<File[]>([])` for selected files; `<input type="file" multiple accept="image/*,.pdf">` rendered as a styled button; show image thumbnail previews + filename for PDFs
- On submit: upload each file to `supabase.storage.from('job-photos').upload(...)` → collect paths → call `completeMutation.mutateAsync({ work_description, labor_cost, materials, photo_paths })`
- Slide animation: component root has `transition-transform duration-300 ease-in-out translate-x-full`; `useEffect + requestAnimationFrame` switches to `translate-x-0` after mount

**Layout (top to bottom)**:
1. Header: `[← Back]` button + "Submit Completion & Invoice" title
2. Scope of Work (labeled "Scope of Work *") — textarea
3. Materials Used section — field array + Add button + subtotal
4. Labour Cost — number input
5. Cost summary box (Materials / Labour / Total)
6. Attachments — file input + preview grid
7. Submit (green) button

### 6. `client/src/components/jobs/JobDetailPanel.tsx`
- Wrap entire returned JSX in `<div className="relative overflow-hidden">` outer wrapper
- Add `showCompletionPanel` boolean state (replaces `showCompleteForm`)
- Render `<JobCompletionPanel>` inside wrapper as `absolute inset-0 bg-white overflow-y-auto z-10` when `showCompletionPanel` is true; pass `onClose={() => setShowCompletionPanel(false)}`
- Change both "Submit Completion & Invoice" buttons (admin + contractor) to `setShowCompletionPanel(true)`
- Remove `completeSchema`, `completeForm`, and old inline completion form JSX
- Update completion info card:
  - Show `work_description` labeled "Scope of Work"
  - If `job.completion.materials?.length`, list each item: `{name} — ${cost}`
  - Keep Labour / Materials total / Total row
- Add a **separate Photos section** below the completion info card (not inside it):
  - Use `useJobPhotos(job.id)` — only renders if `job.completion` exists
  - Header: "Photos & Receipts" with a photo icon
  - Renders a thumbnail grid (e.g. 3 columns, `aspect-square object-cover rounded-lg`)
  - Clicking any thumbnail opens a **lightbox/gallery popup** (full-screen overlay)
  - Lightbox: shows the full-size image centered, with Prev/Next arrow buttons to browse all photos, and a close (×) button. PDFs show a "View PDF" link instead of an image.
  - Lightbox state: `useState<number | null>(null)` for the active index; `null` = closed

## Verification
1. Open a job with status `in_progress`; click "Submit Completion & Invoice" — panel slides in from right
2. Fill Scope of Work, add 2+ materials, set labour cost, attach an image
3. Submit — upload spinner then success toast; panel closes; job status → `completed`
4. Completion info card shows scope, materials list, and totals
5. Separate "Photos & Receipts" section below shows photo thumbnails
6. Click a thumbnail → lightbox opens with full-size image; Prev/Next arrows browse all; × closes
7. Validation: empty Scope of Work → inline error; material with empty name → row-level error
8. Cancel (back arrow) closes panel without submitting
