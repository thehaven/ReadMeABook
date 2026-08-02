# OpenSpec Proposal: Fix Downloaded Status UI Classification & Duplicate Download Block

## Why

1. **Frontend Status Misclassification**: In `AudiobookCard.tsx` and `AudiobookDetailsModal.tsx`, `downloaded` status was mistakenly listed inside `processingStatuses` ("Processing" Amber badge). However, `organize-files.processor.ts` sets `status: 'downloaded'` when download and file organization finish moving files to `/media/audiobooks/`. This caused all 67 completed/downloaded audiobooks across author pages to display an Amber "Processing" badge indefinitely.
2. **Infinite Retry Loop for Duplicate Downloads**: When SABnzbd rejected a download as a duplicate, `monitor-download.processor.ts` reset status to `awaiting_search` but bypassed `addAutoBlock`. Every 30 minutes, `retry-missing-torrents` re-selected the exact same bad release (e.g. *Skyward* 53 times, *Earthside* 63 times).

## What Changes

1. **Frontend UI Status Fix**: Update `AudiobookCard.tsx` and `AudiobookDetailsModal.tsx` to classify `downloaded` status as `'In Library'` / completed (Emerald badge), matching `COMPLETED_STATUSES`, `organize-files.processor.ts`, and `StatusBadge.tsx`.
2. **Duplicate Failure Auto-Blocking**: Update `monitor-download.processor.ts` so releases flagged as duplicates by download clients are automatically added to `blocked_releases`. The request status still resets to `awaiting_search`, but the duplicate release is excluded from subsequent searches.
3. **Database Cleanup**: Cancelled 3 duplicate edition requests for already-available books and bulk-blocked 10 stuck releases with repeated failures.
