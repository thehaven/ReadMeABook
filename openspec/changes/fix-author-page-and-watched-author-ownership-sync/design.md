## Context

Watched authors and author page matching logic suffered from incomplete library ownership queries (`getOwnedAsins` only checked `PlexLibrary`), causing watched author sync to auto-create duplicate `awaiting_search` requests for already-owned books. `enrichAudiobooksWithMatches` also picked the latest request (`awaiting_search`) over existing `available` requests.

## Goals / Non-Goals

**Goals:**
1. Fix `getOwnedAsins` in `watched-lists.service.ts` to query `PlexLibrary`, `Audiobook`, and `Request` (`available`/`completed`/`downloaded`).
2. Fix `enrichAudiobooksWithMatches` in `audiobook-matcher.ts` to check both `Audiobook` and `Request` records, prioritizing `available`/`completed`/`downloaded` status over `awaiting_search`.
3. Clean up stale/duplicate `awaiting_search` request records in the database.
4. Ensure author page filter (`hideAvailable`) accurately checks all available statuses.

**Non-Goals:**
- Modifying torrent search indexer logic.

## Decisions

- **Unified Ownership Lookup**: Combine `PlexLibrary`, `Audiobook`, and active completed `Request` tables into `getOwnedAsins`.
- **Status Priority Matrix**: In `audiobook-matcher.ts`, when multiple requests or records match an ASIN/title+author, completed/available statuses take precedent over pending/searching statuses.

## Risks / Trade-offs

- [Risk: Database query overhead for large author book lists] → Mitigated by batching queries and indexing `audibleAsin` / `asin`.
