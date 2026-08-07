## Context

Releases blocked due to duplicate download client errors remain in `BlockedRelease`, preventing both automated retry search and manual interactive selection.

## Goals / Non-Goals

**Goals:**
1. Auto-unblock releases when manually selected in `select-torrent` or `select-ebook`.
2. Add `DELETE /api/requests/[id]/blocklist` to clear blocklist for a request.
3. Allow users to unblock or force-select blocked releases in Interactive Search UI.

**Non-Goals:**
- Removing the `BlockedRelease` table entirely.

## Decisions

- **Auto-unblock on selection**: Selecting a release implies intent to attempt download; `select-torrent` calls `unblockReleaseForRequest`.
- **Per-request blocklist route**: `DELETE /api/requests/[id]/blocklist` clears all blocks for `requestId`.
