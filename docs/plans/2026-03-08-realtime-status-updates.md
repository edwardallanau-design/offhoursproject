# Real-Time Status Updates via Supabase Realtime

**Date:** 2026-03-08

## Context
Job statuses only updated when the page was manually refreshed or when the current user performed a mutation. Changes from other users (e.g. contractors accepting jobs) were not reflected live.

## Prerequisites
Realtime must be enabled on `jobs` and `billing_records` tables in the Supabase dashboard (Table Editor → table → Realtime toggle).

## Changes
- `client/src/hooks/useJobs.ts` — added `useJobsRealtime()` hook that subscribes to `postgres_changes` on `jobs` and `billing_records` tables; on any event calls `qc.invalidateQueries({ queryKey: ['jobs'] })`
- `client/src/components/layout/AppLayout.tsx` — calls `useJobsRealtime()` so a single subscription is active for the entire session across all pages/roles
