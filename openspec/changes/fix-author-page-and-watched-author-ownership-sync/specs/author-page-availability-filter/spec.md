## ADDED Requirements

### Requirement: Author Page Availability Filter
The author detail page SHALL correctly filter out available audiobooks when hideAvailable preference is enabled.

#### Scenario: Hide available filter includes request status available
- **WHEN** user enables hideAvailable on the author page
- **THEN** audiobooks with isAvailable true OR requestStatus in available, completed, downloaded SHALL be hidden.
