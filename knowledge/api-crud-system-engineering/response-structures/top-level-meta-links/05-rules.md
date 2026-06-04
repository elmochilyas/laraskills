# Rules: Top-Level Meta and Links

## Rule: Include Meta In Every Envelope Response
- **Condition:** In every envelope-formatted response
- **Action:** Include a `meta` object with `request_id`, `api_version`, and pagination data where applicable.
- **Consequence:** All responses carry context; request tracing is always available.
- **Enforcement:** Contract tests verify meta object presence.

## Rule: Include Self Link On Every Resource
- **Condition:** In every resource response
- **Action:** Include a `self` link in the top-level or resource-level links object pointing to the resource's canonical URL.
- **Consequence:** Resources are self-discoverable; clients don't construct URLs.
- **Enforcement:** Integration tests verify self link presence.

## Rule: Include Full Pagination Links
- **Condition:** In every paginated response
- **Action:** Include `first`, `prev`, `next`, `last` links. Generate all four links based on current page state.
- **Consequence:** Complete pagination navigation from any response.
- **Enforcement:** Integration tests verify all four pagination links are present.

## Rule: Use Consistent Top-Level Structure
- **Condition:** When designing response format
- **Action:** All envelope responses use `{ "data": ..., "meta": ..., "links": ... }`. No exceptions.
- **Consequence:** Universal client-side parsing across all endpoints.
- **Enforcement:** API contract tests verify top-level structure consistency.

## Rule: Don't Duplicate Pagination Information
- **Condition:** When including pagination in meta and links
- **Action:** Put pagination state (page, per_page, total) in `meta`. Put navigation URLs in `links`. Don't duplicate.
- **Consequence:** Clear separation of concerns; no conflicting information.
- **Enforcement:** Review ensures pagination state is not in links; page URLs are not in meta.
