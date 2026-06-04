# Skill: Implement Multi-Column Cursors for Stable Pagination on Non-Unique Sort Columns
## Purpose
Use composite cursors (multiple columns in WHERE clause) to paginate stably on non-unique sort columns — such as `created_at` with an ID tiebreaker — preventing missing or duplicate records between pages.
## When To Use
Sorting by non-unique columns (status, category, created_at without sub-second precision); when the sort column alone cannot guarantee total ordering; cursor pagination on any column that allows duplicate values.
## When NOT To Use
Single unique column pagination (ID, UUID); offset pagination where duplicates are acceptable; in-memory sorting of already-fetched results.
## Prerequisites
Cursor Encoding Strategies; Cursor Pagination Design; Composite Index Design.
## Inputs
Primary sort column (may have duplicates); tiebreaker column (unique, usually ID); sort directions per column.
## Workflow
1. Define the cursor as a composite of primary sort value + tiebreaker value
2. Build WHERE clause using tuple comparison (or equivalent AND/OR logic):
   `WHERE (sort_col > :val1) OR (sort_col = :val1 AND tiebreaker > :val2)`
3. For descending: `WHERE (sort_col < :val1) OR (sort_col = :val1 AND tiebreaker < :val2)`
4. Create a composite index on `(sort_col, tiebreaker)` in the sort direction
5. Encode the cursor as JSON → base64 → (optionally signed) containing both values
6. First page (no cursor) sorts by both columns and applies LIMIT
7. Ensure tiebreaker (usually ID) is included in SELECT for cursor construction
## Validation Checklist
- [ ] Composite index `(sort_col, tiebreaker)` exists and matches the ORDER BY
- [ ] Cursor encodes both sort value and tiebreaker value
- [ ] WHERE clause correctly handles sort_col > val (strictly after) and sort_col = val AND tiebreaker > val (same value, after tiebreaker)
- [ ] Sorting direction is applied consistently to both columns
- [ ] `EXPLAIN` shows index usage for the composite cursor query
- [ ] Duplicate sort values don't cause missing or duplicate records between pages
- [ ] Tiebreaker column is unique and monotonic (auto-increment ID)
## Common Failures
- Single-column cursor on non-unique column — records with same value are skipped or duplicated
- Missing composite index — DB uses filesort or full scan
- Wrong WHERE logic — using `AND` instead of `OR` for the composite condition
- Tiebreaker column is not monotonic — records can appear out of order
- Encoding only one value in the cursor — tiebreaker is lost between pages
## Decision Points
- Tuple syntax (`(a, b) > (v1, v2)`) vs explicit OR/AND (ORM compatibility)
- Two-value cursor array vs single encoded string
- Ascending vs descending composite cursor (both values must match direction)
## Performance/Security Considerations
Composite index query is still O(1) per page. Index width increases slightly with additional column. Security: encode both values to prevent cursor manipulation; validate decoded columns against whitelist.
## Related Rules/Skills
Cursor Encoding Strategies; Cursor Pagination Performance; Cursor Pagination Design; Database Indexing Strategy.
## Success Criteria
Pagination is stable on non-unique sort columns; no records are skipped or duplicated between pages; composite index supports the WHERE clause; cursor encoding preserves both values correctly.
