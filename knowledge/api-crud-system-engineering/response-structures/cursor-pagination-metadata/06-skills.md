# Skill: Return Cursor Pagination Metadata in Standard JSON Envelope
## Purpose
Structure cursor pagination response metadata — `next_cursor`, `prev_cursor`, `per_page`, and optionally `total` — in a consistent JSON envelope that clients can parse without special knowledge of the pagination strategy.
## When To Use
Cursor-paginated endpoints; public APIs that use cursor pagination; API version upgrades from offset to cursor.
## When NOT To Use
Offset pagination (use offset pagination metadata); internal APIs with custom pagination contracts.
## Prerequisites
Cursor Pagination Design; Cursor Encoding Strategies; JSON response structure conventions.
## Inputs
Cursor pagination result; current page records; `per_page` value; cursor encoding service.
## Workflow
1. Fetch `per_page + 1` records to determine next page existence
2. If records exist beyond current page, encode last record's cursor value as `next_cursor`
3. If this is not the first page, encode first record's cursor as `prev_cursor`
4. Build `meta` object with `per_page`, optional `total`, and any custom fields
5. Build `links` object with `first`, `last` (optional for cursor), `prev`, `next`
6. For cursor pagination, `first` and `last` point to first/last page cursor URLs
7. Return `data` (array of records) + `meta` + `links` in a single JSON object
8. Set `next_cursor` to `null` when on the last page
## Validation Checklist
- [ ] `next_cursor` is present (opaque string or null)
- [ ] `prev_cursor` is present (opaque string or null on first page)
- [ ] `per_page` in meta matches the request or default
- [ ] `total` is included only if calculated and documented as approximate
- [ ] `data` is an array (empty array for no results)
- [ ] `links.next` URL includes the encoded cursor
- [ ] `links.prev` is null on first page
- [ ] `next_cursor` is null on last page
- [ ] Cursor format is consistent across all pages
- [ ] Response structure matches offset pagination envelope for client consistency
## Common Failures
- `next_cursor` is an array of values instead of an opaque string
- `prev_cursor` is omitted entirely (not set to null) on first page
- `total` performance cost dominates the response time
- Cursor format changes between pages — client can't parse consistently
- `links.next` URL is missing the cursor parameter
## Decision Points
- Include `total` in meta vs exclude (cost vs utility)
- Link URLs with full cursor parameters vs just the cursor string
- Bidirectional cursor (prev + next) vs forward-only (next only)
## Performance/Security Considerations
Cursor encoding is fast. `total` requires a COUNT query — consider omitting for performance. Security: cursors must be opaque and tamper-evident; do not expose DB column values directly in cursor.
## Related Rules/Skills
Cursor Pagination Design; Cursor Encoding Strategies; Pagination Metadata Design; Offset Pagination Design.
## Success Criteria
Cursor pagination metadata is consistent, includes next/prev cursors, falls back to null at boundaries, and matches the overall API response envelope.
