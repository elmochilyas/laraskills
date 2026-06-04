# ECC Anti-Patterns — Pagination Metadata

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | API Resources |
| **Knowledge Unit** | Pagination Metadata |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Missing or Inconsistent Pagination Metadata Across List Endpoints
2. Unbounded `per_page` Parameter (DoS Vector)
3. Large Offset Pagination Without Cursor Fallback
4. Collection Receiving Plain Collection Instead of Paginator

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries (COUNT on large tables without cursor pagination)
- Premature Optimization (cursor pagination for <1K row tables)

---

## Anti-Pattern 1: Missing or Inconsistent Pagination Metadata

### Category
Design | Reliability

### Description
Some list endpoints return pagination metadata while others return bare arrays. Clients cannot rely on the response having navigation information.

### Why It Happens
Different developers wrote different list endpoints. Some used `User::paginate()` (auto metadata), others used `User::all()` (no metadata).

### Warning Signs
- Some list responses have `links` and `meta`, others return bare `data` arrays
- No base collection class enforces pagination structure
- Client code checks `if (response.links)` before using pagination

### Preferred Alternative
Standardize pagination metadata structure via a base collection class. All list endpoints must return consistent `links` and `meta`.

### Related Rules
- Rule: Always Include `per_page` and `total` in Paginated Responses

---

## Anti-Pattern 2: Unbounded `per_page` Parameter

### Category
Security | Performance

### Description
Allowing clients to request any `per_page` value without a cap, enabling oversized response attacks.

### Why It Happens
The controller passes `$request->input('per_page', 20)` directly to `paginate()` without validation.

### Warning Signs
- `paginate($request->input('per_page'))` without `min()` or validation
- No maximum page size documented in API docs
- Client requests `per_page=10000` and receives it

### Preferred Alternative
Cap `per_page` at a reasonable maximum: `paginate(min($request->input('per_page', 20), 100))`.

### Related Rules
- Rule: Set Reasonable Defaults and Maximums for `per_page`
