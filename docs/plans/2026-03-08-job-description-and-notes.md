# Job Description (Markdown) + Internal Notes

**Date:** 2026-03-08

## Context
The job creation form had a single combined description/notes textarea. The user wanted them separated, with description supporting rich formatting (markdown) shown in the detail panel, and notes as a plain internal field.

## DB Migration Required
```sql
ALTER TABLE jobs ADD COLUMN notes text;
```

## Changes
- `client/src/types/index.ts` — added `notes: string | null` to `Job` interface
- `server/src/controllers/jobs.controller.ts` — added `notes` to `createJobSchema`
- `client/package.json` — added `react-markdown@^10.1.0`
- `client/src/components/shared/MarkdownContent.tsx` — new shared component wrapping `react-markdown` with compact/full modes
- `client/src/components/jobs/CreateJobForm.tsx`
  - Description field: markdown toolbar (Bold, Italic, Heading, Bullet) + textarea using `register` + ref combo
  - Notes field: separate plain textarea labeled "internal"
- `client/src/components/jobs/JobCard.tsx` — description and notes NOT shown on cards (only in detail panel)
- `client/src/components/jobs/JobDetailPanel.tsx`
  - Description: rendered as markdown in white card
  - Notes: shown in amber "Internal Notes" card with sticky-note icon
