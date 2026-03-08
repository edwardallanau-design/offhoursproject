# Billing Page — Chrome-Style Tabs

**Date:** 2026-03-08

## Context
The billing page tab navigation used rounded pill buttons with gaps. The user wanted it to look like Google Chrome tabs — connected, with the active tab merging into the content area below.

## Changes
- `client/src/pages/admin/AdminBillingPage.tsx`
  - Removed per-tab color classes (`tabActive`/`tabInactive`) from TABS config
  - Added colored dot per tab to preserve status color meaning (amber/green/red)
  - Changed tab bar from `flex flex-wrap gap-2` to `flex items-end gap-1 border-b border-gray-200`
  - Active tab: `bg-white border-gray-200 -mb-px z-10` (sits on top of border line)
  - Inactive tab: `bg-gray-100 border-transparent` (recessed)
  - Count shown as small pill badge inside the tab
