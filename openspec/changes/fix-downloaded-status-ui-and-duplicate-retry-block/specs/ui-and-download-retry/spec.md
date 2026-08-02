# UI and Download Retry Specs

## MODIFIED Requirements

### Requirement: Downloaded Status UI Classification
`AudiobookCard` and `AudiobookDetailsModal` MUST classify requests in `downloaded` status as `'In Library'` / completed (Emerald badge).

#### Scenario: Displaying downloaded audiobook
- **Given** an audiobook request has status `downloaded`
- **When** rendered in `AudiobookCard` or `AudiobookDetailsModal`
- **Then** it MUST display with an Emerald 'In Library' badge instead of Amber 'Processing'

### Requirement: Auto-blocking Duplicate Rejected Releases
`monitor-download.processor.ts` MUST auto-block releases rejected by download clients as duplicates.

#### Scenario: Handling duplicate download failure
- **Given** a download client flags a release as a duplicate
- **When** `monitor-download.processor.ts` processes the failure
- **Then** it MUST reset the request status to `awaiting_search` AND insert the release into `blocked_releases`
