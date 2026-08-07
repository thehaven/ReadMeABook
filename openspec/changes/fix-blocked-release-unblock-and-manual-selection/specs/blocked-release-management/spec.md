## ADDED Requirements

### Requirement: Manual Selection Unblocks Release
When a user manually selects a torrent or ebook release for a request, any existing blocklist entry matching that release SHALL be deleted.

#### Scenario: User selects a blocked release in interactive search
- **WHEN** user calls select-torrent for a release present in BlockedRelease for that request
- **THEN** matching BlockedRelease entries SHALL be deleted and download initiated.

### Requirement: Per-Request Blocklist Clear API
The system SHALL provide an API endpoint to delete blocked releases for a specific request.

#### Scenario: User clears blocklist for a request
- **WHEN** DELETE /api/requests/[id]/blocklist is invoked by authorized user
- **THEN** all BlockedRelease rows matching requestId SHALL be deleted and status reset for search retry.
