# Skill: Apply Keyset Pagination for Sequential Data Without Offset Overhead
## Purpose
Use keyset pagination (WHERE clause on indexed sequential column) to paginate through large datasets with consistent performance, avoiding the offset overhead while using simple, transparent cursor values.
## When To Use
Server-side processing of sequential records (ETL jobs, report generation); admin data exports; APIs where cursor transparency is acceptable; datasets with natural sequential keys (auto-increment ID, created_at).
## When NOT To Use
Arbitrary page jumps (offset is better); public APIs requiring opaque cursors (use cursor encoding); datasets with frequent gaps in sequential keys.
## Prerequisites
Cursor Pagination Design (conceptual); database indexing; understanding of WHERE-based pagination.
## Inputs
Sequential column (ID, created_at); per_page count; sort direction; optional: last seen value.
## Workflow
1. Receive the last seen value from the client (transparent, e.g., `?after_id=42`)
2. Build query: `WHERE id > last_seen_id ORDER BY id ASC LIMIT per_page`
3. For descending: `WHERE id < last_seen_id ORDER BY id DESC`
4. Return the records plus the last record's ID for the next request
5. Ensure the sequential column has a B-tree index
6. First request (no `after_id`) uses `ORDER BY id ASC LIMIT per_page`
7. Use `last_seen_id` from response metadata for the next request
## Validation Checklist
- [ ] WHERE clause uses indexed sequential column
- [ ] First request (no cursor) returns correct first page
- [ ] Keys are sequential with index — query time is constant
- [ ] Sort direction is consistent between pages
- [ ] Last-page detection uses `per_page + 1` or checks row count < per_page
- [ ] Gaps in keys do not affect correctness (WHERE > value handles gaps)
- [ ] API returns `next_id` or equivalent for the next request
## Common Failures
- Using keyset pagination on non-sequential, non-indexed columns (slower than offset)
- Forgetting index on the cursor column — full table scan on every page
- Using keyset pagination when users need "go to page N" functionality
- Exposing sequential IDs in opaque cursor format when transparency is acceptable
## Decision Points
- Transparent (exposed ID) vs opaque (encoded) keyset cursor
- Single-column vs composite keyset (tiebreaker when sort column has duplicates)
- Keyset pagination vs cursor pagination for public APIs
## Performance/Security Considerations
Keyset pagination is O(1) per page — no offset slowdown. Index maintenance is minimal. Security: transparent keys can expose record count or growth rate; use opaque encoding for public APIs.
## Related Rules/Skills
Cursor Pagination Design; Offset Pagination Design; Total Count Performance; Cursor Encoding Strategies.
## Success Criteria
Query time is constant at any page depth; gaps in keys are handled correctly; index supports the WHERE clause; API response provides the next cursor transparently.
