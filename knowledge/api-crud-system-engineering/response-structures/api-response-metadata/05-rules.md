# Rules: API Response Metadata

## Rule: Include Meta Object In All Envelope Responses
- **Condition:** In every envelope-formatted API response
- **Action:** Include a top-level `meta` object with at minimum a `request_id` field.
- **Consequence:** Clients have context about every response; request tracing is enabled.
- **Enforcement:** API contract tests verify meta key presence.

## Rule: Include Self Links On Resources
- **Condition:** When returning resource objects
- **Action:** Include a `self` link in the `links` object pointing to the resource's canonical URL.
- **Consequence:** Clients discover resource URLs from responses.
- **Enforcement:** Integration tests verify self link presence and correctness.

## Rule: Include Pagination Links In Collections
- **Condition:** In paginated list responses
- **Action:** Include `first`, `prev`, `next`, `last` links in the top-level `links` object.
- **Consequence:** Clients navigate pages without URL construction.
- **Enforcement:** Contract tests verify pagination link presence for list endpoints.

## Rule: Use Consistent Key Names
- **Condition:** When defining response metadata structure
- **Action:** Use consistent key names (`meta`, `links`, `data`) across all endpoints. Never vary the metadata location.
- **Consequence:** Generic client-side response handling works across all endpoints.
- **Enforcement:** API style guide enforces consistent key naming.

## Rule: Don't Include Internal Information In Meta
- **Condition:** When populating meta fields
- **Action:** Exclude server internals (query count, memory usage, processing time) from production metadata responses.
- **Consequence:** Internal system characteristics are not exposed.
- **Enforcement:** Review ensures meta fields are consumer-facing only.
