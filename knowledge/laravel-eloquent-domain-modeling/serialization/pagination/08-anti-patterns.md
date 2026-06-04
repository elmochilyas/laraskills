# Anti-Patterns: Pagination

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Knowledge Unit:** Pagination

## Anti-Patterns

### Length-Aware Pagination on Huge Tables
Using `paginate()` (length-aware) on tables with millions of rows. Each request performs a `COUNT(*)` query that can take seconds on large datasets with complex WHERE clauses.

**Problem:** Slow API responses; database server strain from expensive count queries; query timeouts.

**Solution:** Use `cursorPaginate()` for tables exceeding 100k rows — it avoids the count query entirely.

### No per_page Cap
Allowing clients to request arbitrarily large page sizes (e.g., `per_page=100000`). This bypasses pagination benefits and can cause memory exhaustion.

**Problem:** Memory exhaustion; slow responses; abuse vector for DoS attacks.

**Solution:** Always cap `per_page`: `min($request->per_page, 100)`.

### Cursor Pagination for Numbered Navigation
Using cursor pagination when the UI requires page-number controls, total counts, or "jump to page N" functionality. Cursor pagination only supports forward/backward navigation.

**Problem:** Missing pagination features required by the UI; broken frontend expectations.

**Solution:** Use length-aware `paginate()` when clients need page numbers or total counts.

### Pagination Without Stable Ordering
Paginating a query without `orderBy()` or ordering by non-unique columns. Records may shift between pages, causing duplicates or gaps.

**Problem:** Inconsistent page results; duplicate records across pages; missing records.

**Solution:** Always paginate with a stable, unique ordering column (typically `id` or `created_at` with `id` tiebreaker).

### Inconsistent Pagination Strategy
Mixing length-aware and cursor pagination across endpoints without documentation. API consumers don't know which pagination format to expect.

**Problem:** Consumer confusion; increased integration complexity.

**Solution:** Choose a pagination strategy and document it. Use cursor pagination consistently for large datasets.

### Returning Non-Paginator to Resource::collection()
Returning a plain Collection or array instead of a paginator to `Resource::collection()`. The pagination metadata (`links`, `meta`) is absent.

**Problem:** Missing pagination metadata in API responses; consumers cannot navigate pages.

**Solution:** Always pass a paginator instance (not a plain collection) to `Resource::collection()` for paginated endpoints.

### Paginate on Always-Small Queries
Calling `paginate()` on queries that always return small, bounded results (lookups, dropdowns). The count query adds unnecessary overhead.

**Problem:** Unnecessary database query for every request to a small dataset.

**Solution:** Use `get()` directly for datasets that are guaranteed small by domain constraints.
