# Offset-Based Pagination

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** pagination-strategies
- **Knowledge Unit:** Offset-Based Pagination
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary
Offset-Based Pagination uses `page` and `per_page` query parameters with SQL `LIMIT` and `OFFSET` to paginate API results. It is the simplest and most widely recognized pagination pattern, but has known performance and consistency limitations on large datasets.

---

## Core Concepts
- **Page Number**: The `page` parameter indicates which page of results to return (1-indexed by convention)
- **Page Size**: The `per_page` parameter controls how many items per page (with a system-enforced maximum)
- **Total Count**: The total number of records available, used to calculate last page
- **OFFSET Clause**: SQL `OFFSET` skips rows before the target page — performance degrades as offset increases
- **Phantom Reads**: New or deleted records between requests can shift page boundaries, causing duplicate or missed items
- **Maximum Page Size**: Hard limit on `per_page` to prevent resource exhaustion attacks

---

## Mental Models
1. **Book Page Model**: Each page is a numbered page in a book. `page=5` means turn to page 5. New pages can't be inserted without renumbering.
2. **Slicing Bread Model**: The dataset is a loaf of bread. `OFFSET` is how many slices you skip; `LIMIT` is how many you take.

---

## Internal Mechanics
The client sends `GET /api/users?page=2&per_page=15`. The server computes `offset = (page - 1) * per_page` and executes `SELECT * FROM users LIMIT 15 OFFSET 15`. A separate `COUNT(*)` query runs for total items. The response includes `page`, `per_page`, `total`, `last_page`, and optionally links to `first`, `last`, `next`, `prev` pages.

---

## Patterns

### Pattern 1: Standard Page-Based Pagination
**Purpose**: Simple `page` and `per_page` parameters with full metadata
**Benefits**: Universal client support; easy to implement
**Tradeoffs**: Performance degrades on deep pages

### Pattern 2: Max-Per-Page Enforcement
**Purpose**: Enforce client-configurable per_page with a hard cap
**Benefits**: Prevents abuse; gives clients control
**Tradeoffs**: Adds validation logic

---

## Architectural Decisions
### When To Use
- Small to medium datasets (<100k records)
- UIs with page number navigation (1, 2, 3...)
- Admin panels and internal tools where stability is less critical
- APIs where total count is required

### When To Avoid
- Very large datasets where deep offsets kill performance
- Real-time feeds where phantom reads cause UX problems
- Infinite scroll interfaces (prefer cursor pagination)

### Alternatives
- Cursor-based pagination for stable, performant pagination
- Keyset pagination for simple ordered lists
- Hybrid: cursor for data, offset for metadata

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Simple to implement and use | Performance degrades with page depth | Use cursor for deep pagination needs |
| Universal client support | Phantom reads on concurrent writes | Acceptable for many use cases |
| Total count always available | COUNT query on large tables is slow | Cache count or estimate for large datasets |

---

## Performance Considerations
- `OFFSET 100000` requires scanning 100k rows even though only 15 are returned
- `COUNT(*)` on large InnoDB tables performs a full index scan (slow on huge tables)
- Offset performance can be mitigated by covering indexes
- `ORDER BY` on unindexed columns with offset is extremely slow
- Consider `SELECT COUNT(*) FROM (SELECT 1 FROM table LIMIT 100000)` for approximate counts

---

## Production Considerations
- Set a maximum `per_page` value (usually 100) to prevent abuse
- Validate `page` and `per_page` are positive integers
- Return meaningful error for pages beyond the last page
- Monitor deep page accesses for potential performance issues
- Consider caching total count with a TTL for stable datasets

---

## Common Mistakes
**Not capping per_page**: Allowing `per_page=100000` can exhaust database connections. Always set a maximum.
**1-indexed vs 0-indexed**: Inconsistent page numbering confuses clients. Stick with 1-indexed (page 1 = first page).
**Large page sizes on mobile**: Default to small page sizes (15-25) and let clients request more if needed.
**Counting on every request**: `COUNT(*)` on every pagination request is wasteful. Cache or estimate for high-traffic endpoints.

---

## Failure Modes
**Deep page performance collapse**: Page 100000 of a 5M record dataset takes seconds to execute. *Detection:* Slow query logs. *Mitigation:* Reject deep pages or switch to cursor pagination.
**Phantom read duplication**: A client loading page 1 then page 2 sees a record on both pages. *Detection:* Client reports. *Mitigation:* Use cursor pagination for stability-sensitive use cases.

---

## Ecosystem Usage
Laravel's `paginate($perPage)` method handles offset pagination automatically. `User::paginate(15)` returns a `LengthAwarePaginator` instance with `total`, `lastPage`, `currentPage`, `perPage`, `nextPageUrl`, `previousPageUrl`. `simplePaginate()` omits the total count for performance.

---

## Related Knowledge Units
### Prerequisites
- SQL SELECT and LIMIT/OFFSET
- Basic API response structures

### Related Topics
- Cursor-based pagination
- Pagination metadata design
- Query parameter sorting

### Advanced Follow-up Topics
- Performance optimization for deep offsets
- Approximate count strategies
- Hybrid pagination patterns (offset + cursor)

---

## Research Notes
- Laravel's `paginate()` runs a `SELECT COUNT(*) FROM (SELECT ...) AS aggregate` query — the subquery can be slow on complex queries
- `simplePaginate()` skips `COUNT(*)` but loses `lastPage` and `total` — use for infinite scroll UIs
- MySQL 8.0+ can use `SELECT COUNT(*)` from `INFORMATION_SCHEMA` for approximate counts on large tables
