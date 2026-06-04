# Query Parameter Sorting

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** pagination-strategies
- **Knowledge Unit:** Query Parameter Sorting
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary
Query Parameter Sorting defines how API consumers specify sort order for collection results. Well-designed sort conventions enable flexible data ordering while preventing SQL injection and ensuring performance through indexed sort columns.

---

## Core Concepts
- **Sort Parameter Convention**: Common patterns like `?sort=name`, `?sort=-created_at` (minus for descending), or `?sort[name]=asc`
- **Ascending vs Descending**: Convention for specifying direction — prefix with `-` (`?sort=-name`) or explicit `?sort=name,desc`
- **Multi-Column Sorting**: `?sort=-created_at,name` — sorting by multiple columns in priority order
- **Sort Allowlist**: Defining which columns can be sorted to prevent data exposure and ensure index usage
- **Default Sort Order**: The sort applied when no sort parameter is provided
- **Null Handling**: Whether nulls sort first or last and how to specify this

---

## Mental Models
1. **Excel Sort Model**: Like clicking column headers in a spreadsheet — click once for ascending, twice for descending, shift-click for multiple columns.
2. **Library Catalog Model**: Like sorting books by author, then title, then publication date — each criterion narrows the order.

---

## Internal Mechanics
The controller receives `?sort=-created_at,name`. The query builder validates each sort field against an allowlist. `-` prefix signals descending. `orderBy('created_at', 'desc')->orderBy('name', 'asc')` is appended to the query. The order of sort parameters determines priority. Multi-column sorts need composite indexes for performance.

---

## Patterns

### Pattern 1: Single Sort Convention
**Purpose**: `?sort=-created_at` with `-` for descending
**Benefits**: Simple, widely used (Stripe, GitHub)
**Tradeoffs**: Can't specify sort options beyond direction

### Pattern 2: Explicit Sort Object
**Purpose**: `?sort[name]=desc&sort[created_at]=asc` or structured sort parameter
**Benefits**: Explicit field-direction pairs; extensible
**Tradeoffs**: Verbose URL construction

### Pattern 3: Multi-Column String Sort
**Purpose**: `?sort=-created_at,name` (comma-separated, minus for desc)
**Benefits**: Concise, supports multiple columns
**Tradeoffs**: Parsing required; special character handling

---

## Architectural Decisions
### When To Use
- Any list/index endpoint returning multiple records
- Admin panels and reporting endpoints
- Endpoints where client controls display order

### When To Avoid
- Show/detail endpoints (single record)
- Search results sorted by relevance (rank overrides client sort)
- Endpoints with fixed required order

### Alternatives
- Server-determined sort order only
- Client-selectable but limited set of predefined sort options
- Natural language sort hints (e.g., "most recent")

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Flexible data ordering | Must validate sort columns | Enforce allowlist to prevent errors |
| Familiar UX for clients | Multi-column sorts need composite indexes | Add matching indexes for common sort combinations |
| Easy debugging | Null sorting behavior varies by DB | Document null sort behavior explicitly |

---

## Performance Considerations
- Sort on indexed columns for good performance
- Sorting on unindexed columns causes filesort (table scan + sort)
- Multi-column sorts need composite indexes matching the sort order
- `ORDER BY` with large result sets before `LIMIT` sorts all matches — push sort into subquery
- `NULLS FIRST` / `NULLS LAST` in PostgreSQL has different performance than MySQL

---

## Production Considerations
- Enforce a sort allowlist to prevent errors on non-existent columns
- Document available sort fields and their accepted directions
- Log sort queries against unindexed columns for performance tuning
- Test sort behavior with edge cases (null values, empty strings, special characters)

---

## Common Mistakes
**No sort allowlist**: Clients requesting `?sort=secret_field` could expose internal data or cause errors.
**Inconsistent direction conventions**: Mixing `-field` for desc and `field,desc` for desc. Choose one and document clearly.
**Not handling nulls**: Different databases treat nulls differently in sort order. Explicitly handle null sorting.
**Sorting on non-indexed columns**: Client-chosen sort on a non-indexed column causes slow queries. Restrict sort to indexed columns.

---

## Failure Modes
**SQL injection via sort field**: Malicious sort parameter with injected SQL. *Detection:* Database errors. *Mitigation:* Validate against allowlist; use Eloquent's `orderBy` (no quoting needed).
**Slow sort on large datasets**: Sorting 100k+ records by an unindexed column. *Detection:* Slow query logs. *Mitigation:* Allow sort only on indexed columns; add covering indexes.

---

## Ecosystem Usage
Laravel's `orderBy()` method applies sort clauses. `sortBy()` on collections enables in-memory sorting. `spatie/laravel-query-builder` provides automatic sort parameter handling with allowlist support via `allowedSorts()`.

---

## Related Knowledge Units
### Prerequisites
- SQL ORDER BY clauses
- Database indexing basics

### Related Topics
- Query parameter filtering
- Search query patterns
- Pagination metadata design

### Advanced Follow-up Topics
- Composite index design for common sort patterns
- Null-aware sorting patterns
- Sort-based cursor pagination

---

## Research Notes
- Stripe API uses `?sort=created` for asc, `?sort=-created` for desc
- GitHub API uses `?sort=created&direction=desc` with separate sort and direction params
- JSON:API uses `?sort=-created_at,name` where `-` prefix marks descending
- PostgreSQL supports `NULLS FIRST`/`NULLS LAST`; MySQL defaults nulls to lowest value
