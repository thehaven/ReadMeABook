## Why

When downloads fail or clients return duplicate status (e.g. SABnzbd duplicate NZB rejection), ReadMeABook adds the release to `BlockedRelease`. Once blocked, automated searches skip the release permanently and manual selection in Interactive Search does not remove the block, trapping requests in `awaiting_search` status with "No usable releases — all candidates blocked".

## What Changes

- Add `unblockReleaseForRequest` and `clearBlocklistForRequest` helper functions to `src/lib/services/blocklist.service.ts`.
- Update `select-torrent` and `select-ebook` API routes to automatically unblock a release when manually selected by a user.
- Add `DELETE /api/requests/[id]/blocklist` route allowing users and admins to clear blocked releases for a specific request.
- Update `InteractiveTorrentSearchModal.tsx` to clear blocks on manual selection and offer a "Clear Blocked Releases & Re-search" button when candidates are blocked.

## Capabilities

### New Capabilities
- `blocked-release-manual-unblock`: Manual selection and dedicated API endpoints allow unblocking releases for a request.

### Modified Capabilities

## Impact

- `src/lib/services/blocklist.service.ts`
- `src/app/api/requests/[id]/select-torrent/route.ts`
- `src/app/api/requests/[id]/select-ebook/route.ts`
- `src/app/api/requests/[id]/blocklist/route.ts`
- `src/components/requests/InteractiveTorrentSearchModal.tsx`
