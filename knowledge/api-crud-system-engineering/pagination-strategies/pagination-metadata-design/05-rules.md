# Rules: Pagination Metadata Design

## Rule: Include Consistent Metadata Structure
- **Condition:** In every paginated API response
- **Action:** Return pagination metadata in a `meta` key with `current_page`, `per_page`, `total`, `last_page`, `from`, and `to` fields.
- **Consequence:** Clients can handle pagination generically across all endpoints.
- **Enforcement:** API contract tests verify metadata structure matches the standard.

## Rule: Include Navigation Links
- **Condition:** In every paginated response
- **Action:** Include `first`, `prev`, `next`, `last` URLs in a `links` object at the response root.
- **Consequence:** Hypermedia-driven pagination; clients navigate without URL construction.
- **Enforcement:** Integration tests verify link URL presence and correctness.

## Rule: Use Has-More For Cursor Metadata
- **Condition:** When using cursor-based pagination
- **Action:** Include `has_more` boolean in cursor pagination metadata instead of computing total count.
- **Consequence:** No COUNT(*) overhead; clients know when pagination ends.
- **Enforcement:** Cursor pagination contract tests verify has_more field.

## Rule: Do Not Include Total Count in Cursor Metadata
- **Condition:** When implementing cursor-based pagination
- **Action:** Omit `total` and `last_page` from cursor pagination metadata. These require expensive COUNT(*) queries that defeat cursor pagination's purpose.
- **Consequence:** Cursor pagination remains performant.
- **Enforcement:** Review verifies cursor pagination responses don't include total.

## Rule: Use HTTP Link Headers For Pagination
- **Condition:** In addition to body metadata
- **Action:** Include RFC 5988 Link headers with `rel="first"`, `rel="prev"`, `rel="next"`, `rel="last"` for pagination navigation.
- **Consequence:** Standard pagination navigation accessible to HTTP clients and proxies.
- **Enforcement:** Integration tests verify Link header presence and format.
