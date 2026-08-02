## Why

When an author is watched (e.g. Terry Brooks B000APZAHI), `watched-lists.service.ts` auto-created duplicate requests in `awaiting_search` status for books that were already in the library or marked `available`/`completed`. Additionally, `enrichAudiobooksWithMatches` prioritized the newest `awaiting_search` request over existing `available` statuses, causing books (such as *Magic Kingdom for Sale--Sold!*) to disappear or display incorrect status on author pages.

## What Changes

- Update `getOwnedAsins` in `watched-lists.service.ts` to check `prisma.audiobook` (Audiobookshelf library) and `prisma.request` (`available`/`completed`/`downloaded` status) in addition to `prisma.plexLibrary`.
- Update `enrichAudiobooksWithMatches` in `audiobook-matcher.ts` to query `prisma.audiobook` and `prisma.request` by ASIN & fuzzy title+author, ensuring `isAvailable` and `requestStatus` prioritize `available`/`completed` statuses over newer `awaiting_search` requests.
- Update `createRequestForUser` in `request-creator.service.ts` to reject duplicate requests for books that are already owned or available.
- Update `src/app/authors/[asin]/page.tsx` `hideAvailable` filter logic so `isAvailable || ['available', 'completed', 'downloaded'].includes(requestStatus)` correctly toggles available books.
- Add DB cleanup logic to clear stale `awaiting_search` request records for books already marked `available` or present in `Audiobook` library table.

## Capabilities

### New Capabilities
- `watched-author-ownership-sync`: Watched author sync checks both Plex and Audiobookshelf library records and active requests before creating requests.
- `author-page-availability-filter`: Author page filtering and matching correctly identifies library availability and request statuses.

### Modified Capabilities

## Impact

- `src/lib/services/watched-lists.service.ts`
- `src/lib/utils/audiobook-matcher.ts`
- `src/lib/services/request-creator.service.ts`
- `src/app/authors/[asin]/page.tsx`
- PostgreSQL Database `request` and `audiobook` records.
