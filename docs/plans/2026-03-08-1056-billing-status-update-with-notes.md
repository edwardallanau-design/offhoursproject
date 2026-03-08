# Billing — Inline Status Update with Notes

**Date:** 2026-03-08

## Context
Billing cards had status buttons permanently visible at the bottom of every card. The user wanted to remove them and replace with a flow that also allows leaving a note when changing status.

## Changes
- `server/src/controllers/jobs.controller.ts` — `updateBillingPaymentStatus` now accepts optional `notes` field and saves it
- `client/src/hooks/useJobs.ts` — `useUpdateBillingPaymentStatus` payload changed from `string` to `{ payment_status, notes? }`
- `client/src/pages/admin/AdminBillingPage.tsx`
  - Removed `STATUS_BUTTONS` constant
  - Added `editing` state + `pendingStatus` + `pendingNotes` state to `BillingCard`
  - "Update status" link (pencil icon) toggles an inline edit panel
  - Edit panel: status selector buttons + notes textarea + Save/Cancel
