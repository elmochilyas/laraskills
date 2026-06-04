# Skill: Ensure Cursor Pagination Performance via Indexed Sequential Columns
## Purpose
Maintain O(1) per-page query performance in cursor pagination by ensuring WHERE and ORDER BY clauses use covered indexes, avoiding full table scans at any page depth.
## When To Use
During cursor pagination implementation; when analyzing slow query logs; before deploying to production with large datasets (>100k records).
## When NOT To Use
Offset pagination (performance profile is different); small datasets (<10k records) where index choice is less critical.
## Prerequisites
Cursor Pagination Design; MySQL/PostgreSQL index internals; EXPLAIN plan reading.
## Inputs
Cursor pagination query; table schema (indexes, columns); query execution plan.
## Workflow
1. Run `EXPLAIN` on the cursor WHERE query before adding indexes
2. Verify the WHERE column (cursor column) has a B-tree index (not hash)
3. For composite cursors, verify the composite index matches column order
4. Verify the index covers the SELECT columns (covering index) to avoid table lookups
5. Check `Extra: Using index` in EXPLAIN output for covering index confirmation
6. Test query time at depth 1 and depth 1,000,000 — should be identical
7. Monitor slow query log for cursor pagination queries after deployment
8. Add composite indexes for multi-column ORDER BY + WHERE patterns
## Validation Checklist
- [ ] Cursor column has a B-tree index
- [ ] WHERE clause uses the indexed column in a comparison (>, <, >=, <=)
- [ ] `EXPLAIN` shows `type: range` or `ref`, not `ALL`
- [ ] `rows` estimate is small (index scan, not table scan)
- [ ] SELECT columns are covered by the index (or minimal lookups)
- [ ] Query time at deep pages (< 100ms) matches first-page time
- [ ] Composite indexes exist for multi-column cursors with correct column order
## Common Failures
- Primary key is indexed but cursor uses `created_at` without an index — full scan on deep pages
- Composite index has wrong column order — DB can't use it efficiently for the WHERE clause
- SELECT * with large rows — index scan is fast but table lookups dominate
- Using `LIKE` or `FUNCTION()` on the indexed column in WHERE — prevents index use
## Decision Points
- Inclusive (>=) vs exclusive (>) cursor comparison against last seen value
- Partial index vs full index for filtered cursor pagination (e.g., only active records)
## Performance/Security Considerations
Index maintenance overhead is minimal (<5% write slowdown). Security: no direct security impact, but slow queries enable DoS by resource exhaustion.
## Related Rules/Skills
Cursor Pagination Design; Multi-Column Cursor Pagination; Offset Pagination Performance; Database Indexing Strategy.
## Success Criteria
Cursor pagination query time is constant (<100ms) at any page depth; EXPLAIN shows index range scan; no slow queries in production logs.
