# Add Suburb Field + Alphanumeric Validation on Address Fields

**Date:** 2026-03-08

## Context
Address fields need a separate suburb field and alphanumeric validation. Unit number in particular should be strictly alphanumeric (no special chars). Address and suburb should also be constrained to reasonable address characters.

## DB Migration Required
```sql
ALTER TABLE jobs ADD COLUMN suburb text;
```

## Validation Rules
- `unit_number`: strictly alphanumeric only — `/^[a-zA-Z0-9]+$/` (e.g. "4B", "10")
- `homeowner_address`: alphanumeric + common address punctuation — `/^[a-zA-Z0-9\s,\-.\/]+$/`
- `suburb`: alphanumeric + spaces — `/^[a-zA-Z0-9\s]+$/`

## Files to Modify

### 1. `client/src/types/index.ts`
Add `suburb: string | null` to the `Job` interface.

### 2. `server/src/controllers/jobs.controller.ts`
- Add alphanumeric regex validation to `unit_number`, `homeowner_address`, and suburb in both `createJobSchema` and `updateJobSchema`
- Add `suburb` to both schemas

### 3. `client/src/components/jobs/CreateJobForm.tsx`
- Add `suburb` to zod schema with alphanumeric+spaces validation
- Add `suburb` field in the form layout (next to address, before unit/service type row)
- Add regex validation for `unit_number` and `homeowner_address`

### 4. `client/src/components/jobs/JobDetailPanel.tsx`
- Add `suburb` to `editJobSchema`
- Add `suburb` field in the edit form (next to address)
- Add `suburb` to `defaultValues` in `editForm`
- Update read-only contact info display to show suburb after address

### 5. `client/src/components/jobs/JobCard.tsx`
- Show suburb after address: `{job.homeowner_address}{job.suburb ? `, ${job.suburb}` : ''}`

## Form Layout for Address Section (Create & Edit)
```
[ Street Address *        ] [ Suburb *    ]
[ Unit Number (optional)  ] [ Service Type ]
```

## Verification
- Create a job with suburb, verify it saves and displays correctly
- Try entering a non-alphanumeric unit number (e.g. "4!") — should be rejected
- Edit an existing job and update suburb
- JobCard and detail panel should both show suburb
