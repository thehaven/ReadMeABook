## 1. TDD Failing Tests (RED Phase)

- [x] 1.1 Write test in `tests/unit/watched-lists.service.test.ts` asserting `getOwnedAsins` checks `Audiobook` and completed `Request` records.
- [x] 1.2 Write test in `tests/unit/audiobook-matcher.test.ts` asserting `enrichAudiobooksWithMatches` prioritizes `available` request status over `awaiting_search`.
- [x] 1.3 Write test in `tests/unit/request-creator.test.ts` asserting `createRequestForUser` skips existing `available` requests.

## 2. Implementation (GREEN Phase)

- [x] 2.1 Update `getOwnedAsins` in `src/lib/services/watched-lists.service.ts` to query `PlexLibrary`, `Audiobook`, and completed `Request` items.
- [x] 2.2 Update `enrichAudiobooksWithMatches` in `src/lib/utils/audiobook-matcher.ts` to check `Audiobook` and `Request` records and prioritize `available`/`completed`/`downloaded` status.
- [x] 2.3 Update `createRequestForUser` in `src/lib/services/request-creator.service.ts` to prevent duplicate request creation for available books.
- [x] 2.4 Update `src/app/authors/[asin]/page.tsx` `hideAvailable` filter logic.

## 3. Database Cleanup & Verification

- [x] 3.1 Clean up duplicate/stale `awaiting_search` request records for books already marked `available` or in `Audiobook` table.
- [x] 3.2 Run full test suite with 0 warnings.
