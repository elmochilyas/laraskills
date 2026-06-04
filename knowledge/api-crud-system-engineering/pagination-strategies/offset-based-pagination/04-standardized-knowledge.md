# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** pagination-strategies
**Knowledge Unit:** Offset-Based Pagination
**Difficulty:** Beginner
**Category:** Pagination
**Last Updated:** 2026-06-03

---

# Overview

Offset-Based Pagination is the traditional pagination strategy using `LIMIT ? OFFSET ?` SQL clauses to skip a number of records and return a fixed-size page. It exists as the simplest pagination approach — every developer understands it, it supports direct page number navigation, and it's the default in Laravel's `paginate()` method.

Engineers must care because while offset pagination is simple and ubiquitous, it has well-known performance and consistency limitations at scale. Understanding when offset pagination is appropriate and when to migrate to cursor-based alternatives is essential for building APIs that perform well at any data volume.

---

# Core Concepts

**LIMIT/OFFSET:** `SELECT * FROM users LIMIT 10 OFFSET 20` — skip 20 records, return 10. The 3rd page of 10-record pages.

**Total Count:** `SELECT COUNT(*) FROM users` — provides the total number of records for page count calculation.

**Page Parameter:** Requested page number (`?page=2`) — calculated from offset: `offset = (page - 1) * per_page`.

**Per Page Parameter:** Records per page (`?per_page=15`) — maximum number of records returned.

**Offset Drift:** When records are inserted or deleted between requests, subsequent pages return shifted results — records may appear on multiple pages or be skipped.

---

# When To Use

- Small to medium datasets (<10,000 records)
- UIs requiring direct page number navigation (page 1, 2, 3...)
- Admin panels and dashboards where total count is meaningful
- APIs where simplicity is preferred over maximum performance
- Legacy systems already using offset pagination without performance issues

---

# When NOT To Use

- Large datasets (>10,000 records) — performance degrades with deep offsets
- Real-time data with frequent inserts/deletes — offset drift produces inconsistent results
- Infinite scroll UIs — cursor pagination is more natural
- APIs where pagination stability is critical (financial data, audit logs)

---

# Best Practices

**Set a maximum per_page limit.** 100 records per page is a reasonable maximum. Reject or clamp values above the limit.

**Always return total count.** `meta.total` enables UI page number navigation. Use `->paginate()` which includes total.

**Use page parameter, not raw offset.** `?page=2` is more intuitive than `?offset=20`. Laravel's `paginate()` handles this.

**Include page metadata.** Current page, per page, total, last page, and links to first/previous/next/last pages.

**Cache total count for large datasets.** `COUNT(*)` on large tables is expensive. Cache with reasonable TTL.

---

# Architecture Guidelines

**Offset pagination uses Laravel's built-in `paginate()` or `simplePaginate()`.** The framework handles LIMIT/OFFSET generation, metadata calculation, and link generation.

**Response format includes pagination metadata in a `meta` or `links` object.** Laravel's `PaginatedResourceResponse` provides this.

**Filtering and sorting are composed on the query before pagination.** Apply `->where()` and `->orderBy()` before `->paginate()`.

**Per-page validation belongs in Form Requests or a pagination trait.** Clamp `per_page` to valid range.

---

# Performance Considerations

**Deep offsets are slow.** `LIMIT 10 OFFSET 100000` requires the database to scan and discard 100,000 rows. Consider cursor pagination for deep pages.

**COUNT(*) on large tables adds latency.** For tables with millions of rows, `COUNT(*)` may take 100ms+. Cache or use approximate counts.

**Simple paginate vs paginate.** `simplePaginate()` skips the COUNT query but doesn't provide total pages. Use for infinite scroll.

**Eager loading affects pagination.** N+1 issues are amplified when paginating — each page load triggers the same N+1.

---

# Security Considerations

**Validate page and per_page parameters.** Clamp `per_page` to prevent large page requests from overwhelming the database.

**Prevent negative page numbers.** Page 0 or negative pages may expose unexpected data.

**Rate limit deep pagination.** Pages beyond 1000 may indicate abuse or web scraping.

**Authorization is independent of pagination.** Pagination does not authorize individual records.

---

# Common Mistakes

**No maximum per_page.** Clients request 1000 records per page, causing slow responses and high database load.

**No total count for large datasets.** `COUNT(*)` on multi-million record tables added to every paginated request.

**Unvalidated page parameter.** Page 0 returns unexpected results; page -1 may expose data.

**Offset drift not considered.** Developers assume paginated results are stable, but insertions shift offsets.

**Counting all pages when only first few are visited.** Computing total count for deep pages that users never reach.

---

# Anti-Patterns

**Deep Offset Abuse:** Supporting pagination to page 10,000+ with offset pagination. Each request scans millions of rows.
**Better approach:** Enforce maximum page number. Recommend cursor pagination for deep navigation. Block excessively deep pages.

**Unlimited Per Page:** Allowing any `per_page` value without clamping.
**Better approach:** Set minimum (1) and maximum (100) per_page limits. Clamp out-of-range values.

**Missing Total Count:** Using `simplePaginate()` without total count when the UI requires page number navigation.
**Better approach:** Use `paginate()` when total count is needed. Use `simplePaginate()` only for infinite scroll.

**COUNT(*) On Every Request:** Computing total count on every paginated request for large, unchanged tables.
**Better approach:** Cache total count with TTL. Invalidate on create/delete.

---

# Examples

**Offset pagination usage:**
```
$users = User::query()
    ->where('active', true)
    ->orderBy('name')
    ->paginate(
        perPage: $request->input('per_page', 15),
        page: $request->input('page', 1)
    );

return UserResource::collection($users);
```

---

# Related Topics

**Prerequisites:**
- SQL LIMIT/OFFSET Understanding
- Laravel Pagination Basics

**Closely Related Topics:**
- Per-Page Parameter Design — configuring page size
- Offset Pagination Performance — optimization techniques
- Pagination Metadata Design — response format

**Advanced Follow-Up Topics:**
- Offset to Cursor Migration — transitioning strategies
- Total Count Performance — counting optimization

**Cross-Domain Connections:**
- Pagination Strategy Selection — choosing the right approach
- Pagination Link Headers — Link header pagination
