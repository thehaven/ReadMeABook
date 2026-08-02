# Design: Fix Downloaded Status UI & Duplicate Retry Block

## Architecture

### 1. Frontend UI Status Mapping
- `getStatusConfig` in `AudiobookCard.tsx` and `getStatusInfo` in `AudiobookDetailsModal.tsx` now inspect `downloaded` as part of the `'available'` / `'In Library'` green state.
- `processingStatuses` is trimmed to `['downloading', 'processing', 'awaiting_import']`.

### 2. Duplicate Failure Lifecycle
- In `monitor-download.processor.ts`, when `isDuplicateFail` is true, the request transitions to `awaiting_search` and `addAutoBlock` is invoked with `source: 'download_fail'` and `reason: 'Duplicate in download client'`.
- Next search pass filters out the blocked release using `filterBlockedResults`, forcing selection of a different release.
