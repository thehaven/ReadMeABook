## ADDED Requirements

### Requirement: Watched Author Ownership Verification
The system SHALL check PlexLibrary, Audiobook, and completed Request tables when determining if a watched author's audiobook is already owned before creating requests.

#### Scenario: Existing Audiobookshelf or Request item prevents duplicate request creation
- **WHEN** watched author sync runs for a watched author
- **THEN** any book present in Audiobook or Request with status available, completed, or downloaded MUST be marked as owned and skipped.

### Requirement: Request Status Priority Matching
The system SHALL prioritize available, completed, and downloaded request statuses over newer awaiting_search requests during audiobook enrichment.

#### Scenario: Audiobook enrichment prioritizes available status
- **WHEN** an audiobook is enriched with request matches
- **THEN** if any request or audiobook record has available, completed, or downloaded status, isAvailable SHALL be true and requestStatus SHALL be available.
