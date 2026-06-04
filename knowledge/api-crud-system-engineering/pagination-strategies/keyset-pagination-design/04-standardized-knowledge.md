| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Pagination Strategies |
| **Metadata** | Knowledge Unit | Keyset Pagination Design |
| **Metadata** | Difficulty | Intermediate |
| **Metadata** | Dependencies | SQL Query Execution, Cursor Pagination Design |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Keyset pagination (seek pagination, "the WHERE method") is a database-level pagination strategy that uses a WHERE clause on the sort columns to fetch the next page, rather than LIMIT/OFFSET. It is identical in concept to cursor pagination but implemented entirely in SQL without opaque tokens — the client sends the last seen values directly as query parameters. Keyset pagination offers O(1) performance at any depth and immunity to phantom reads, making it ideal for deep pagination scenarios where clients can be trusted with the sort column values.

## Core Concepts

- **Keyset WHERE Clause**: Instead of OFFSET, use `WHERE (created_at, id) < ('2026-06-01', 100)` to find the next page.
- **Transparent Parameters**: Clients send raw column values as query parameters (e.g., `after_id=100`, `after_created_at=2026-06-01`).
- **Row Constructor Syntax**: PostgreSQL and MySQL support `(col1, col2) > (val1, val2)` for cleaner, optimizable queries.
- **No Encoding Overhead**: No encode/decode step — values are sent as-is, simplifying debugging.
- **Direction Support**: `after_*` parameters for forward pagination, `before_*` for backward.

## When To Use

- Internal APIs and admin panels where clients are trusted and debugging transparency is valued.
- When sort column values are already visible in API responses (e.g., `id`, `created_at`) — keyset adds no additional exposure.
- Scenarios requiring maximum debuggability — raw values in logs and query strings.
- When clients need to bookmark and resume pagination from a specific known position.
- Any scenario where cursor pagination is suitable but cursor opaqueness is unnecessary.

## When NOT To Use

- When sort column values must remain hidden from clients (e.g., internal `position` for admin ordering).
- For public APIs where cursor opaqueness is a security or design requirement.
- When the sort columns include sensitive data that should not appear in URLs or logs.
- When clients cannot handle multiple parameters for pagination (e.g., legacy integrations expecting a single cursor token).
- When the sort column is a float or other type where equality comparison may produce floating-point issues.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Always include a tiebreaker (PK) in the keyset | Non-unique sort columns cause non-deterministic page boundaries |
| Use consistent `after_` / `before_` parameter naming | Clear, self-documenting parameter names reduce client confusion |
| Require `direction=next` or `direction=prev` | Prevents clients from sending conflicting `after_` and `before_` params simultaneously |
| Validate parameter types server-side | Type mismatch (string vs integer) causes incorrect database comparisons |
| Use parameterized queries (Eloquent), never raw interpolation | Raw interpolation opens SQL injection vectors through keyset parameters |
| Include all query parameters (filters) in pagination links | Preserving filter context ensures keysets remain valid across pages |

## Architecture Guidelines

- Use `forPageAfterId()` for simple primary-key-based keyset pagination in Laravel.
- For multi-column keysets, implement manually or use `cursorPaginate()` (which handles encoding automatically).
- Generate fresh keyset values from the current query's results — reusing keysets across different filter contexts produces incorrect results.
- Define a default sort order when no `after_*` parameters are provided (start from the beginning).
- Document the keyset parameters clearly in the API reference, including which columns are exposed.

## Performance Considerations

- Keyset pagination has identical O(1) performance to cursor pagination — both use index range scans.
- Row constructor syntax `(a, b) > (x, y)` is optimized in PostgreSQL and MySQL 8.0+ for single index range scans.
- Boolean expressions (`a > x OR (a = x AND b > y)`) may be less optimized in some databases; prefer row constructor syntax.
- LIMIT+1 for has-more detection adds negligible cost.
- The WHERE clause must match the ORDER BY index exactly for optimal performance.

