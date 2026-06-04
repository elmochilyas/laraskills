# Skill: Design Pagination Metadata Keys Consistently Across All Endpoints
## Purpose
Choose and apply a consistent set of pagination metadata keys (`current_page`, `per_page`, `total`, `last_page`, `from`, `to`) across all paginated endpoints, giving clients a predictable contract regardless of pagination strategy.
## When To Use
When designing pagination for a new API; when standardizing pagination across an existing API; when supporting multiple pagination strategies.
## When NOT To Use
Non-paginated endpoints; endpoints that return a single resource; when using a third-party pagination standard (e.g., JSON:API) that defines its own keys.
## Prerequisites
Offset Pagination Design; Cursor Pagination Design; API response structure conventions.
## Inputs
API-wide pagination conventions; paginator type (offset or cursor); client requirements.
## Workflow
1. Choose a naming convention (snake_case for consistency with JSON conventions)
2. Define the universal meta keys: `current_page`, `per_page`, `total`, `last_page`, `from`, `to`
3. For cursor pagination, add `next_cursor` and `prev_cursor` to the `meta` object
4. Define the universal links keys: `first`, `last`, `prev`, `next` (URL strings or null)
5. Apply the same keys to ALL paginated endpoints — no per-endpoint variations
6. Use Pagination Resource classes or macros to enforce consistency
7. Document the pagination metadata contract in the API reference
8. Test the metadata keys with a dedicated pagination metadata test
## Validation Checklist
- [ ] All paginated endpoints return the same `meta` keys
- [ ] All paginated endpoints return the same `links` keys
- [ ] Naming convention is consistent (snake_case, camelCase, or kebab-case)
- [ ] For cursor pagination, cursor fields are added but offset fields are still present (or adapted)
- [ ] `from` and `to` reflect the range of items in the current page
- [ ] `total` is present for offset pagination; optional for cursor
- [ ] `links` URLs are absolute (not relative)
- [ ] `null` values are used for unavailable links (prev on first page)
- [ ] Pagination metadata is tested with a pagination metadata test suite
## Common Failures
- Different endpoints use different key names (`perPage` vs `per_page` vs `limit`)
- `links` keys omitted for cursor pagination — client expects them
- `from` and `to` are wrong for empty pages (should be null, not 0)
- `total` key missing on offset endpoints — client can't build page navigation
- Cursor pagination metadata keys differ from offset keys — client confusion
## Decision Points
- Snake_case vs camelCase for pagination keys
- Include `total` in cursor pagination (optional, expensive) vs omit
- Absolute vs relative URLs in `links`
## Performance/Security Considerations
No performance impact from key names. Security: avoid exposing internal IDs or DB values in pagination keys (use opaque cursors).
## Related Rules/Skills
Offset Pagination Design; Cursor Pagination Metadata; Pagination Information Customization; Top-Level Meta and Links.
## Success Criteria
All paginated endpoints share identical metadata key structure; client code can use one parser for all endpoints; pagination test suite validates consistency.
