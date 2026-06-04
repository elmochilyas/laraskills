# Skill: Implement Cursor-Based Pagination for Stable, Performant Ordering
## Purpose
Implement cursor-based pagination that uses a `WHERE` clause on a sequential column (ID, created_at) to fetch the next page, providing stable ordering even when new records are inserted.
## When To Use
Real-time feeds (activity logs, notifications); infinite scroll UIs; large datasets where offset becomes slow; when insertion order stability matters.
## When NOT To Use
Arbitrary page jumps (page number input); small datasets (<1000 records); when users need "go to page 5" functionality.
## Prerequisites
Cursor Encoding Strategies; Database indexing; Pagination Parameter Validation.
## Inputs
Cursor string (from previous request); per_page count; sort column and direction.
## Workflow
1. Decode and validate the cursor (column, value, direction)
2. Build query with `WHERE column > decoded_value ORDER BY column ASC LIMIT per_page + 1`
3. For descending: `WHERE column < decoded_value ORDER BY column DESC`
4. Fetch `per_page + 1` records to detect next page presence
5. Return `per_page` records plus `next_cursor` (encoded from last record's sort value)
6. If fewer than `per_page + 1` returned, set `next_cursor` to `null`
7. Ensure sort column is indexed for the WHERE clause
8. First request (no cursor) uses simple `ORDER BY column LIMIT per_page`
## Validation Checklist
- [ ] Cursor is decoded, validated, and authorized against allowed columns
- [ ] WHERE clause uses indexed column for fast lookup
- [ ] `per_page + 1` strategy detects next page without COUNT query
- [ ] NULL sort values are handled (cursor pagination works poorly with nulls)
- [ ] Direction is consistently applied to both WHERE and ORDER BY
- [ ] Cursor refreshes with each page (not tied to a fixed snapshot)
- [ ] API returns `next_cursor` and optionally `prev_cursor`
## Common Failures
- Non-indexed sort column — degenerate performance on deep pages
- Missing `+1` logic — can't distinguish last page from full page
- Inconsistent direction between WHERE clause and ORDER BY — wrong records returned
- Cursor on non-unique column — missing or duplicate records when ties exist
- Including nulls in sort column — cursor comparison with NULL behaves unexpectedly
## Decision Points
- Unique vs non-unique cursor column (use composite: tiebreaker column)
- Forward-only vs bidirectional cursor (prev_cursor adds complexity)
- Client-stored cursor vs server-side session cursor
## Performance/Security Considerations
Cursor pagination is O(1) per page — no offset slowdown. Ensure sort column is indexed. Security: cursor column must be whitelisted; tampered cursors must be rejected.
## Related Rules/Skills
Cursor Encoding Strategies; Keyset Pagination Design; Multi-Column Cursor Pagination; Total Count Performance.
## Success Criteria
Pages are stable under concurrent inserts; query time remains constant regardless of page depth; API returns correct next_cursor or null on last page.