## Security Considerations

- Keyset parameters are used directly in SQL WHERE clauses — always use parameterized queries, never raw string interpolation.
- Exposing sort column values may leak internal record ordering, sequential IDs, or temporal patterns.
- Clients can manipulate keyset parameters to attempt to access records outside their authorization scope — validate authorization independently.
- Keyset values reveal whether IDs are sequential or UUID-based — document this as a design consideration.
- Logging keyset parameters exposes sort column values; sanitize logs if values are sensitive.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not including a tiebreaker | Sorting by `created_at` which appears unique | Non-deterministic ordering with duplicate timestamps | Always include primary key as final sort column |
| Using mixed after_ and before_ parameters | Implementing both directions without guarding | Contradictory WHERE clause; incorrect or empty results | Require `direction=next` or `direction=prev` |
| Reusing keysets across different filter contexts | Not scoping keyset to the query's filter set | Keyset position is meaningless in a different filtered view | Always generate fresh keysets from current query results |
| Using raw string interpolation for keyset values | Not using parameterized queries | SQL injection vulnerability | Always use Eloquent or bound parameters |

## Anti-Patterns

- **Using keyset pagination for public APIs without security review**: Exposed sort columns may leak business intelligence.
- **Relying on client to send correct keyset values**: Clients can send any values; validate they correspond to real records.
- **Implementing keyset without a default sort**: No default means no valid query when keyset parameters are absent.
- **Forging keyset values across user contexts**: A cursor from one user's filtered view is invalid for another user.
- **Using keyset with dynamically generated sort columns**: The composite index can only match one predetermined column order.

## Examples

- **Single-column keyset (by PK)**: `SELECT * FROM users WHERE id > 100 ORDER BY id ASC LIMIT 15`
- **Multi-column keyset**: `SELECT * FROM posts WHERE (created_at, id) < ('2026-06-01', 100) ORDER BY created_at DESC, id DESC LIMIT 15`
- **Laravel forPageAfterId()**: `Post::forPageAfterId(15, $lastId)->get()`
- **Parameter naming**: `GET /posts?after_id=100&after_created_at=2026-06-01&limit=15`
- **Row constructor syntax (PG/MySQL)**: `SELECT * FROM posts WHERE (created_at, id) > ('2026-06-01', 100) ORDER BY created_at ASC, id ASC LIMIT 15`

## Related Topics

- Cursor Pagination Design — Conceptual equivalent with opaque tokens
- Multi-Column Cursor Pagination — Advanced keyset with many sort columns
- Pagination Strategy Selection — Keyset vs offset vs cursor comparison
- Offset-to-Cursor Migration — Moving from offset to keyset pagination

## AI Agent Notes

- For internal APIs, prefer keyset pagination over cursor pagination — it's more transparent and debuggable.
- When generating keyset code, always use Eloquent parameter binding, never raw WHERE clauses.
- For Laravel, prefer `cursorPaginate()` over manual keyset implementation for multi-column sorts.
- Always validate that `after_*` values are the correct type (integer, ISO 8601 date, etc.).
- Include a tiebreaker column in every keyset implementation, even if the primary sort column appears unique.

## Verification

- [ ] Keyset WHERE clause uses parameterized queries (Eloquent) — no string interpolation
- [ ] Tiebreaker column (primary key) is always included as final sort column
- [ ] Forward (`after_*`) and backward (`before_*`) parameters are mutually exclusive
- [ ] Parameter types are validated before query execution
- [ ] Execution plan shows Index Range Scan for keyset queries
- [ ] Default sort order defined for requests without keyset parameters
- [ ] Keyset values generated fresh from query results, not reused across filter contexts
- [ ] API documentation clearly states which columns are exposed via keyset parameters
- [ ] sensitive sort columns are not exposed (use cursor pagination instead if they are)
