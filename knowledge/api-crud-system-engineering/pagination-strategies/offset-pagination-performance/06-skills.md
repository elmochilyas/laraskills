# Skill: Mitigate Offset Pagination Degradation with Indexing and Page Limits
## Purpose
Minimize offset pagination performance degradation at deep pages by using proper indexing, limiting maximum page depth, and offering alternative strategies when datasets grow large.
## When To Use
Offset pagination endpoints that may exceed 100 pages; when monitoring shows slow queries on high page numbers; during performance review of paginated endpoints.
## When NOT To Use
Cursor-based pagination (performance is constant by design); small tables (<10k records) where offset overhead is negligible.
## Prerequisites
Offset Pagination Design; EXPLAIN plan reading; database indexing.
## Inputs
Slow query log; table schema; current pagination query; average dataset size and growth rate.
## Workflow
1. Run `EXPLAIN` on pagination query at page 1 and page 1000
2. Compare `rows` scanned between shallow and deep pages
3. Verify ORDER BY column is indexed — without index, every page scans all rows
4. Confirm the index is a B-tree index that matches the ORDER BY direction
5. Implement maximum page depth (e.g., max 500 pages, return 400 if exceeded)
6. For deep pages, consider using `WHERE id > offset_value ORDER BY id LIMIT per_page` instead of `OFFSET`
7. Monitor slow query log for offest-pagination queries exceeding threshold (200ms)
8. Add composite indexes when ORDER BY + WHERE combination requires both
## Validation Checklist
- [ ] ORDER BY column is indexed with matching direction
- [ ] `EXPLAIN` on deep page scan shows fewer rows after indexing
- [ ] Maximum page depth is enforced (configurable, with clear error message)
- [ ] `OFFSET` is not used on tables expected to exceed 100k records (consider cursor)
- [ ] Composite indexes exist for filtered pagination queries
- [ ] Monitoring alerts exist for pagination queries exceeding 200ms
- [ ] Alternative pagination strategy is documented for large datasets
## Common Failures
- No index on ORDER BY column — deep pages scan all rows
- Maximum page depth is not implemented — increasingly slow responses
- Composite index is missing for filtered pagination (WHERE + ORDER BY)
- Using `OFFSET` on tables with millions of rows without migration plan
- Not monitoring pagination query performance — degradation goes unnoticed
## Decision Points
- Enforce maximum page depth (hard limit) vs suggest cursor as alternative
- `WHERE id > last_seen_id` pattern vs `OFFSET` for deep pages
- Migrate to cursor pagination vs optimize offset with covering indexes
## Performance/Security Considerations
At deep pages, MySQL still scans the `OFFSET` rows even if they're not returned. Consider `WHERE`-based pagination for very deep pages. Security: slow pagination enables DoS; rate-limit paginated endpoints.
## Related Rules/Skills
Offset Pagination Design; Cursor Pagination Design; Total Count Performance; Database Indexing Strategy.
## Success Criteria
Deep page queries are within 2x of shallow page query time; maximum page depth is enforced; monitoring catches degradation; migration to cursor is planned for large tables.
