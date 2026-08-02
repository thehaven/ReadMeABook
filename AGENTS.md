# AGENTS.md — Developer & AI Pair Programming Guide for ReadMeABook

This document details the system architecture, file locations, key domain invariants, OpenSpec standards, and performance protocols for ReadMeABook. AI agents working on this codebase MUST follow these instructions to ensure rapid execution, zero-regression quality, and minimal token consumption.

---

## 1. Project Overview & Operational Paths

### Core Locations
- **Repository Root**: `/storage/home/haven/projects/ReadMeABook`
- **Docker Compose Directory**: `/storage/docker/readmeabook`
- **Live Container Name**: `readmeabook` (Next.js App on Port `3030`)
- **Database Connection**: `postgresql://readmeabook:password@127.0.0.1:5432/readmeabook` inside container `readmeabook`
- **Media Storage**: Mapped to `/media/audiobooks/` inside container (Host: `/storage/books/audio_books/`)

### Common Operational Commands
```bash
# Run unit tests
cd /storage/home/haven/projects/ReadMeABook && npm test

# Deploy code updates to live container
rsync -av /storage/home/haven/projects/ReadMeABook/src/ /storage/docker/readmeabook/build/src/
docker cp /storage/home/haven/projects/ReadMeABook/src readmeabook:/app/

# Run Next.js production build inside container & restart
# MANDATORY: Always clear Next.js Turbopack build cache before building!
# Failing to clear cache causes Next.js to serve stale compiled JS chunks from .next/cache.
docker exec readmeabook rm -rf /app/.next/cache
docker exec -w /app readmeabook npx next build
docker restart readmeabook

# Execute tsx scripts inside container
# MANDATORY: Always include DATABASE_URL when executing tsx in container!
docker exec -e DATABASE_URL="postgresql://readmeabook:password@127.0.0.1:5432/readmeabook" readmeabook npx tsx -e "..."

# Health check
docker exec readmeabook curl -s http://localhost:3030/api/health
```

---

## 2. Core Domain Invariants & Architecture Fixes

### A. UI Request Status Mapping (`AudiobookCard.tsx` & `AudiobookDetailsModal.tsx`)
- **INVARIANT**: Request status `downloaded` (and `completed`) means file organization to `/media/audiobooks/` is COMPLETE.
- **Rule**: `downloaded` MUST ALWAYS be classified as `'In Library'` / `'available'` (Emerald green badge).
- **CRITICAL FIX**: Never place `'downloaded'` inside `processingStatuses` (`['downloading', 'processing', 'awaiting_import']`). Placing `'downloaded'` in `processingStatuses` causes completed audiobooks to render an Amber "Processing" badge indefinitely.

| Request Status | UI Category | Badge Color | Label |
|---|---|---|---|
| `available`, `completed`, `downloaded` | `available` | **Emerald (Green)** | In Library / In Your Library |
| `downloading`, `processing`, `awaiting_import` | `processing` | **Amber (Orange)** | Processing |
| `pending`, `searching`, `awaiting_search`, `awaiting_release`, `awaiting_approval` | `pending` | **Blue** | Requested / Awaiting Search |
| `denied`, `failed` | `denied` / `failed` | **Red** | Request Denied / Failed |

### B. Download Failure & Release Auto-Blocking (`monitor-download.processor.ts`)
- **INVARIANT**: When a download client (SABnzbd, NZBGet, qBittorrent) flags a release as a duplicate or failure, `addAutoBlock` MUST be invoked unconditionally.
- **CRITICAL FIX**: Do NOT bypass `addAutoBlock` on duplicate detection (`isDuplicateFail`). While the request status resets to `awaiting_search` so a fresh search can execute, the failed release MUST be added to `blocked_releases` to prevent `searchWithVariations` from selecting the exact same release on subsequent 30-minute search passes.

### C. Search & Ranking (`search-indexers.processor.ts` & `prowlarr.service.ts`)
- `searchWithVariations` executes multi-query variations (`"title author"`, `"title"`, cleaned core title).
- Errors or timeouts (e.g. 60s Prowlarr timeout) on individual queries are logged and swallowed per-query so surviving variations still return candidates.
- `filterBlockedResults` executes before ranking to strip all releases present in `blocked_releases` for the request.

### D. Scheduler Daemon & Watchdog (`scheduler.service.ts`)
- Internal cron daemon runs every minute with a 5-minute self-healing watchdog.
- REST endpoints at `/api/admin/scheduler/status` (GET) and `/api/admin/scheduler/trigger` (POST) allow inspectability and manual execution of background processors.

---

## 3. OpenSpec Change Protocol

All non-trivial feature additions or bug fixes MUST be tracked via **OpenSpec**.

### Directory Structure
```text
openspec/changes/<change-id>/
├── .openspec.yaml       # schema: "1.0", type: "change"
├── proposal.md          # Why & What Changes
├── design.md            # Architecture & Technical Decisions
├── tasks.md             # Implementation checklist
└── specs/               # Capability specification deltas
    └── <domain>/
        └── spec.md      # ## MODIFIED/ADDED Requirements + #### Scenario: blocks
```

### Validation Gate
Always run strict validation before committing:
```bash
openspec validate <change-id> --strict
```

---

## 4. Agent Guidelines for Fast Execution & Reduced Token Usage

To minimize prompt size and avoid unnecessary loops:

1. **Direct Database Inspection**: Query Postgres directly via `docker exec readmeabook psql -U readmeabook -d readmeabook -c "..."` instead of writing custom script wrappers for routine checks.
2. **Container TSX Environment**: ALWAYS pass `-e DATABASE_URL="postgresql://readmeabook:password@127.0.0.1:5432/readmeabook"` when running `npx tsx` inside the container.
3. **Clean Build Protocol**: ALWAYS run `docker exec readmeabook rm -rf /app/.next/cache` prior to `npx next build` to prevent Turbopack cache contamination of modified `.tsx` components.
4. **Targeted File Reads**: Use `view_file` with precise `StartLine` and `EndLine` parameters. Avoid fetching entire 1,000+ line files.
5. **No Polling Loops**: After starting async tasks or builds, use `schedule` or check status once without infinite polling loops.
6. **Git Remote Convention**:
   - `origin`: GitHub fork (`https://github.com/thehaven/ReadMeABook.git`) — use for branch pushes & PR creation via `gh`.
   - `gitlab`: Canonical internal repo (`git@gitlab.com:thehaven/ReadMeABook.git`).
