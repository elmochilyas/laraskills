# Anti-Patterns: Query Parameter Sorting

## Unrestricted Sort
**Description:** Any query parameter accepted as a sort field, exposing internal column names.
**Why it happens:** No sort allowlist; `$query->orderBy($request->sort)` approach.
**Consequences:** Security vulnerability; database column names exposed; filesort on unindexed columns.
**Better approach:** Implement sort allowlist with explicit mapping.

## No Default Sort
**Description:** List endpoint without default sort order, producing unpredictable results.
**Why it happens:** Developers assume clients always provide sort parameters.
**Consequences:** Pagination inconsistencies; records appear on multiple pages or are skipped.
**Better approach:** Always provide a default sort. Typically -id or -created_at.

## Filesort On Large Sets
**Description:** Sorting entire result sets before pagination returns only a small page.
**Why it happens:** No index on sort column; database performs filesort on all matching rows.
**Consequences:** Performance degradation as data grows; queries become slow.
**Better approach:** Ensure sort columns are indexed. Filter first to reduce working set.
