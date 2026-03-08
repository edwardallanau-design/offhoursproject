# Edit Job Details — Sliding Panel

**Date:** 2026-03-09

## Context
The inline edit form for job details (toggled by the pencil icon in the header) breaks the visual flow — it expands within the same panel, pushing all other content down. The user wants it to transition as a separate sliding panel, matching the same UX pattern as the completion/invoice form.

## Approach
Extract the inline edit form out of `JobDetailPanel` into a new `JobEditPanel` component that slides in from the right using the same `absolute inset-0 / translate-x-full → translate-x-0` pattern as `JobCompletionPanel`.

## Files to Modify

### 1. `client/src/components/jobs/JobEditPanel.tsx` (NEW FILE)
Self-contained sliding panel. Props: `{ job: Job; onClose: () => void }`.

- Same slide-in animation as `JobCompletionPanel`: root div is `absolute inset-0 bg-white overflow-y-auto z-10 transition-transform duration-300 ease-in-out`; `useEffect + requestAnimationFrame` flips from `translate-x-full` → `translate-x-0`; close animates back then calls `onClose` after 300ms
- Sticky header with `[← Back]` button + "Edit Job Details" title (same header pattern as `JobCompletionPanel`)
- Body: the entire edit form that currently lives inline in `JobDetailPanel` — all fields (Client Name, Phone, Street Address, Suburb, Unit, Service Type, Description with markdown toolbar, Notes), validation, and Save/Cancel buttons
- On successful save: calls `onClose()` (the slide-out handles itself)
- Imports: `useUpdateJob` from `useJobs`, `applyFormat` helper (move to module level or duplicate inline), all the same zod schema and types

### 2. `client/src/components/jobs/JobDetailPanel.tsx`
- Remove `showEditForm` state → replace with `showEditPanel` state
- Remove the entire inline `{showEditForm ? (<form>...</form>) : (<>contact/description/notes</>)}` block — replace the conditional entirely with always rendering the read-only contact/description/notes view
- Remove the edit form's local state (`editForm`, `editDescRef`, `editDescRegRef`, `editDescRest`, `handleEditSubmit`, `applyFormat` function, `editJobSchema`, `EditJobData` type, `SERVICE_TYPES` array) — these all move into `JobEditPanel`
- The pencil "Edit" button in the header now sets `setShowEditPanel(true)` (and its label changes to just "Edit" — no cancel toggle needed)
- Add `<JobEditPanel>` inside the `relative overflow-hidden` wrapper (same placement as `<JobCompletionPanel>`)
- Remove imports that are only used by the edit form: `Bold`, `Italic`, `List`, `Heading2` (unless used elsewhere)

## Key Reuse
- Same slide animation pattern as `JobCompletionPanel` — copy the `visible` state + `useEffect(requestAnimationFrame)` + `handleClose` pattern verbatim
- Same sticky header with `ArrowLeft` back button
- Same `inputClass` string
- `applyFormat` helper and `editJobSchema` + `SERVICE_TYPES` move entirely into `JobEditPanel` (no need to share)

## Verification
1. Click pencil icon → "Edit Job Details" panel slides in from right over the job detail view
2. Edit a field, click "Save Changes" → panel slides out, updated values appear in job detail
3. Click "← Back" without saving → panel slides out, no changes
4. While edit panel is open, the main job detail content is hidden behind it (not visible)
5. Completion panel still works independently (both panels can't be open simultaneously — existing state keeps them separate)
